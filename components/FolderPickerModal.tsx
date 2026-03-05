import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useFolders, useAssignVideoToFolder, useAssignScriptToFolder, useCreateFolder } from '../hooks/useFolders';
import { Folder } from '../services/folderService';

const EMOJI_OPTIONS = ['📁', '🎬', '🎥', '🎞', '📽', '✂️', '🎙', '🌟', '🔥', '💡', '📌', '🗂'];
const COLOR_OPTIONS = ['#6C63FF', '#FF6584', '#43B89C', '#F7B731', '#FC5C65', '#2BCBBA', '#A55EEA', '#4B7BEC'];

interface Props {
    visible: boolean;
    itemId: string;
    itemType: 'video' | 'script';
    currentFolderId?: string | null;
    onClose: () => void;
}

export const FolderPickerModal: React.FC<Props> = ({
    visible,
    itemId,
    itemType,
    currentFolderId,
    onClose,
}) => {
    const { data: folders = [], isLoading } = useFolders();
    const assignVideo = useAssignVideoToFolder();
    const assignScript = useAssignScriptToFolder();
    const createFolder = useCreateFolder();

    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('📁');
    const [selectedColor, setSelectedColor] = useState('#6C63FF');

    const assign = itemType === 'video' ? assignVideo : assignScript;
    const mutateKey = itemType === 'video' ? 'videoId' : 'scriptId';

    const handlePick = (folder: Folder | null) => {
        (assign.mutate as any)({ folderId: folder?.id ?? null, [mutateKey]: itemId });
        onClose();
    };

    const handleCreate = () => {
        if (!newName.trim()) {
            Alert.alert('Nome obrigatório', 'Digite um nome para a pasta.');
            return;
        }
        createFolder.mutate(
            { name: newName.trim(), emoji: selectedEmoji, color: selectedColor },
            {
                onSuccess: (folder) => {
                    (assign.mutate as any)({ folderId: folder.id, [mutateKey]: itemId });
                    setCreating(false);
                    setNewName('');
                    onClose();
                },
            }
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
                    <Text style={styles.title}>Mover para Pasta</Text>

                    {!creating ? (
                        <>
                            {isLoading ? (
                                <ActivityIndicator color="#6C63FF" style={{ marginVertical: 20 }} />
                            ) : (
                                <FlatList
                                    data={[null, ...folders] as (Folder | null)[]}
                                    keyExtractor={(item) => item?.id ?? 'none'}
                                    renderItem={({ item }) => {
                                        const isActive = item ? item.id === currentFolderId : !currentFolderId;
                                        return (
                                            <TouchableOpacity
                                                style={[styles.folderRow, isActive && styles.folderRowActive]}
                                                onPress={() => handlePick(item)}
                                            >
                                                <Text style={styles.folderEmoji}>{item?.emoji ?? '🗂'}</Text>
                                                <Text style={styles.folderName}>
                                                    {item ? item.name : 'Sem Pasta'}
                                                </Text>
                                                {isActive && <Text style={styles.check}>✓</Text>}
                                            </TouchableOpacity>
                                        );
                                    }}
                                    style={{ maxHeight: 260 }}
                                />
                            )}

                            <TouchableOpacity style={styles.createBtn} onPress={() => setCreating(true)}>
                                <Text style={styles.createBtnText}>+ Nova Pasta</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View>
                            <TextInput
                                style={styles.input}
                                placeholder="Nome da pasta"
                                placeholderTextColor="#666"
                                value={newName}
                                onChangeText={setNewName}
                                autoFocus
                            />

                            <Text style={styles.label}>Emoji</Text>
                            <View style={styles.emojiRow}>
                                {EMOJI_OPTIONS.map(e => (
                                    <TouchableOpacity
                                        key={e}
                                        onPress={() => setSelectedEmoji(e)}
                                        style={[styles.emojiBtn, selectedEmoji === e && styles.emojiBtnActive]}
                                    >
                                        <Text style={{ fontSize: 20 }}>{e}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Cor</Text>
                            <View style={styles.colorRow}>
                                {COLOR_OPTIONS.map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        onPress={() => setSelectedColor(c)}
                                        style={[
                                            styles.colorDot,
                                            { backgroundColor: c },
                                            selectedColor === c && styles.colorDotActive,
                                        ]}
                                    />
                                ))}
                            </View>

                            <View style={styles.row}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreating(false)}>
                                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                                    {createFolder.isPending
                                        ? <ActivityIndicator color="#fff" />
                                        : <Text style={styles.saveBtnText}>Criar e Mover</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#111',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    folderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 2,
    },
    folderRowActive: {
        backgroundColor: 'rgba(108,99,255,0.18)',
    },
    folderEmoji: { fontSize: 22, marginRight: 12 },
    folderName: { color: '#fff', fontSize: 15, flex: 1 },
    check: { color: '#6C63FF', fontSize: 16, fontWeight: '700' },
    createBtn: {
        marginTop: 14,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#6C63FF',
    },
    createBtnText: { color: '#6C63FF', fontWeight: '700' },
    input: {
        backgroundColor: '#222',
        color: '#fff',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    label: { color: '#A1A1AA', fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    emojiRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 6 },
    emojiBtn: { padding: 6, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
    emojiBtnActive: { borderColor: '#6C63FF', backgroundColor: 'rgba(108,99,255,0.15)' },
    colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    colorDot: { width: 28, height: 28, borderRadius: 14 },
    colorDotActive: { borderWidth: 2.5, borderColor: '#fff' },
    row: { flexDirection: 'row', gap: 10 },
    cancelBtn: {
        flex: 1, alignItems: 'center', paddingVertical: 12,
        borderRadius: 12, borderWidth: 1, borderColor: '#333',
    },
    cancelBtnText: { color: '#A1A1AA', fontWeight: '600' },
    saveBtn: {
        flex: 2, alignItems: 'center', paddingVertical: 12,
        borderRadius: 12, backgroundColor: '#6C63FF',
    },
    saveBtnText: { color: '#fff', fontWeight: '700' },
});
