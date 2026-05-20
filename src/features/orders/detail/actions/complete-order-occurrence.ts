'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';
import { z } from 'zod';

type RpcResult = {
  ok: boolean;
  advanced: boolean;
  new_order_id: string | null;
  series_closed: 'completed' | 'excessive_cancellations' | 'cancelled' | null;
};

type Success = {
  data: {
    ok: true;
    advanced: boolean;
    new_order_id: string | null;
    new_order_number: number | null;
    series_closed: RpcResult['series_closed'];
  };
};
type Result = Success | { error: { message: string } };

const inputSchema = z.object({ orderId: z.string().uuid() });

type CompleteArgs = Database['public']['Functions']['complete_order_and_advance']['Args'];

export async function completeOrderOccurrence(input: unknown): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { orderId } = parsed.data;

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const actorId = auth.user?.id ?? null;

  const admin = createAdminClient();
  const rpcArgs = { p_order_id: orderId, p_actor_id: actorId };
  const { data, error } = await admin.rpc(
    'complete_order_and_advance',
    rpcArgs as unknown as CompleteArgs,
  );
  if (error) return { error: { message: error.message } };

  const result = (data ?? {}) as Partial<RpcResult>;
  let newOrderNumber: number | null = null;
  if (result.new_order_id) {
    const { data: row } = await admin
      .from('orders')
      .select('order_number')
      .eq('id', result.new_order_id)
      .maybeSingle();
    newOrderNumber = row?.order_number ?? null;
  }

  revalidatePath('/[locale]/(admin)/admin/orders', 'page');
  revalidatePath('/[locale]/(admin)/admin/orders/[id]', 'page');

  return {
    data: {
      ok: true,
      advanced: Boolean(result.advanced),
      new_order_id: result.new_order_id ?? null,
      new_order_number: newOrderNumber,
      series_closed: (result.series_closed as RpcResult['series_closed']) ?? null,
    },
  };
}
