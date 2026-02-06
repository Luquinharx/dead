import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';

interface AvailabilityBadgeProps {
  availability: 'available' | 'unavailable' | 'reserved';
  availableDays?: number;
}

export function AvailabilityBadge({ availability, availableDays }: AvailabilityBadgeProps) {
  const { lang } = useLanguage();
  if (availability === 'available') {
    return <Badge variant="available">{t(lang, 'availableLabel')}</Badge>;
  }

  if (availability === 'unavailable') {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <Badge variant="unavailable">{t(lang, 'unavailableLabel')}</Badge>
        {availableDays && availableDays > 0 && (
          <span className="text-xs text-muted-foreground ml-0.5">
            {t(lang, 'returnsIn').replace('{n}', String(availableDays))}
          </span>
        )}
      </div>
    );
  }

  return <Badge variant="reserved">{t(lang, 'reservedLabel')}</Badge>;
}
