import api from '../lib/api';

export const fetchScripts = async () => {
    const { data } = await api.get('/scripts');
    return data?.data?.scripts || [];
};

export const createScript = async (params: {
    context: string;
    topic: string;
    tone: string;
    durationMinutes: number;
}) => {
    const { data } = await api.post('/scripts/generate', params);
    return data?.data;
};

export const createManualScript = async (params: {
    title: string;
    content: string;
}) => {
    const { data } = await api.post('/scripts', params);
    return data?.data;
};

export const getScriptById = async (scriptId: string) => {
    const { data } = await api.get(`/scripts/${scriptId}`);
    return data?.data;
};

export const updateScript = async (scriptId: string, params: { title?: string; content?: string; topic?: string }) => {
    const { data } = await api.put(`/scripts/${scriptId}`, params);
    return data?.data;
};

export const deleteScript = async (scriptId: string) => {
    const { data } = await api.delete(`/scripts/${scriptId}`);
    return data;
};
