import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuth } from 'firebase/auth';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';
import api from '../lib/api';
import { completeUpload, getPresignedUrl } from '../services/uploadService';
import { processVideo } from '../services/videoService';

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
                    api.defaults.headers.common['Authorization'] = `Bearer ${freshToken}`;

                    // 2. Fetch the local file info natively without loading into memory (OOM Crash fix)
                    const fileInfo = await FileSystem.getInfoAsync(fileUri);
                    if (!fileInfo.exists) throw new Error("Arquivo local de gravação não encontrado.");
                    const fileSize = fileInfo.size;

                    // Prepare filename
                    const cleanTitle = title ? title.replace(/[^a-zA-Z0-9.\-_ ()]/g, '') : `Video_${Date.now()}`;
                    const fileName = cleanTitle.toLowerCase().endsWith('.mp4') ? cleanTitle : `${cleanTitle}.mp4`;
                    const contentType = 'video/mp4';

                    onProgress?.(5);

                    // 3. Get upload info from backend
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
                        // ---- AWS S3 Presigned URL Mode (Native streaming bypasses Blob freezing) ----
                        const uploadTask = FileSystem.createUploadTask(
                            presignedUrl,
                            fileUri,
                            {
                                httpMethod: 'PUT',
                                headers: {
                                    'Content-Type': contentType,
                                }
                            },
                            (data) => {
                                if (data.totalBytesExpectedToSend > 0 && onProgress) {
                                    const uploadPercent = Math.round((data.totalBytesSent / data.totalBytesExpectedToSend) * 80);
                                    onProgress(10 + uploadPercent);
                                }
                            }
                        );

                        const response = await uploadTask.uploadAsync();

                        if (!response || response.status < 200 || response.status >= 300) {
                            throw new Error(`S3 upload failed with status: ${response?.status || 'Unknown'}`);
                        }

                        onProgress?.(95);

                        // Complete upload on backend
                        const completeResponse = await completeUpload(uploadId, fileName, fileSize, undefined, scriptId || null);
                        resultData = completeResponse.data;
                    }

                    onProgress?.(100);

                    // NOVO: Disparar processamento (thumbnail) de forma não-bloqueante
                    const uploadedVideoId = resultData?.videoId || resultData?.data?.videoId || resultData?.id;
                    if (uploadedVideoId) {
                        processVideo(uploadedVideoId)
                            .then(() => console.log(`[VideoUpload] Processamento iniciado para ${uploadedVideoId}`))
                            .catch((err: any) => console.warn('[VideoUpload] Falha ao iniciar processamento do vídeo em background:', err.message));
                    }

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
