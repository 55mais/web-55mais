-- Recurring orders — M1.c (S1b, admin side). Adds the two admin-facing
-- RPCs that drive the order detail page. Both route status changes through
-- set_order_status so order_status_history stays canonical, and both call
-- _materialize_next_occurrence when a follow-up session is required.

-- ---------------------------------------------------------------------------
-- complete_order_and_advance — completes the current occurrence and, if
-- part of an active series with more sessions to go, materializes the next.
-- Closes the series when the last occurrence is completed.
-- Concurrency: FOR UPDATE on order + series; UNIQUE(series_id, sequence_no)
-- is the second-line race defense.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_order_and_advance(
  p_order_id uuid,
  p_actor_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_order  public.orders%ROWTYPE;
  v_ser    public.order_series%ROWTYPE;
  v_new_id uuid;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_order.status NOT IN ('pendiente','asignado','confirmado') THEN
    RAISE EXCEPTION 'invalid_transition: % -> completado', v_order.status
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_order.series_id IS NOT NULL THEN
    SELECT * INTO v_ser FROM public.order_series WHERE id = v_order.series_id FOR UPDATE;
    IF v_ser.status <> 'active' THEN
      RAISE EXCEPTION 'series_not_active' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  PERFORM public.set_order_status(p_order_id, 'completado', p_actor_id, NULL);

  IF v_order.series_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'advanced', false,
      'new_order_id', NULL, 'series_closed', NULL);
  END IF;

  UPDATE public.order_series
     SET occurrences_completed = occurrences_completed + 1,
         updated_at = now()
   WHERE id = v_order.series_id;
  SELECT * INTO v_ser FROM public.order_series WHERE id = v_order.series_id;

  IF v_ser.occurrences_completed >= v_ser.total_occurrences THEN
    UPDATE public.order_series
       SET status = 'completed', closed_at = now(),
           closed_reason = 'all_occurrences_completed', updated_at = now()
     WHERE id = v_order.series_id;
    RETURN jsonb_build_object('ok', true, 'advanced', false,
      'new_order_id', NULL, 'series_closed', 'completed');
  END IF;

  v_new_id := public._materialize_next_occurrence(p_order_id);
  RETURN jsonb_build_object('ok', true, 'advanced', true,
    'new_order_id', v_new_id, 'series_closed', NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.complete_order_and_advance(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_order_and_advance(uuid, uuid)
  TO service_role;

-- ---------------------------------------------------------------------------
-- cancel_order_and_decide — cancels the current occurrence with two scopes:
--   only_this:      bump occurrences_cancelled, materialize next (unless
--                   safety net trips at completed+cancelled >= total*2).
--   this_and_future: kill the series.
-- Cancellations do NOT count toward total_occurrences; the client gets
-- exactly N completed sessions or the safety net trips.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_order_and_decide(
  p_order_id uuid,
  p_scope    text,
  p_reason   text,
  p_actor_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_order  public.orders%ROWTYPE;
  v_ser    public.order_series%ROWTYPE;
  v_new_id uuid;
BEGIN
  IF p_scope IS NULL OR p_scope NOT IN ('only_this','this_and_future') THEN
    RAISE EXCEPTION 'invalid_scope: %', p_scope USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_order.status IN ('cancelado','rechazado','archivado','terminado','completado') THEN
    RAISE EXCEPTION 'invalid_transition: % -> cancelado', v_order.status
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_order.series_id IS NOT NULL THEN
    SELECT * INTO v_ser FROM public.order_series WHERE id = v_order.series_id FOR UPDATE;
    IF v_ser.status <> 'active' THEN
      RAISE EXCEPTION 'series_not_active' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  PERFORM public.set_order_status(p_order_id, 'cancelado', p_actor_id, p_reason);

  IF v_order.series_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'scope', p_scope,
      'new_order_id', NULL, 'series_closed', NULL);
  END IF;

  IF p_scope = 'this_and_future' THEN
    UPDATE public.order_series
       SET status = 'cancelled', closed_at = now(),
           closed_reason = COALESCE(p_reason, 'cancelled_by_admin'),
           updated_at = now()
     WHERE id = v_order.series_id;
    RETURN jsonb_build_object('ok', true, 'scope', 'this_and_future',
      'new_order_id', NULL, 'series_closed', 'cancelled');
  END IF;

  -- only_this
  UPDATE public.order_series
     SET occurrences_cancelled = occurrences_cancelled + 1, updated_at = now()
   WHERE id = v_order.series_id;
  SELECT * INTO v_ser FROM public.order_series WHERE id = v_order.series_id;

  IF v_ser.occurrences_completed + v_ser.occurrences_cancelled
     >= v_ser.total_occurrences * 2 THEN
    UPDATE public.order_series
       SET status = 'cancelled', closed_at = now(),
           closed_reason = 'excessive_cancellations', updated_at = now()
     WHERE id = v_order.series_id;
    RETURN jsonb_build_object('ok', true, 'scope', 'only_this',
      'new_order_id', NULL, 'series_closed', 'excessive_cancellations');
  END IF;

  v_new_id := public._materialize_next_occurrence(p_order_id);
  RETURN jsonb_build_object('ok', true, 'scope', 'only_this',
    'new_order_id', v_new_id, 'series_closed', NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_order_and_decide(uuid, text, text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order_and_decide(uuid, text, text, uuid)
  TO service_role;
