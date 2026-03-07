import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import api from '../lib/api';

/**
 * Service specifically built to handle Video Uploads from device to the backend.
 * Provides dual-authentication strategies (Firebase Token Refresh) to avoid silent 401 Unauthorized errors 
 * and handles native Gallery Permissions gracefully.
 */

// Custom Error Class to identify Auth-related failures easily
export class UploadAuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UploadAuthError';
    }
}

export const videoUploader = {
    /**
     * Secures a fresh Firebase Token, bypassing cache to guarantee it hasn't expired.
     */
    async getFreshToken(): Promise<string> {
        const auth = getAuth();
        if (!auth.currentUser) {
            throw new UploadAuthError("Usuário não autenticado no Firebase.");
        }

        try {
            // Force refresh is 'true' to completely eliminate token expiration risks
            const token = await auth.currentUser.getIdToken(true);
            return token;
        } catch (error) {
            throw new UploadAuthError("Falha crítica ao tentar recuperar o ticket de Autenticação.");
        }
    },

    /**
     * Prompts the user for iOS/Android gallery permissions.
     */
    async requestGalleryPermissions(): Promise<boolean> {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
    },

    /**
     * Opens the Gallery specifically for video selection.
     */
    async pickVideoFromGallery(): Promise<ImagePicker.ImagePickerAsset | null> {
        const hasPermission = await this.requestGalleryPermissions();

        if (!hasPermission) {
            throw new Error("Permissão da galeria Negada pelo Usuário.");
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsEditing: true, // Let them trim if they want
            quality: 1, // Full quality before we upload
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            return result.assets[0];
        }

        return null; // User cancelled
    },

    /**
     * Prepares and executes the formData upload using a dynamically refreshed token.
     * Retries up to 2 times automatically if a 401 is unexpectedly returned by the network layers.
     */
    async uploadWithRetry(
        videoUri: string,
        fileName: string,
        onProgress?: (progress: number) => void,
        retries = 2
    ): Promise<any> {
        let lastError = null;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // 1. Always demand a fresh Firebase token before network calls to prevent 401s
                const freshToken = await this.getFreshToken();

                // 2. Prepare Multipart Form Data
                const formData = new FormData();
                formData.append('video', {
                    uri: videoUri,
                    type: 'video/mp4', // Common fallback; the backend inspects it securely anyway
                    name: fileName || `video_${Date.now()}.mp4`,
                } as any);
                formData.append('title', fileName || 'Meu Vídeo Importado');

                // 3. Send via Axios interceptor passing exact Headers
                // Note: We use the local API client but we explicitly override the header to force our Fresh Token.
                const response = await api.post('/videos/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${freshToken}` // Critical explicit delivery
                    },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total && onProgress) {
                            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            onProgress(percentCompleted);
                        }
                    },
                    // Prevent timeout on large video uploads (5 mins)
                    timeout: 300000
                });

                return response.data; // Success!

            } catch (error: any) {
                lastError = error;

                // Detection logic: Was it a 401 Unauthorized?
                const isUnauthorized = error?.response?.status === 401;

                if (isUnauthorized) {
                    console.warn(`[VideoUploader] 401 Unauthorized detectado na tentativa ${attempt}. Recarregando Engine de Auth.`);
                    if (attempt < retries) {
                        // Exponential backoff before retry to allow backend/firebase to settle
                        await new Promise(resolve => setTimeout(resolve, attempt * 1500));
                        continue; // try again
                    }
                } else {
                    // Not a 401, mostly generic Network/Size error, throw immediately
                    break;
                }
            }
        }

        // Exhausted retries or a critical non-401 failure
        console.error("[VideoUploader] Falha Crítica de Upload: ", lastError);
        throw lastError;
    }
};
