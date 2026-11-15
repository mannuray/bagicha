import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import { initialLanguage } from './language';
import { localKeyValueStore } from './storage';

// The device's last language at start (lib/language then follows the user's
// choice); a missing Hindi string shows the English one, never a blank.
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: initialLanguage(localKeyValueStore),
  fallbackLng: 'en',
  supportedLngs: ['en', 'hi'],
  interpolation: { escapeValue: false },
});

export default i18n;
