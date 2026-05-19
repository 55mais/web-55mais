'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type { OrderTagOption } from '../types';

/**
 * Lists active order tags as `{ id, name }` for the order-detail tag
 * picker. Localized name falls back to slug. Boundaries forbid
 * importing `features/order-tags`, so the minimal query is inlined
 * here (house pattern, see `get-service-options.ts`).
 */
export async function getOrderTagOptions(locale: string): Promise<OrderTagOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('order_tags')
    .select('id, slug, i18n')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: localizedField(row.i18n as I18nRecord, locale, 'name') ?? row.slug,
  }));
}
