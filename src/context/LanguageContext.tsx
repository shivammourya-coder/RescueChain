import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language, TranslationStrings } from "../i18n/translations";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationStrings;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("rescuechain_lang");
    return (saved === "hi" || saved === "en") ? saved : "en";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("rescuechain_lang", newLang);
  };

  const toggleLang = () => {
    setLang(lang === "en" ? "hi" : "en");
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang], toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
