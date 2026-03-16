import axios from 'axios';

// In-memory token cache — avoids AsyncStorage read on every request (~150ms saved per call)
let cachedToken: string | null = null;

export function setApiToken(token: string | null) {
    cachedToken = token;
}

const getBaseUrl = () => {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 180000, // 180s — Render free tier pode demorar 30-60s para acordar + até 2min para renderizar vídeos longos
});

api.interceptors.request.use(
    (config) => {
        // Synchronous read from memory — no await needed
        if (cachedToken) {
            config.headers.Authorization = `Bearer ${cachedToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
