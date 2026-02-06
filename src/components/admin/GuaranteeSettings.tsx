import React, { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';

type GuaranteeTypes = 'cash' | 'credit' | 'items';

const STORAGE_KEY = 'guarantee_settings_v2'; // Bump version for schema change

export default function GuaranteeSettings() {
  const { lang } = useLanguage();
  const [available, setAvailable] = useState<Record<GuaranteeTypes, boolean>>({
    cash: true,
    credit: true,
    items: true,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAvailable(JSON.parse(saved));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(available)); } catch {}
  }, [available]);

  const toggle = (k: GuaranteeTypes) => {
    setAvailable(prev => ({ ...prev, [k]: !prev[k] }));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg">{t(lang, 'guaranteeSettings_title')}</h3>
      <p className="text-sm text-muted-foreground">Configure quais tipos de garantia estarão disponíveis para aluguéis.</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border">
          <div>
            <p className="font-medium">{t(lang, 'guarantee_type_cash')}</p>
            <p className="text-xs text-muted-foreground">{t(lang, 'guarantee_desc_cash')}</p>
          </div>
          <Switch checked={available.cash} onCheckedChange={() => toggle('cash')} />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border">
          <div>
            <p className="font-medium">{t(lang, 'guarantee_type_credit')}</p>
            <p className="text-xs text-muted-foreground">{t(lang, 'guarantee_desc_credit')}</p>
          </div>
          <Switch checked={available.credit} onCheckedChange={() => toggle('credit')} />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border">
          <div>
            <p className="font-medium">{t(lang, 'guarantee_type_items')}</p>
            <p className="text-xs text-muted-foreground">{t(lang, 'guarantee_desc_items')}</p>
          </div>
          <Switch checked={available.items} onCheckedChange={() => toggle('items')} />
        </div>
      </div>

      <div className="pt-2">
        <Button onClick={() => alert('Configurações salvas')}>{t(lang, 'save') || 'Salvar'}</Button>
      </div>
    </div>
  );
}
