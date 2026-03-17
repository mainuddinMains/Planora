import React, { createContext, useContext, useState, useEffect } from 'react';
import { en, es } from '../translations';

const translations = { en, es };

export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'zh', name: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', dir: 'ltr' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', dir: 'ltr' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', dir: 'ltr' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', dir: 'ltr' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', dir: 'ltr' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭', dir: 'ltr' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪', dir: 'ltr' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰', dir: 'ltr' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮', dir: 'ltr' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴', dir: 'ltr' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷', dir: 'ltr' },
  { code: 'he', name: 'עברית', flag: '🇮🇱', dir: 'rtl' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾', dir: 'ltr' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩', dir: 'ltr' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳', dir: 'ltr' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳', dir: 'ltr' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦', dir: 'ltr' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿', dir: 'ltr' },
  { code: 'ro', name: 'Română', flag: '🇷🇴', dir: 'ltr' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺', dir: 'ltr' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰', dir: 'ltr' },
  { code: 'bg', name: 'Български', flag: '🇧🇬', dir: 'ltr' },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷', dir: 'ltr' },
  { code: 'sr', name: 'Српски', flag: '🇷🇸', dir: 'ltr' },
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹', dir: 'ltr' },
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻', dir: 'ltr' },
  { code: 'et', name: 'Eesti', flag: '🇪🇪', dir: 'ltr' },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮', dir: 'ltr' },
  { code: 'ca', name: 'Català', flag: '🇪🇸', dir: 'ltr' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭', dir: 'ltr' },
  { code: 'sw', name: 'Kiswahili', flag: '🇰🇪', dir: 'ltr' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷', dir: 'rtl' },
  { code: 'ur', name: 'اردو', flag: '🇵🇰', dir: 'rtl' },
];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [dir, setDir] = useState('ltr');

  useEffect(() => {
    const saved = localStorage.getItem('language');
    if (saved && translations[saved]) {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    const lang = languages.find(l => l.code === language);
    const newDir = lang?.dir || 'ltr';
    setDir(newDir);
    document.documentElement.dir = newDir;
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    const langTranslations = translations[language] || translations.en;
    return langTranslations[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
