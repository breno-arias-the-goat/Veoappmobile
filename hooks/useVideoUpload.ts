import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuth } from 'firebase/auth';
import api from '../lib/api';
import { completeUpload, getPresignedUrl } from '../services/uploadService';

interface UploadParams {
    fileUri: string;
    scriptId?: string;
    title?: string; // NOVO: Título customizado do vídeo
    onProgress?: (progress: number) => void;
}

export const useVideoUpload = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ fileUri, scriptId, title, onProgress }: UploadParams) => {
            let lastError: any = null;
            const maxRetries = 3;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    // 1. FORCED FIREBASE TOKEN REFRESH (Solves 401 Unauthorized Error)
                    const auth = getAuth();
                    if (!auth.currentUser) throw new Error("Usuário não autenticado no Firebase.");

                    const freshToken = await auth.currentUser.getIdToken(true);

                    // Update the API axios instance defensively just in case it's used downstream
                    api.defaults.headers.common['Authorization'] = `Bearer ${freshToken}`;

                    // 2. Fetch the local file as blob
                    const response = await fetch(fileUri);
                    const blob = await response.blob();
                    const fileSize = blob.size;

                    // Prepare filename
                    const cleanTitle = title ? title.replace(/[^a-zA-Z0-9.\-_ ()]/g, '') : `Video_${Date.now()}`;
                    const fileName = cleanTitle.toLowerCase().endsWith('.mp4') ? cleanTitle : `${cleanTitle}.mp4`;
                    const contentType = 'video/mp4';

                    onProgress?.(5);

                    // 3. Get upload info from backend (presigned URL or direct upload flag)
                    // The backend will validate the freshToken injected into the Axios API instance above
                    const { data: uploadData } = await getPresignedUrl(fileName, contentType, fileSize);
                    const { uploadId, presignedUrl, useDirectUpload, fileKey } = uploadData;

                    onProgress?.(10);

                    let resultData: any = null;

                    if (useDirectUpload) {
                        // ---- Firebase Storage Mode ----
                        const formData = new FormData();
                        formData.append('video', {
                            uri: fileUri,
                            name: fileName,
                            type: contentType,
                        } as any);
                        if (scriptId) formData.append('scriptId', scriptId);

                        resultData = await new Promise<any>((resolve, reject) => {
                            const xhr = new XMLHttpRequest();
                            xhr.upload.onprogress = (event) => {
                                if (event.lengthComputable && onProgress) {
                                    const uploadPercent = Math.round((event.loaded / event.total) * 80);
                                    onProgress(10 + uploadPercent);
                                }
                            };
                            xhr.onload = () => {
                                try {
                                    const parsed = JSON.parse(xhr.responseText);
                                    if (xhr.status >= 200 && xhr.status < 300) resolve(parsed);
                                    else reject(new Error(parsed?.message || `Direct upload failed: ${xhr.status}`));
                                } catch {
                                    reject(new Error(`Direct upload parse failed: ${xhr.status}`));
                                }
                            };
                            xhr.onerror = () => reject(new Error('Erro de rede no Direct Upload Firebase'));

                            xhr.open('POST', `${api.defaults.baseURL}/upload/direct`);
                            // EXPLICIT FRESH TOKEN (Prevents 401)
                            xhr.setRequestHeader('Authorization', `Bearer ${freshToken}`);
                            xhr.send(formData);
                        });

                    } else {
                        // ---- AWS S3 Presigned URL Mode ----
                        await new Promise<void>((resolve, reject) => {
                            const xhr = new XMLHttpRequest();
                            xhr.upload.onprogress = (event) => {
                                if (event.lengthComputable && onProgress) {
                                    const uploadPercent = Math.round((event.loaded / event.total) * 80);
                                    onProgress(10 + uploadPercent);
                                }
                            };
                            xhr.onload = () => {
                                // AWS success is 200 OK
                                if (xhr.status >= 200 && xhr.status < 300) resolve();
                                else reject(new Error(`S3 upload failed with status: ${xhr.status}`));
                            };
                            xhr.onerror = () => reject(new Error('Network error during S3 upload'));

                            xhr.open('PUT', presignedUrl);
                            xhr.setRequestHeader('Content-Type', contentType);
                            // S3 PUT does not need the Bearer token as it uses AWS Signature V4 baked into the URL
                            xhr.send(blob);
                        });

                        onProgress?.(95);

                        // Complete upload on backend (Backend relies on our Fresh Firebase Auth Token)
                        const completeResponse = await completeUpload(uploadId, fileName, fileSize, undefined, scriptId || null);
                        resultData = completeResponse.data;
                    }

                    onProgress?.(100);
                    return resultData;

                } catch (error: any) {
                    lastError = error;

                    const errorStatus = error?.response?.status || error?.message?.includes('401') ? 401 : null;
                    const errorMsg = error?.message || '';

                    console.warn(`[VideoUpload] Tentativa ${attempt} falhou. Status: ${errorStatus || 'Desconhecido'}`, errorMsg);

                    // Retry ONLY explicitly on 401 Unauthorized or network timeouts
                    if ((errorStatus === 401 || errorMsg.includes('Network error')) && attempt < maxRetries) {
                        console.log(`[VideoUpload] 401/Network Error detectado. Forçando re-auth e iniciando fallback Retry ${attempt}/3 em 1.5s...`);
                        await new Promise(resolve => setTimeout(resolve, attempt * 1500));
                        continue; // try again in the loop
                    }

                    break; // Exhausted retries or a critical non-auth error (like 400 Bad Request or 413 Payload Too Large)
                }
            }

            // If we escaped the loop without returning data, throw the finalized error
            console.error('[VideoUpload] Todas as tentativas esgotadas. Falha definitiva:', lastError);
            throw new Error(`Falha no envio de vídeo: ${lastError?.message || 'Unauthorized / Servidor Recusou'}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['videos'] });
        },
    });
};
