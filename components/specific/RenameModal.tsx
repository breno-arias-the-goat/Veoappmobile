import React, { useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';

interface RenameModalProps {
    visible: boolean;
    initialTitle: string;
    isUpdating: boolean;
    onClose: () => void;
    onSave: (newTitle: string) => void;
}

export function RenameModal({ visible, initialTitle, isUpdating, onClose, onSave }: RenameModalProps) {
    const [title, setTitle] = useState(initialTitle);

    // Auto update internal state when modal opens
    React.useEffect(() => {
        if (visible) {
            setTitle(initialTitle);
        }
    }, [visible, initialTitle]);

    const handleSave = () => {
        if (!title.trim()) return;
        onSave(title.trim());
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 justify-center items-center bg-black/60 px-4"
            >
                <View className="bg-surface w-full max-w-sm rounded-[24px] overflow-hidden border border-white/10 shadow-2xl p-6">
                    <Text className="text-white text-lg font-inter-semibold mb-2">Renomear Projeto</Text>
                    <Text className="text-white/60 text-sm font-inter mb-4">Escolha um novo nome para identificar melhor o seu vídeo ou script.</Text>

                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Nome do vídeo..."
                        placeholderTextColor="#666"
                        className="bg-[#1C1C1E] text-white px-4 py-3 rounded-xl border border-white/5 font-inter text-base mb-6"
                        maxLength={50}
                        autoFocus
                    />

                    <View className="flex-row justify-end space-x-3 gap-3">
                        <TouchableOpacity
                            onPress={onClose}
                            disabled={isUpdating}
                            className="bg-transparent px-5 py-2.5 rounded-xl border border-white/10"
                        >
                            <Text className="text-white font-inter-medium">Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isUpdating || !title.trim()}
                            className={`bg-primary px-5 py-2.5 rounded-xl flex-row items-center justify-center min-w-[100px] ${(!title.trim() || isUpdating) ? 'opacity-50' : 'opacity-100'}`}
                        >
                            {isUpdating ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text className="text-white font-inter-bold">Salvar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
