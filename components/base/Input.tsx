import { TextInput, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    className?: string;
}

export function Input({ label, placeholder, value, onChangeText, secureTextEntry, className = '', ...rest }: InputProps) {
    return (
        <View className={`mb-5 w-full ${className}`}>
            {label && <Text className="text-text-secondary text-sm font-inter-semibold mb-2 ml-1">{label}</Text>}
            <TextInput
                className="bg-surface border border-borderSolid rounded-2xl p-4 text-white font-inter-medium focus:border-primary focus:bg-surfaceHover transition-all"
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                placeholderTextColor="#A1A1AA"
                {...rest}
            />
        </View>
    );
}
