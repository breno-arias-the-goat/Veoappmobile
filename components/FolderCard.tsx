import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { Folder } from '../services/folderService';
import { useDeleteFolder } from '../hooks/useFolders';

interface Props {
    folder: Folder;
    onPress: (folder: Folder) => void;
    onEdit: (folder: Folder) => void;
}

export const FolderCard: React.FC<Props> = ({ folder, onPress, onEdit }) => {
    const { mutate: deleteFolder } = useDeleteFolder();

    const handleLongPress = () => {
        Alert.alert(folder.name, undefined, [
            { text: '✏️  Renomear', onPress: () => onEdit(folder) },
            {
                text: '🗑  Excluir',
                style: 'destructive',
                onPress: () =>
                    Alert.alert(
                        'Excluir pasta',
                        `"${folder.name}" será excluída. Os itens voltam para "Sem Pasta".`,
                        [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Excluir', style: 'destructive', onPress: () => deleteFolder(folder.id) },
                        ]
                    ),
            },
            { text: 'Cancelar', style: 'cancel' },
        ]);
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(folder)}
            onLongPress={handleLongPress}
            activeOpacity={0.75}
            delayLongPress={400}
        >
            {/* Folder icon area */}
            <View style={styles.iconWrap}>
                <Text style={styles.icon}>📁</Text>
            </View>

            {/* Name */}
            <Text style={styles.name} numberOfLines={2}>
                {folder.name}
            </Text>

            {/* Item count */}
            <Text style={styles.count}>
                {folder.itemCount ?? 0} {(folder.itemCount ?? 0) === 1 ? 'item' : 'itens'}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        margin: 6,
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 14,
        minHeight: 130,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'space-between',
    },
    iconWrap: {
        width: 48,
        height: 48,
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    icon: { fontSize: 26 },
    name: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 19,
        flex: 1,
        marginBottom: 6,
    },
    count: {
        color: '#555',
        fontSize: 12,
    },
});
