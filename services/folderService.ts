import api from '../lib/api';

export interface Folder {
    id: string;
    name: string;
    emoji: string;
    color: string;
    itemCount: number;
    createdAt: string;
    updatedAt: string;
}

export const fetchFolders = async (): Promise<Folder[]> => {
    const { data } = await api.get('/folders');
    return data?.data || [];
};

export const createFolder = async (payload: { name: string; emoji?: string; color?: string }) => {
    const { data } = await api.post('/folders', payload);
    return data?.data as Folder;
};

export const updateFolder = async (folderId: string, payload: { name?: string; emoji?: string; color?: string }) => {
    const { data } = await api.patch(`/folders/${folderId}`, payload);
    return data?.data as Folder;
};

export const deleteFolder = async (folderId: string): Promise<void> => {
    await api.delete(`/folders/${folderId}`);
};

export const assignVideoToFolder = async (folderId: string | null, videoId: string): Promise<void> => {
    await api.patch(`/folders/${folderId ?? 'none'}/videos/${videoId}`);
};

export const assignScriptToFolder = async (folderId: string | null, scriptId: string): Promise<void> => {
    await api.patch(`/folders/${folderId ?? 'none'}/scripts/${scriptId}`);
};
