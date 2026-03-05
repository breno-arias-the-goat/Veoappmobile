import { View, TextInput } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Buscar...' }: SearchBarProps) {
    return (
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-md py-sm mb-md border border-gray-200 dark:border-gray-700">
            <FontAwesome name="search" size={16} color="#9ca3af" />
            <TextInput
                className="flex-1 ml-sm text-base font-inter text-text-dark dark:text-text-light"
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                value={value}
                onChangeText={onChangeText}
            />
        </View>
    );
}
