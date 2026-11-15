import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import hi from '../locales/hi.json';

// English until the user's language is known (lib/language follows it); a
// missing Hindi string shows the English one, never a blank.
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'hi'],
  interpolation: { escapeValue: false },
});

export default i18n;
