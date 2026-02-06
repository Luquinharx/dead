import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';

interface RulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ open, onOpenChange }) => {
  const { lang } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-card border-border cyber-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t(lang, 'rentalRulesTitle')}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t(lang, 'rentTerms_paragraph4')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="bg-gray-800 text-white rounded-md py-3 px-4 text-center font-bold text-lg">
            {t(lang, 'rentalStartProcess')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{t(lang, 'page13Transfer')}</p>
              <h4 className="font-semibold mt-2">{t(lang, 'ruleStart1Title')}</h4>
              <ul className="text-sm mt-2 list-disc list-inside text-muted-foreground">
                <li>{t(lang, 'ruleStart1Desc1')}</li>
                <li>{t(lang, 'ruleStart1Desc2')}</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">{t(lang, 'page12Collateral')}</p>
              <h4 className="font-semibold mt-2">{t(lang, 'ruleStart2Title')}</h4>
              <ul className="text-sm mt-2 list-disc list-inside text-muted-foreground">
                <li>{t(lang, 'ruleStart2Desc1')}</li>
                <li>{t(lang, 'ruleStart2Desc2')}</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">{t(lang, 'page11Armoury')}</p>
              <h4 className="font-semibold mt-2">{t(lang, 'ruleStart3Title')}</h4>
              <ul className="text-sm mt-2 list-disc list-inside text-muted-foreground">
                <li>{t(lang, 'ruleStart3Desc1')}</li>
                <li>{t(lang, 'ruleStart3Desc2')}</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-800 text-white rounded-md py-3 px-4 text-center font-bold text-lg">
            {t(lang, 'rentalReturnProcess')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold">{t(lang, 'ruleReturn1Title')}</h4>
              <p className="text-sm text-muted-foreground mt-2">{t(lang, 'ruleReturn1Desc')}</p>
            </div>
            <div>
              <h4 className="font-semibold">{t(lang, 'ruleReturn2Title')}</h4>
              <ul className="text-sm mt-2 list-disc list-inside text-muted-foreground">
                <li>{t(lang, 'ruleReturn2Desc1')}</li>
                <li>{t(lang, 'ruleReturn2Desc2')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold">{t(lang, 'ruleReturn3Title')}</h4>
              <ul className="text-sm mt-2 list-disc list-inside text-muted-foreground">
                <li>{t(lang, 'ruleReturn3Desc1')}</li>
                <li>{t(lang, 'ruleReturn3Desc2')}</li>
                <li>{t(lang, 'ruleReturn3Desc3')}</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>{lang === 'pt' ? 'Fechar' : 'Close'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RulesModal;
