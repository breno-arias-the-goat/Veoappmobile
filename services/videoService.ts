import api from '../lib/api';

export const fetchVideos = async () => {
    const { data } = await api.get('/videos');
    return data?.data?.videos || [];
};
