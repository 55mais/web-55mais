'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getServiceForHire } from '@/features/service-hire/actions/get-service-for-hire';
import { getHireLocationOptions } from '@/features/service-hire/actions/get-hire-location-options';
import type { PublishedServiceOption } from '@/features/service-hire/actions/list-published-services';
import type { ServiceForHire } from '@/features/service-hire/actions/get-service-for-hire';
import type { HireLocationOptions } from '@/features/service-hire/lib/hire-location-types';
import type { FiscalIdTypeOption } from '@/features/service-hire/actions/list-fiscal-id-types';
import { buildServiceHireHints } from '@/features/service-hire/lib/build-hints';
import { ServiceHireWizard } from '@/features/service-hire/components/wizard';

type Props = {
  services: PublishedServiceOption[];
  locale: string;
  fiscalIdTypes: FiscalIdTypeOption[];
};

export function TestServiceHirePage({ services, locale, fiscalIdTypes }: Props) {
  const t = useTranslations('AdminTestServiceHire');
  const tg = useTranslations();
  const [serviceId, setServiceId] = useState<string>('');
  const [service, setService] = useState<ServiceForHire | null>(null);
  const [locationOptions, setLocationOptions] =
    useState<HireLocationOptions | null>(null);
  const [isLoading, startTransition] = useTransition();

  const handleSelect = (id: string) => {
    setServiceId(id);
    if (!id) {
      setService(null);
      setLocationOptions(null);
      return;
    }
    startTransition(async () => {
      const [data, opts] = await Promise.all([
        getServiceForHire(id, locale),
        getHireLocationOptions(id, locale),
      ]);
      setService(data);
      setLocationOptions(opts);
    });
  };

  const reset = () => {
    setServiceId('');
    setService(null);
    setLocationOptions(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="service-picker">{t('chooseService')}</Label>
        <Select value={serviceId} onValueChange={(v) => handleSelect(v ?? '')}>
          <SelectTrigger id="service-picker">
            <SelectValue placeholder={t('chooseServicePlaceholder')}>
              {(v: string) =>
                services.find((s) => s.id === v)?.name ??
                t('chooseServicePlaceholder')
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {services.length === 0 && (
          <p className="text-muted-foreground text-xs italic">{t('noServices')}</p>
        )}
      </div>

      {isLoading && (
        <p className="text-muted-foreground text-sm">{t('loading')}</p>
      )}

      {service && locationOptions && !isLoading && (
        <div className="space-y-3 rounded-md border p-4">
          <p className="text-muted-foreground text-xs">
            {t('countriesLabel')}: {service.activeCountryCodes.join(', ') || '—'}{' '}
            · {t('questionsCount', { count: service.questions.length })}
          </p>
          <ServiceHireWizard
            service={service}
            locale={locale}
            fiscalIdTypes={fiscalIdTypes}
            hints={buildServiceHireHints(tg, service.name)}
            locationOptions={locationOptions}
            onClose={reset}
          />
        </div>
      )}
    </div>
  );
}
