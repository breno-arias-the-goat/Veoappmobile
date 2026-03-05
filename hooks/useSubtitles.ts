import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface Subtitle {
    id: string;
    text: string;
    startTimeMs: number;
    endTimeMs: number;
}

export function useSubtitles(videoId: string) {
    const queryClient = useQueryClient();

    // Buscar legendas prontas
    const subtitlesQuery = useQuery({
        queryKey: ['subtitles', videoId],
        queryFn: async () => {
            const { data } = await api.get(`/subtitles/video/${videoId}?format=json`);
            // O backend retorna subtitles na raiz do data se data.subtitles tiver la
            return data.data?.subtitles || [];
        },
        enabled: !!videoId
    });

    // Pedir pra gerar novas
    const generateMutation = useMutation({
        mutationFn: async ({ language }: { language: string }) => {
            const { data } = await api.post(`/subtitles/video/${videoId}/generate`, {
                language,
                autoGenerate: true
            });
            return data.data; // Retorna jobId
        }
    });

    // Update segmento pra editor do cliente
    const updateMutation = useMutation({
        mutationFn: async ({ subtitleId, text }: { subtitleId: string, text: string }) => {
            const { data } = await api.put(`/subtitles/${subtitleId}`, { text });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subtitles', videoId] });
        }
    });

    // Hook utilitário pro Polling (verifica a fila do Bull / Redis se ja acabou Whisper)
    const checkJobStatus = async (jobId: string) => {
        const { data } = await api.get(`/subtitles/job/${jobId}`);
        return data.data;
    };

    return {
        subtitlesQuery,
        generateMutation,
        updateMutation,
        checkJobStatus
    };
}
