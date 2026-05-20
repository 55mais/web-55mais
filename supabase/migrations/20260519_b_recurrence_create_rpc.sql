-- Recurring orders — M1.b (S1b, wizard side). Adds:
--   * _materialize_next_occurrence: private helper (used by completion and
--     by cancel(only_this) to copy identity snapshot + satellite assignments).
--   * create_order_with_series: single-transaction series creation called
--     by submit-service-hire for the recurring branch.

-- ---------------------------------------------------------------------------
-- _materialize_next_occurrence — copies form_data, contact, location,
-- fiscal, billing_override and the satellite assignments (tags, talents,
-- subtypes); resets operational rows (order_notes, hours, billing lines,
-- payment items) by simply not copying them. Updates last_appointment_at
-- on the series so compute_next_slot is monotonic.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._materialize_next_occurrence(
  p_source_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_src  public.orders%ROWTYPE;
  v_ser  public.order_series%ROWTYPE;
  v_next timestamptz;
  v_new  uuid;
BEGIN
  SELECT * INTO v_src FROM public.orders WHERE id = p_source_id;
  IF NOT FOUND OR v_src.series_id IS NULL THEN
    RAISE EXCEPTION 'no_series_to_materialize';
  END IF;

  SELECT * INTO v_ser FROM public.order_series WHERE id = v_src.series_id;

  v_next := public.compute_next_slot(
    COALESCE(v_ser.last_appointment_at, v_src.appointment_date),
    v_ser.frequency, v_ser.weekdays, v_ser.day_of_month,
    v_ser.repeat_every, v_ser.time_start, v_ser.timezone
  );
  IF v_next IS NULL THEN
    RAISE EXCEPTION 'cannot_compute_next_slot';
  END IF;

  INSERT INTO public.orders (
    client_id, service_id, country_id,
    form_data, contact_email, contact_name, contact_phone, contact_address,
    service_address, service_city_id, service_postal_code,
    status, price_subtotal, price_tax_rate, price_tax, price_total, currency,
    schedule_type, notes, talents_needed, preferred_language, timezone,
    contact_fiscal_id_type_id, contact_fiscal_id, billing_override,
    series_id, sequence_no, appointment_date, payment_status
  ) VALUES (
    v_src.client_id, v_src.service_id, v_src.country_id,
    v_src.form_data, v_src.contact_email, v_src.contact_name, v_src.contact_phone, v_src.contact_address,
    v_src.service_address, v_src.service_city_id, v_src.service_postal_code,
    'pendiente', v_src.price_subtotal, v_src.price_tax_rate, v_src.price_tax, v_src.price_total, v_src.currency,
    v_src.schedule_type, v_src.notes, v_src.talents_needed, v_src.preferred_language, v_src.timezone,
    v_src.contact_fiscal_id_type_id, v_src.contact_fiscal_id, v_src.billing_override,
    v_src.series_id, v_src.sequence_no + 1, v_next, 'pending'
  ) RETURNING id INTO v_new;

  INSERT INTO public.order_tag_assignments (order_id, tag_id, assigned_by)
    SELECT v_new, tag_id, assigned_by FROM public.order_tag_assignments WHERE order_id = v_src.id
    ON CONFLICT (order_id, tag_id) DO NOTHING;

  INSERT INTO public.order_talents (order_id, talent_id, is_primary, assigned_by)
    SELECT v_new, talent_id, is_primary, assigned_by FROM public.order_talents WHERE order_id = v_src.id
    ON CONFLICT (order_id, talent_id) DO NOTHING;

  INSERT INTO public.order_subtypes (order_id, subtype_id, question_key)
    SELECT v_new, subtype_id, question_key FROM public.order_subtypes WHERE order_id = v_src.id
    ON CONFLICT (order_id, subtype_id, question_key) DO NOTHING;

  UPDATE public.order_series
     SET last_appointment_at = v_next, updated_at = now()
   WHERE id = v_src.series_id;

  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION public._materialize_next_occurrence(uuid)
  FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- create_order_with_series — wizard's "recurring" branch entrypoint.
-- First-slot math is naive (no skip): first matching weekday on or after
-- start_date for weekly; start_date month + clamped day_of_month for
-- monthly (jumps to next month if the clamped target is in the past).
-- compute_next_slot's skip-every-N logic applies only between occurrences.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_with_series(
  p_client_id                  uuid,
  p_service_id                 uuid,
  p_country_id                 uuid,
  p_service_city_id            uuid,
  p_service_address            text,
  p_service_postal_code        text,
  p_timezone                   text,
  p_contact_name               text,
  p_contact_email              text,
  p_contact_phone              text,
  p_contact_fiscal_id_type_id  uuid,
  p_contact_fiscal_id          text,
  p_billing_override           jsonb,
  p_notes                      text,
  p_form_data                  jsonb,
  p_frequency                  text,
  p_weekdays                   int[],
  p_day_of_month               int,
  p_repeat_every               int,
  p_time_start                 time,
  p_time_end                   time,
  p_hours_per_session          numeric,
  p_start_date                 date,
  p_total_occurrences          int,
  p_subtypes                   jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_series_id uuid;
  v_order_id  uuid;
  v_first     timestamptz;
  v_cand      date;
  v_dow       int;
  v_year      int;
  v_month     int;
  v_max_dom   int;
  v_target    int;
  v_iter      int;
BEGIN
  IF p_frequency NOT IN ('weekly','monthly') THEN
    RAISE EXCEPTION 'invalid_frequency: %', p_frequency USING ERRCODE = 'check_violation';
  END IF;

  IF p_frequency = 'weekly' THEN
    IF p_weekdays IS NULL OR array_length(p_weekdays, 1) IS NULL THEN
      RAISE EXCEPTION 'weekly_requires_weekdays' USING ERRCODE = 'check_violation';
    END IF;
    v_cand := p_start_date;
    FOR v_iter IN 1..7 LOOP
      v_dow := EXTRACT(DOW FROM v_cand)::int;
      EXIT WHEN v_dow = ANY(p_weekdays);
      v_cand := v_cand + 1;
    END LOOP;
    IF NOT (EXTRACT(DOW FROM v_cand)::int = ANY(p_weekdays)) THEN
      RAISE EXCEPTION 'cannot_compute_first_slot' USING ERRCODE = 'check_violation';
    END IF;
    v_first := (v_cand + p_time_start) AT TIME ZONE p_timezone;
  ELSE
    IF p_day_of_month IS NULL THEN
      RAISE EXCEPTION 'monthly_requires_dom' USING ERRCODE = 'check_violation';
    END IF;
    v_year  := EXTRACT(YEAR  FROM p_start_date)::int;
    v_month := EXTRACT(MONTH FROM p_start_date)::int;
    v_max_dom := EXTRACT(DAY FROM (
      make_date(v_year, v_month, 1) + INTERVAL '1 month' - INTERVAL '1 day'
    ))::int;
    v_target := LEAST(p_day_of_month, v_max_dom);
    v_cand := make_date(v_year, v_month, v_target);
    IF v_cand < p_start_date THEN
      v_month := v_month + 1;
      IF v_month > 12 THEN v_month := 1; v_year := v_year + 1; END IF;
      v_max_dom := EXTRACT(DAY FROM (
        make_date(v_year, v_month, 1) + INTERVAL '1 month' - INTERVAL '1 day'
      ))::int;
      v_target := LEAST(p_day_of_month, v_max_dom);
      v_cand := make_date(v_year, v_month, v_target);
    END IF;
    v_first := (v_cand + p_time_start) AT TIME ZONE p_timezone;
  END IF;

  INSERT INTO public.order_series (
    frequency, weekdays, day_of_month, repeat_every,
    time_start, time_end, hours_per_session, timezone,
    start_date, last_appointment_at,
    total_occurrences, occurrences_completed, occurrences_cancelled, status
  ) VALUES (
    p_frequency, p_weekdays, p_day_of_month, COALESCE(p_repeat_every, 1),
    p_time_start, p_time_end, p_hours_per_session, p_timezone,
    p_start_date, v_first,
    p_total_occurrences, 0, 0, 'active'
  ) RETURNING id INTO v_series_id;

  INSERT INTO public.orders (
    client_id, service_id, country_id, service_city_id,
    service_address, service_postal_code, timezone,
    contact_name, contact_email, contact_phone,
    contact_fiscal_id_type_id, contact_fiscal_id, billing_override,
    notes, form_data, status, payment_status,
    price_subtotal, price_tax_rate, price_tax, price_total, currency,
    schedule_type, appointment_date, series_id, sequence_no
  ) VALUES (
    p_client_id, p_service_id, p_country_id, p_service_city_id,
    p_service_address, p_service_postal_code, p_timezone,
    p_contact_name, p_contact_email, p_contact_phone,
    p_contact_fiscal_id_type_id, p_contact_fiscal_id, p_billing_override,
    p_notes, COALESCE(p_form_data, '{}'::jsonb), 'pendiente', 'pending',
    0, 0, 0, 0, 'EUR',
    p_frequency, v_first, v_series_id, 1
  ) RETURNING id INTO v_order_id;

  IF p_subtypes IS NOT NULL AND jsonb_typeof(p_subtypes) = 'array' THEN
    INSERT INTO public.order_subtypes (order_id, subtype_id, question_key)
    SELECT v_order_id,
           (elem->>'subtype_id')::uuid,
           elem->>'question_key'
      FROM jsonb_array_elements(p_subtypes) AS elem
     WHERE (elem->>'subtype_id') IS NOT NULL
       AND (elem->>'question_key') IS NOT NULL
    ON CONFLICT (order_id, subtype_id, question_key) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'series_id', v_series_id,
    'first_appointment_at', v_first
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_series(
  uuid, uuid, uuid, uuid, text, text, text, text, text, text, uuid, text,
  jsonb, text, jsonb, text, int[], int, int, time, time, numeric, date, int, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_series(
  uuid, uuid, uuid, uuid, text, text, text, text, text, text, uuid, text,
  jsonb, text, jsonb, text, int[], int, int, time, time, numeric, date, int, jsonb
) TO service_role;
