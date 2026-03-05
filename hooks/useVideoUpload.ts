import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { completeUpload, getPresignedUrl } from '../services/uploadService';

interface UploadParams {
    fileUri: string;
    scriptId?: string;
    onProgress?: (progress: number) => void;
}

export const useVideoUpload = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ fileUri, scriptId, onProgress }: UploadParams) => {
            try {
                // 1. Fetch the local file as blob
                const response = await fetch(fileUri);
                const blob = await response.blob();
                const fileSize = blob.size;
                const fileName = `video_${Date.now()}.mp4`;
                const contentType = 'video/mp4';

                onProgress?.(5);

                // 2. Get upload info from backend (presigned URL or direct upload flag)
                const { data: uploadData } = await getPresignedUrl(fileName, contentType, fileSize);
                const { uploadId, presignedUrl, useDirectUpload, fileKey } = uploadData;

                onProgress?.(10);

                if (useDirectUpload) {
                    // ---- Firebase Storage Mode: POST multipart/form-data to /upload/direct ----
                    // React Native doesn't support FormData with blob well, so we use XMLHttpRequest
                    const formData = new FormData();
                    formData.append('video', {
                        uri: fileUri,
                        name: fileName,
                        type: contentType,
                    } as any);
                    if (scriptId) formData.append('scriptId', scriptId);

                    const result = await new Promise<any>((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.upload.onprogress = (event) => {
                            if (event.lengthComputable && onProgress) {
                                // Map upload progress from 10% to 90%
                                const uploadPercent = Math.round((event.loaded / event.total) * 80);
                                onProgress(10 + uploadPercent);
                            }
                        };
                        xhr.onload = () => {
                            try {
                                const parsed = JSON.parse(xhr.responseText);
                                if (xhr.status >= 200 && xhr.status < 300) {
                                    resolve(parsed);
                                } else {
                                    reject(new Error(parsed?.message || `Upload failed: ${xhr.status}`));
                                }
                            } catch {
                                reject(new Error(`Upload failed: ${xhr.status}`));
                            }
                        };
                        xhr.onerror = () => reject(new Error('Erro de rede durante o upload do vídeo'));

                        // Get access token from api instance defaults
                        const token = (api.defaults.headers.common['Authorization'] as string)?.replace('Bearer ', '');

                        xhr.open('POST', `${api.defaults.baseURL}/upload/direct`);
                        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                        xhr.send(formData);
                    });

                    onProgress?.(100);
                    return result?.data;

                } else {
                    // ---- S3 Presigned URL Mode ----
                    await new Promise<void>((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.upload.onprogress = (event) => {
                            if (event.lengthComputable && onProgress) {
                                const uploadPercent = Math.round((event.loaded / event.total) * 80);
                                onProgress(10 + uploadPercent);
                            }
                        };
                        xhr.onload = () => {
                            if (xhr.status >= 200 && xhr.status < 300) resolve();
                            else reject(new Error(`S3 upload failed: ${xhr.status}`));
                        };
                        xhr.onerror = () => reject(new Error('Network error during S3 upload'));
                        xhr.open('PUT', presignedUrl);
                        xhr.setRequestHeader('Content-Type', contentType);
                        xhr.send(blob);
                    });

                    onProgress?.(95);

                    // Complete upload on backend
                    const completeResponse = await completeUpload(uploadId, fileName, fileSize, undefined, scriptId || null);
                    onProgress?.(100);
                    return completeResponse.data;
                }

            } catch (error) {
                console.error('Upload error:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['videos'] });
        },
    });
};
