import api from '../lib/api';

export const fetchVideos = async () => {
    const { data } = await api.get('/videos');
    return data?.data?.videos || [];
};

export const updateVideo = async (videoId: string, updateData: { title?: string, status?: string }) => {
    const response = await api.put(`/videos/${videoId}`, updateData);
    return response.data;
};

export const processVideo = async (videoId: string) => {
    const response = await api.post(`/videos/${videoId}/process`, {
        generateThumbnail: true,
        extractMetadata: false,
        convertFormats: [],
        optimizeResolutions: []
    });
    return response.data;
};
