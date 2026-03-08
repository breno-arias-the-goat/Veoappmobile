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

    // ── Buscar legendas prontas ────────────────────────────────────────────────
    const subtitlesQuery = useQuery({
        queryKey: ['subtitles', videoId],
        queryFn: async () => {
            const { data } = await api.get(`/subtitles/video/${videoId}?format=json`);
            // Backend pode retornar em vários formatos — normaliza tudo aqui
            const raw = data?.data?.subtitles ?? data?.subtitles ?? data?.data ?? [];
            if (!Array.isArray(raw)) return [];
            // Garante que cada item tem startTimeMs e endTimeMs como números
            return raw.map((s: any) => ({
                id: s.id || String(Math.random()),
                text: s.text || '',
                startTimeMs: typeof s.startTimeMs === 'number'
                    ? s.startTimeMs
                    : parseFloat(s.start_time ?? s.start ?? '0') * 1000,
                endTimeMs: typeof s.endTimeMs === 'number'
                    ? s.endTimeMs
                    : parseFloat(s.end_time ?? s.end ?? '0') * 1000,
            })) as Subtitle[];
        },
        enabled: !!videoId,
        retry: 2,
        staleTime: 30_000,
    });

    // ── Gerar legendas com IA ──────────────────────────────────────────────────
    const generateMutation = useMutation({
        mutationFn: async ({ language }: { language: string }) => {
            try {
                const { data } = await api.post(`/subtitles/video/${videoId}/generate`, {
                    language,
                    autoGenerate: true,
                });
                // Backend retorna { success, data: { jobId, ... } }
                const jobId = data?.data?.jobId ?? data?.jobId;
                if (!jobId) throw new Error('Servidor não retornou um jobId válido.');
                return { jobId } as { jobId: string };
            } catch (error: any) {
                const status = error.response?.status;
                if (status === 401) throw new Error('Sessão expirada. Faça login novamente.');
                if (status === 403) throw new Error('Você não tem permissão para gerar legendas neste vídeo.');
                if (status === 400) throw new Error(`Erro na requisição: ${error.response?.data?.message || 'Dados inválidos'}`);
                if (status === 404) throw new Error('Vídeo não encontrado. Verifique se o upload foi concluído.');
                if (status === 500) throw new Error('Erro no servidor. Tente novamente em alguns minutos.');
                throw error;
            }
        },
        onError: (error: any) => {
            console.error('[useSubtitles] Erro ao gerar legendas:', error.message);
        },
    });

    // ── Editar texto de uma legenda ────────────────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: async ({ subtitleId, text }: { subtitleId: string; text: string }) => {
            const { data } = await api.put(`/subtitles/${subtitleId}`, { text });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subtitles', videoId] });
        },
    });

    // ── Polling de status do job ───────────────────────────────────────────────
    const checkJobStatus = async (jobId: string) => {
        try {
            const { data } = await api.get(`/subtitles/job/${jobId}`);
            // Backend retorna { success, data: { jobId, status, progress, ... } }
            return data?.data ?? data;
        } catch (error: any) {
            if (error.response?.status === 401) throw new Error('Sessão expirada');
            throw error;
        }
    };

    return {
        subtitlesQuery,
        generateMutation,
        updateMutation,
        checkJobStatus,
    };
}
