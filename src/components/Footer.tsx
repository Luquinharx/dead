import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';

export const Footer: React.FC = () => {
  const { lang } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 py-6 border-t border-border/50 text-center">
      <div className="text-sm text-muted-foreground">
        {t(lang, 'rightsReserved')} © {year} — {t(lang, 'builtBy')}
      </div>
    </footer>
  );
};

export default Footer;
