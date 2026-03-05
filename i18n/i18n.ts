import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';

import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import zh from './locales/zh.json';

const resources = {
    en: { translation: en },
    pt: { translation: pt },
    es: { translation: es },
    fr: { translation: fr },
    de: { translation: de },
    it: { translation: it },
    zh: { translation: zh },
    ja: { translation: ja },
    ko: { translation: ko },
    ru: { translation: ru }
};

const LANGUAGE_KEY = '@veo_app_language';
const SUPPORTED = Object.keys(resources);

// Returns the device's preferred language, falling back to 'en'
const getDeviceLanguage = (): string => {
    const localeString = Localization.getLocales()[0]?.languageTag || 'en';
    const langCode = localeString.split('-')[0];
    return SUPPORTED.includes(langCode) ? langCode : 'en';
};

// Initialize with device language synchronously so the app starts immediately
i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: getDeviceLanguage(),
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
    });

// Then asynchronously load the user's saved preference and apply it
const loadSavedLanguage = async () => {
    try {
        let saved: string | null = null;

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            saved = localStorage.getItem(LANGUAGE_KEY);
        } else {
            saved = await AsyncStorage.getItem(LANGUAGE_KEY);
        }

        if (saved && SUPPORTED.includes(saved) && saved !== i18n.language) {
            await i18n.changeLanguage(saved);
        }
    } catch (e) {
        console.warn('[i18n] Could not load saved language preference:', e);
    }
};

loadSavedLanguage();

// Helper to change AND persist the language choice
export const changeAndSaveLanguage = async (langCode: string): Promise<void> => {
    if (!SUPPORTED.includes(langCode)) return;
    await i18n.changeLanguage(langCode);
    try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            localStorage.setItem(LANGUAGE_KEY, langCode);
        } else {
            await AsyncStorage.setItem(LANGUAGE_KEY, langCode);
        }
    } catch (e) {
        console.warn('[i18n] Could not persist language preference:', e);
    }
};

export default i18n;
