'use client';

import { Badge } from '@/components/ui/badge';
import type { OrderSeriesSummary, ServiceTabHints } from '../../../types';
import { Field, SectionShell } from './service-tab';

type Props = {
  orderId: string;
  series: OrderSeriesSummary | null;
  appointmentDate: string | null;
  hints: ServiceTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  // Kept to maintain ServiceTab section signature; this section no longer
  // dirties (read-only) or saves, so these are no-ops here.
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
  readOnly?: boolean;
};

function formatWeekdays(weekdays: number[] | null, labels: string[]): string | null {
  if (!weekdays || weekdays.length === 0) return null;
  return weekdays
    .slice()
    .sort((a, b) => a - b)
    .map((d) => labels[d] ?? String(d))
    .join(', ');
}

function statusLabel(status: OrderSeriesSummary['status'], hints: ServiceTabHints): string {
  if (status === 'active') return hints.seriesStatusActive;
  if (status === 'completed') return hints.seriesStatusCompleted;
  return hints.seriesStatusCancelled;
}

export function RecurrenceSection({
  series,
  appointmentDate,
  hints,
  open,
  onToggle,
  readOnly = false,
}: Props) {
  const previewText = series
    ? `${hints.seriesSequenceTemplate(series.sequence_no, series.total_occurrences)} · ${statusLabel(series.status, hints)}`
    : (appointmentDate ?? hints.notProvided);

  const readMode = series ? (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field
        label={hints.seriesFrequencyLabel}
        value={
          series.frequency === 'weekly'
            ? hints.seriesFrequencyWeekly
            : hints.seriesFrequencyMonthly
        }
        fallback={hints.notProvided}
      />
      <Field
        label={hints.repeatEveryLabel}
        value={String(series.repeat_every)}
        fallback={hints.notProvided}
      />
      {series.frequency === 'weekly' && (
        <Field
          label={hints.weekdaysLabel}
          value={formatWeekdays(series.weekdays, hints.weekdayShort)}
          fallback={hints.notProvided}
        />
      )}
      {series.frequency === 'monthly' && (
        <Field
          label={hints.seriesDayOfMonthLabel}
          value={series.day_of_month !== null ? String(series.day_of_month) : null}
          fallback={hints.notProvided}
        />
      )}
      <Field
        label={hints.startDateLabel}
        value={series.start_date}
        fallback={hints.notProvided}
      />
      <Field
        label={hints.seriesTimeStartLabel}
        value={series.time_start ? series.time_start.slice(0, 5) : null}
        fallback={hints.notProvided}
      />
      <Field
        label={hints.seriesTimeEndLabel}
        value={series.time_end ? series.time_end.slice(0, 5) : null}
        fallback={hints.notProvided}
      />
      <Field
        label={hints.seriesTotalOccurrencesLabel}
        value={String(series.total_occurrences)}
        fallback={hints.notProvided}
      />
      <Field
        label={hints.seriesOccurrencesCompletedLabel}
        value={String(series.occurrences_completed)}
        fallback={hints.notProvided}
      />
      <Field
        label={hints.seriesOccurrencesCancelledLabel}
        value={String(series.occurrences_cancelled)}
        fallback={hints.notProvided}
      />
      <div className="flex flex-col">
        <dt className="text-xs text-muted-foreground">{hints.seriesStatusLabel}</dt>
        <dd className="text-sm">
          <Badge
            variant={
              series.status === 'cancelled'
                ? 'destructive'
                : series.status === 'completed'
                  ? 'outline'
                  : 'secondary'
            }
          >
            {statusLabel(series.status, hints)}
          </Badge>
        </dd>
      </div>
    </dl>
  ) : (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field
        label={hints.appointmentDateLabel}
        value={appointmentDate}
        fallback={hints.notProvided}
      />
    </dl>
  );

  return (
    <SectionShell
      title={hints.recurrenceTitle}
      open={open}
      onToggle={onToggle}
      editing={false}
      onStartEdit={() => {}}
      onCancelEdit={() => {}}
      onSave={() => {}}
      saving={false}
      canEdit={false}
      readOnly={readOnly}
      sectionHints={hints.section}
      previewText={previewText}
      readMode={readMode}
      editMode={null}
    />
  );
}
