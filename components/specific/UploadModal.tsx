import React from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';


interface UploadModalProps {
    visible: boolean;
    progress: number;
    title?: string;
}

export function UploadModal({ visible, progress, title = "Fazendo upload..." }: UploadModalProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
        >
            <View className="flex-1 justify-center items-center bg-black/60 p-xl">
                <View className="bg-background-light dark:bg-background-dark p-xl rounded-2xl w-full max-w-sm items-center">
                    <ActivityIndicator size="large" color="#3975F9" className="mb-md" />
                    <Text className="text-lg font-inter-bold text-text-dark dark:text-text-light mb-sm text-center">
                        {title}
                    </Text>

                    <View className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden mb-sm mt-md">
                        <View
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </View>

                    <Text className="text-sm font-inter text-gray-500 dark:text-gray-400">
                        {progress}% concluído
                    </Text>
                </View>
            </View>
        </Modal>
    );
}
