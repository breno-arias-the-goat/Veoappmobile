import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchScripts } from '../services/scriptService';
import { useAuth } from '../contexts/AuthContext';

export const useScripts = () => {
    const { token } = useAuth();

    return useQuery({
        queryKey: ['scripts'],
        queryFn: () => token ? fetchScripts() : Promise.resolve([]),
        enabled: Boolean(token),
    });
};
