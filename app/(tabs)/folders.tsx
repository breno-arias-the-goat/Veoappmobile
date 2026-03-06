import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Pressable,
    TextInput,
    Alert,
    RefreshControl,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FolderCard } from '../../components/FolderCard';
import { useFolders, useCreateFolder, useUpdateFolder } from '../../hooks/useFolders';
import { Folder } from '../../services/folderService';

export default function FoldersScreen() {
    const router = useRouter();
    const { data: folders = [], isLoading, refetch } = useFolders();
    const createFolder = useCreateFolder();
    const updateFolder = useUpdateFolder();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [folderName, setFolderName] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const openCreate = () => {
        setEditingFolder(null);
        setFolderName('');
        setErrorMsg('');
        setModalVisible(true);
    };

    const openEdit = (folder: Folder) => {
        setEditingFolder(folder);
        setFolderName(folder.name);
        setErrorMsg('');
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingFolder(null);
        setFolderName('');
        setErrorMsg('');
    };

    const handleSave = async () => {
        try {
            // Se isBusy estiver preso, podemos forçar a continuação para debug
            // if (isBusy) {
            //    return;
            // }

            const name = folderName.trim();
            if (!name) {
                setErrorMsg('Digite um nome para a pasta.');
                return;
            }

            console.log('--- START handleSave ---', name);

            if (editingFolder) {
                console.log('Update folder mutation called');
                await updateFolder.mutateAsync({
                    folderId: editingFolder.id,
                    name,
                    emoji: editingFolder.emoji || '📁',
                    color: editingFolder.color || '#3B6FE8'
                });
            } else {
                console.log('Create folder mutation called', { name });
                await createFolder.mutateAsync({
                    name,
                    emoji: '📁',
                    color: '#3B6FE8'
                });
            }
            console.log('Mutation finished successfully, closing modal');
            closeModal();
        } catch (error: any) {
            console.error('Save folder error caught in try/catch:', error);
            const msg = error?.response?.data?.message || error?.message || 'Falha ao processar';
            Alert.alert('Erro Crítico', 'A tentativa falhou! Motivo: ' + msg);
            setErrorMsg('ERRO: ' + msg);
        }
    };

    const navigateToFolder = (folder: Folder) => {
        router.push({
            pathname: '/folder-detail',
            params: { folderId: folder.id, folderName: folder.name, folderEmoji: folder.emoji },
        });
    };

    const isBusy = createFolder.isPending || updateFolder.isPending;

    return (
        <View style={styles.container}>

            {/* ── Top bar (mirrors competitor layout) ── */}
            <View style={styles.topBar}>
                <View style={styles.topBarLeft} />
                <Text style={styles.topBarTitle}>Pastas</Text>
                <TouchableOpacity style={styles.addIconBtn} onPress={openCreate} activeOpacity={0.7}>
                    <Text style={styles.addIcon}>＋</Text>
                </TouchableOpacity>
            </View>

            {/* ── Content ── */}
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#3B6FE8" />
                </View>
            ) : folders.length === 0 ? (
                <View style={styles.empty}>
                    <View style={styles.emptyFolderWrap}>
                        <Text style={styles.emptyFolderIcon}>🗂</Text>
                    </View>
                    <Text style={styles.emptyTitle}>Nenhuma pasta</Text>
                    <Text style={styles.emptyDesc}>
                        Organize seus vídeos e scripts criando pastas para cada projeto ou cliente.
                    </Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={openCreate} activeOpacity={0.85}>
                        <Text style={styles.emptyBtnText}>＋  Nova Pasta</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={folders}
                    numColumns={2}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <FolderCard folder={item} onPress={navigateToFolder} onEdit={openEdit} />
                    )}
                    contentContainerStyle={styles.grid}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3B6FE8" />
                    }
                />
            )}

            {/* ── Create / Rename Modal ── */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <Pressable style={styles.backdrop} onPress={closeModal}>
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
                            showsVerticalScrollIndicator={false}
                            style={{ width: '100%' }}
                        >
                            <Pressable style={{ width: '100%' }}>
                                <View style={styles.sheet} onStartShouldSetResponder={() => true}>
                                    {/* Drag handle */}
                                    <View style={styles.handle} />

                                    {/* Title */}
                                    <Text style={styles.sheetTitle}>
                                        {editingFolder ? 'Renomear pasta' : 'Nome da pasta'}
                                    </Text>

                                    {/* Input — underline style like competitor */}
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nome da pasta"
                                        placeholderTextColor="#555"
                                        value={folderName}
                                        onChangeText={(t) => {
                                            setFolderName(t);
                                            if (errorMsg) setErrorMsg('');
                                        }}
                                        autoFocus
                                        returnKeyType="done"
                                        onSubmitEditing={handleSave}
                                        maxLength={60}
                                        selectionColor="#3B6FE8"
                                    />

                                    {errorMsg ? (
                                        <View style={{ backgroundColor: '#ffcccc', padding: 10, borderRadius: 8, marginBottom: 16 }}>
                                            <Text style={[styles.errorText, { color: '#ff0000', fontWeight: 'bold', fontSize: 16, marginBottom: 0 }]}>{errorMsg}</Text>
                                        </View>
                                    ) : null}

                                    {/* Salvar — full width, always visible above keyboard */}
                                    <TouchableOpacity
                                        style={[styles.saveBtn, isBusy && styles.saveBtnDisabled]}
                                        onPress={handleSave}
                                        activeOpacity={0.85}
                                        disabled={isBusy}
                                    >
                                        {isBusy
                                            ? <ActivityIndicator color="#fff" />
                                            : <Text style={styles.saveBtnText}>Salvar</Text>
                                        }
                                    </TouchableOpacity>
                                </View>
                            </Pressable>
                        </ScrollView>
                    </Pressable>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },

    // ── Top bar — competitor style ──
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 14,
    },
    topBarLeft: { width: 36 }, // spacer to center the title
    topBarTitle: {
        color: '#9CA3AF',
        fontSize: 17,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    addIconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1C1C1E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addIcon: { color: '#fff', fontSize: 20, fontWeight: '300', lineHeight: 24 },

    // ── Grid ──
    grid: { paddingHorizontal: 10, paddingTop: 4, paddingBottom: 32 },

    // ── States ──
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyFolderWrap: {
        width: 90,
        height: 90,
        borderRadius: 22,
        backgroundColor: '#1C1C1E',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyFolderIcon: { fontSize: 44 },
    emptyTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
    emptyDesc: { color: '#555', textAlign: 'center', lineHeight: 22, fontSize: 14, marginBottom: 28 },
    emptyBtn: {
        backgroundColor: '#3B6FE8',
        paddingHorizontal: 32,
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: 'center',
    },
    emptyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // ── Modal ──
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: '#3A3A3C',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    sheetTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 20,
        letterSpacing: -0.3,
    },

    // Input — underline style (minimal like competitor)
    input: {
        color: '#fff',
        fontSize: 18,
        paddingVertical: 10,
        paddingHorizontal: 2,
        borderBottomWidth: 1.5,
        borderBottomColor: '#3B6FE8',
        marginBottom: 16,
    },
    errorText: {
        color: '#FF453A',
        fontSize: 14,
        marginBottom: 16,
        paddingHorizontal: 2,
    },

    // Salvar button — full width blue (competitor style)
    saveBtn: {
        backgroundColor: '#3B6FE8',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
});
