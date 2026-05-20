'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { HeaderHints } from '@/features/orders/detail/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasSeries: boolean;
  hints: HeaderHints;
  loading: boolean;
  onConfirm: () => void;
};

export function CompleteOccurrenceDialog({
  open,
  onOpenChange,
  hasSeries,
  hints,
  loading,
  onConfirm,
}: Props) {
  const body = hasSeries
    ? hints.completeOccurrenceConfirmSeriesBody
    : hints.completeOccurrenceConfirmBody;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{hints.completeOccurrenceConfirmTitle}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {hints.completeOccurrenceConfirmCancel}
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {hints.completeOccurrenceConfirmYes}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
