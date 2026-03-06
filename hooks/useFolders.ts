import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import {
    assignScriptToFolder,
    assignVideoToFolder,
    createFolder,
    deleteFolder,
    fetchFolders,
    Folder,
    updateFolder,
} from '../services/folderService';

export const FOLDERS_KEY = ['folders'] as const;

export const useFolders = () => {
    const { token } = useAuth();

    return useQuery<Folder[]>({
        queryKey: FOLDERS_KEY,
        queryFn: () => (token ? fetchFolders() : Promise.resolve([])),
        enabled: Boolean(token),
    });
};

export const useCreateFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: { name: string; emoji?: string; color?: string }) =>
            createFolder(payload),
        onSuccess: () => {
            console.log('useCreateFolder: onSuccess');
            Alert.alert('Sucesso', 'Pasta criada com sucesso!');
            qc.invalidateQueries({ queryKey: FOLDERS_KEY });
        },
        onError: (err: any) => {
            console.error('useCreateFolder: onError', err);
            Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível criar a pasta.');
        },
    });
};

export const useUpdateFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ folderId, ...payload }: { folderId: string; name?: string; emoji?: string; color?: string }) =>
            updateFolder(folderId, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: FOLDERS_KEY }),
        onError: (err: any) => {
            console.error('Error updating folder:', err);
            Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível atualizar a pasta.');
        },
    });
};

export const useDeleteFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (folderId: string) => deleteFolder(folderId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: FOLDERS_KEY });
            // videos & scripts that lost their folder should refresh too
            qc.invalidateQueries({ queryKey: ['videos'] });
            qc.invalidateQueries({ queryKey: ['scripts'] });
        },
        onError: (err: any) => {
            console.error('Error deleting folder:', err);
            Alert.alert('Erro', err?.response?.data?.message || 'Não foi possível excluir a pasta.');
        },
    });
};

export const useAssignVideoToFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ folderId, videoId }: { folderId: string | null; videoId: string }) =>
            assignVideoToFolder(folderId, videoId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: FOLDERS_KEY });
            qc.invalidateQueries({ queryKey: ['videos'] });
        },
        onError: (err: any) => {
            console.error('Error assigning video:', err);
            Alert.alert('Erro', 'Não foi possível mover o vídeo.');
        },
    });
};

export const useAssignScriptToFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ folderId, scriptId }: { folderId: string | null; scriptId: string }) =>
            assignScriptToFolder(folderId, scriptId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: FOLDERS_KEY });
            qc.invalidateQueries({ queryKey: ['scripts'] });
        },
        onError: (err: any) => {
            console.error('Error assigning script:', err);
            Alert.alert('Erro', 'Não foi possível mover o script.');
        },
    });
};
