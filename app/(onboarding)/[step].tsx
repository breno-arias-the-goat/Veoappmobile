import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../components/base/Button';


const QUIZ_STEPS = [
    {
        step: 1,
        question: "Qual seu principal objetivo com o VILO?",
        options: ["Criar conteúdo para redes sociais", "Gravar vídeos de treinamento", "Uso pessoal"],
        multiple: false,
    },
    {
        step: 2,
        question: "Qual seu nível de experiência com edição de vídeo?",
        options: ["Iniciante", "Intermediário", "Avançado"],
        multiple: false,
    },
    {
        step: 3,
        question: "Quais funcionalidades mais te interessam?",
        options: ["Legendas Automáticas", "Teleprompter", "Edição com IA", "Remoção de Fundo"],
        multiple: true,
    }
];

export default function OnboardingStepScreen() {
    const { step } = useLocalSearchParams();
    const router = useRouter();

    // Trata o caso onde o step pode não existir imediatamente ou ser array
    const currentStepParam = Array.isArray(step) ? step[0] : step;
    const stepIndex = currentStepParam ? parseInt(currentStepParam) - 1 : 0;

    const currentStepData = QUIZ_STEPS[stepIndex];

    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    // O fallback caso a rota seja inválida 
    if (!currentStepData && stepIndex > 0) {
        // Permite contornar falhas de renderização
        setTimeout(() => router.replace('/(tabs)'), 0);
        return null;
    }

    // Prevenção de renderização com undef se a screen for chamada malformada
    if (!currentStepData) return <View className="flex-1 bg-background" />;

    const toggleOption = (option: string) => {
        if (currentStepData.multiple) {
            if (selectedOptions.includes(option)) {
                setSelectedOptions(selectedOptions.filter(o => o !== option));
            } else {
                setSelectedOptions([...selectedOptions, option]);
            }
        } else {
            setSelectedOptions([option]);
        }
    };

    const handleNext = () => {
        if (stepIndex < QUIZ_STEPS.length - 1) {
            router.push(`/(onboarding)/${currentStepData.step + 1}`);
        } else {
            router.replace('/(tabs)');
        }
    };

    return (
        <View className="flex-1 p-6 bg-background justify-center">
            <View className="mb-12 mt-8">
                <Text className="text-sm font-inter text-primary mb-2">Passo {currentStepData.step} de {QUIZ_STEPS.length}</Text>
                <Text className="text-2xl font-inter-bold text-text-primary">{currentStepData.question}</Text>
                {currentStepData.multiple && <Text className="text-sm font-inter text-text-secondary mt-1">Selecione uma ou mais opções</Text>}
            </View>

            <View className="mb-2xl flex-1">
                {currentStepData.options.map((option, index) => {
                    const isSelected = selectedOptions.includes(option);
                    return (
                        <TouchableOpacity
                            key={index}
                            className={`p-4 rounded-lg border mb-4 transition-all active:scale-95 ${isSelected ? 'border-primary bg-primary/10' : 'border-border'}`}
                            onPress={() => toggleOption(option)}
                        >
                            <Text className={`font-inter-medium ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View className="mt-auto mb-lg">
                <Button
                    title={stepIndex === QUIZ_STEPS.length - 1 ? 'Concluir' : 'Continuar'}
                    onPress={handleNext}
                />
            </View>
        </View>
    );
}
