import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchScripts, createScript, createManualScript, updateScript, deleteScript } from '../services/scriptService';
import { useAuth } from '../contexts/AuthContext';

export const useScripts = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['scripts'],
        queryFn: () => token ? fetchScripts() : Promise.resolve([]),
        enabled: Boolean(token),
        staleTime: 30_000,
    });
};

export const useCreateScript = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params: { topic: string; context: string; tone: string; durationMinutes: number }) =>
            createScript(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scripts'] });
        },
    });
};

export const useCreateManualScript = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params: { title: string; content: string }) =>
            createManualScript(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scripts'] });
        },
    });
};

export const useUpdateScript = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ scriptId, ...params }: { scriptId: string; title?: string; content?: string; topic?: string }) =>
            updateScript(scriptId, params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scripts'] });
        },
    });
};

export const useDeleteScript = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (scriptId: string) => deleteScript(scriptId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scripts'] });
        },
    });
};
