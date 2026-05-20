'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateOrderStatus } from '@/features/orders/detail/actions/update-order-status';
import type {
  HeaderHints,
  OrderStatusLabels,
} from '@/features/orders/detail/types';
import { ORDER_STATUSES, type OrderStatus } from '@/features/orders/types';

type Props = {
  orderId: string;
  status: OrderStatus;
  statusLabels: OrderStatusLabels;
  hasSeries: boolean;
  seriesActive: boolean;
  hints: HeaderHints;
  onStatusChanged: () => void;
  /** Invoked when the user picks "completado" — the parent owns the
   *  confirmation dialog + RPC call so the series-aware completion path
   *  always goes through the same handler. */
  onCompleteRequested: () => void;
};

export function OrderStatusSelect({
  orderId,
  status,
  statusLabels,
  hasSeries,
  seriesActive,
  hints,
  onStatusChanged,
  onCompleteRequested,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: string | null) => {
    if (!next || next === status) return;
    const nextStatus = next as OrderStatus;
    if (nextStatus === 'completado') {
      // Series and non-series both route through the parent-owned dialog +
      // complete_order_and_advance RPC. The RPC handles non-series orders
      // by simply marking them completed (advanced=false).
      if (hasSeries && !seriesActive) {
        toast.error(hints.completeOccurrenceError);
        return;
      }
      onCompleteRequested();
      return;
    }
    startTransition(async () => {
      const res = await updateOrderStatus({ orderId, status: nextStatus });
      if ('error' in res) {
        toast.error(res.error.message || hints.statusUpdateError);
        return;
      }
      toast.success(hints.statusUpdateSuccess);
      onStatusChanged();
    });
  };

  return (
    <Select
      value={status}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger size="sm" className="h-8 min-w-[10rem]">
        <SelectValue>
          {(v: string) =>
            statusLabels[v as OrderStatus] ?? statusLabels[status]
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {statusLabels[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
