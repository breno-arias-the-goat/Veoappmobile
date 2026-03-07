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
            try {
                const { data } = await api.post(`/subtitles/video/${videoId}/generate`, {
                    language,
                    autoGenerate: true
                });
                return data.data; // Retorna jobId
            } catch (error: any) {
                if (error.response?.status === 401) {
                    throw new Error('Sessão expirada. Faça login novamente.');
                } else if (error.response?.status === 403) {
                    throw new Error('Você não tem permissão para gerar legendas neste vídeo.');
                } else if (error.response?.status === 400) {
                    throw new Error(`Erro na requisição: ${error.response.data?.message || 'Dados inválidos'}`);
                } else if (error.response?.status === 500) {
                    throw new Error('Erro no servidor. Tente novamente em alguns minutos.');
                } else {
                    throw error;
                }
            }
        },
        onError: (error: any) => {
            console.error('Erro ao gerar legendas:', error.message);
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
        try {
            const { data } = await api.get(`/subtitles/job/${jobId}`);
            return data.data;
        } catch (error: any) {
            if (error.response?.status === 401) {
                throw new Error('Sessão expirada');
            }
            throw error;
        }
    };

    return {
        subtitlesQuery,
        generateMutation,
        updateMutation,
        checkJobStatus
    };
}
