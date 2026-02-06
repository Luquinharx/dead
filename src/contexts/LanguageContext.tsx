import React, { createContext, useContext, useEffect, useState } from 'react';

type Lang = 'pt' | 'en';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('site_lang');
      return (saved as Lang) || 'pt';
    } catch {
      return 'pt';
    }
  });

  useEffect(() => {
    try { localStorage.setItem('site_lang', lang); } catch {}
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const toggle = () => setLangState(prev => prev === 'pt' ? 'en' : 'pt');

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export type { Lang };
