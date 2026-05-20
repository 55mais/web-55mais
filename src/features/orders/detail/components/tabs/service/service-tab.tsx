'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { ChevronDown, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  ServiceTabContext,
  ServiceTabData,
  ServiceTabHints,
  SectionHints,
} from '../../../types';
import { LanguageSection } from './language-section';
import { AddressSection } from './address-section';
import { ServiceAnswersSection } from './service-answers-section';
import { RecurrenceSection } from './recurrence-section';
import { NotesSection } from './notes-section';

export type SectionKey =
  | 'language'
  | 'address'
  | 'serviceAnswers'
  | 'recurrence'
  | 'notesData';

type Props = {
  orderId: string;
  data: ServiceTabData;
  context: ServiceTabContext;
  hints: ServiceTabHints;
  locale: string;
  onSectionSaved: () => void;
  readOnly?: boolean;
};

const INITIAL_DIRTY: Record<SectionKey, boolean> = {
  language: false,
  address: false,
  serviceAnswers: false,
  recurrence: false,
  notesData: false,
};

export function ServiceTab({
  orderId,
  data,
  context,
  hints,
  locale,
  onSectionSaved,
  readOnly = false,
}: Props) {
  const [openSection, setOpenSection] = useState<SectionKey | null>('language');
  const [dirtyMap, setDirtyMap] = useState<Record<SectionKey, boolean>>(INITIAL_DIRTY);

  const setDirty = useCallback((key: SectionKey, dirty: boolean) => {
    setDirtyMap((prev) => (prev[key] === dirty ? prev : { ...prev, [key]: dirty }));
  }, []);

  const handleToggle = useCallback(
    (key: SectionKey) => {
      const next: SectionKey | null = openSection === key ? null : key;
      if (openSection && openSection !== next && dirtyMap[openSection]) {
        if (!window.confirm(hints.section.unsavedPrompt)) return;
        setDirty(openSection, false);
      }
      setOpenSection(next);
    },
    [openSection, dirtyMap, hints.section.unsavedPrompt, setDirty],
  );

  const common = { orderId, context, hints, locale, onSaved: onSectionSaved, readOnly };
  const wire = (key: SectionKey) => ({
    open: openSection === key,
    onToggle: () => handleToggle(key),
    onDirtyChange: (d: boolean) => setDirty(key, d),
  });

  return (
    <div className="flex flex-col gap-3">
      <LanguageSection {...common} {...wire('language')} data={data.language} />
      <AddressSection {...common} {...wire('address')} data={data.address} />
      <ServiceAnswersSection
        {...common}
        {...wire('serviceAnswers')}
        data={data.serviceAnswers}
      />
      <RecurrenceSection
        {...common}
        {...wire('recurrence')}
        series={data.series}
        appointmentDate={data.appointment_date}
      />
      <NotesSection {...common} {...wire('notesData')} data={data.notesData} />
    </div>
  );
}

// ── SectionShell — used by all section components via
//    `import { SectionShell, Field } from './service-tab'`.

export type SectionShellProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  saving: boolean;
  canEdit?: boolean;
  readOnly?: boolean;
  sectionHints: SectionHints;
  previewText: string;
  readMode: ReactNode;
  editMode: ReactNode;
};

export function SectionShell({
  title,
  open,
  onToggle,
  editing,
  onStartEdit,
  onCancelEdit,
  onSave,
  saving,
  canEdit = true,
  readOnly = false,
  sectionHints,
  previewText,
  readMode,
  editMode,
}: SectionShellProps) {
  // In read-only mode, edit-mode is unreachable: the body always shows readMode
  // and the "Editar" button is hidden.
  const effectiveEditing = readOnly ? false : editing;
  const showEditButton = !readOnly && canEdit;
  return (
    <Card size="sm">
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between gap-2"
        onClick={onToggle}
      >
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <span className="font-medium">{title}</span>
          {!open && (
            <span className="truncate text-xs text-muted-foreground">{previewText}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </CardHeader>
      {open && (
        <CardContent className="flex flex-col gap-4 border-t pt-4">
          {!effectiveEditing ? (
            <>
              {readMode}
              {showEditButton && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={onStartEdit}>
                    <Pencil className="mr-1.5 size-3.5" />
                    {sectionHints.editLabel}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              {editMode}
              <div className="flex justify-end gap-2 border-t pt-3">
                <Button variant="ghost" size="sm" onClick={onCancelEdit} disabled={saving}>
                  {sectionHints.cancelLabel}
                </Button>
                <Button size="sm" onClick={onSave} disabled={saving}>
                  {sectionHints.saveLabel}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function Field({
  label,
  value,
  fallback,
}: {
  label: string;
  value: string | null;
  fallback: string;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm whitespace-pre-wrap">{value || fallback}</dd>
    </div>
  );
}
