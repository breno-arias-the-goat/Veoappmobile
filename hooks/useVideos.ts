import { useQuery } from '@tanstack/react-query';
import { fetchVideos } from '../services/videoService';
import { useAuth } from '../contexts/AuthContext';

export const useVideos = () => {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['videos'],
        queryFn: () => token ? fetchVideos() : Promise.resolve([]),
        enabled: Boolean(token),
    });
};
