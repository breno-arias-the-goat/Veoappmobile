import api from '../lib/api';

export const getPresignedUrl = async (fileName: string, contentType: string, fileSize: number) => {
    // Expected to return { data: { uploadId: string, presignedUrl: string, videoUrl: string } }
    const response = await api.post('/upload/presigned-url', {
        fileName,
        contentType,
        fileSize
    });
    return response.data;
};

export const completeUpload = async (uploadId: string, fileName: string, fileSize: number, duration?: number, scriptId: string | null = null) => {
    // Expected to return { data: { videoId: string, status: string } }
    const response = await api.post('/upload/complete', {
        uploadId,
        fileName,
        fileSize,
        duration,
        scriptId
    });
    return response.data;
};
