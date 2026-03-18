import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, Modal, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface ProUpgradeModalProps {
    visible: boolean;
    title?: string;
    subtitle: string;
    onClose: () => void;
}

export function ProUpgradeModal({
    visible,
    title = "Você atingiu seu limite gratuito",
    subtitle,
    onClose
}: ProUpgradeModalProps) {
    const router = useRouter();

    const handleUpgrade = () => {
        onClose();
        router.push('/(main)/subscription');
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 justify-center items-center bg-black/80 px-4"
            >
                <View className="bg-surface w-full max-w-sm rounded-[24px] overflow-hidden border border-[#4C24A0] shadow-2xl p-6 items-center">
                    <View className="bg-[#4C24A0]/20 p-4 rounded-full mb-4">
                        <FontAwesome name="lock" size={32} color="#5E2BFF" />
                    </View>

                    <Text className="text-white text-xl font-inter-bold mb-2 text-center">{title}</Text>
                    <Text className="text-white/70 text-base font-inter mb-6 text-center leading-relaxed">
                        {subtitle}
                    </Text>

                    <View className="w-full space-y-3 gap-3">
                        <TouchableOpacity
                            onPress={handleUpgrade}
                            className="bg-primary w-full py-3.5 rounded-xl flex-row items-center justify-center shadow-lg"
                        >
                            <FontAwesome name="star" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text className="text-white font-inter-bold text-base">Assinar Pro — R$19,90/sem</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onClose}
                            className="bg-transparent w-full py-3 rounded-xl border border-white/10 flex-row items-center justify-center"
                        >
                            <Text className="text-[#BEACC3] font-inter-medium text-base">Agora não</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
