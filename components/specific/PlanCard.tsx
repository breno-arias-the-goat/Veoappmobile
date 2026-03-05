import React from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Plan {
    id: string;
    name: string;
    price: number;
    features: string[];
    popular?: boolean;
    savingsPercent?: number;
    trialDays?: number;
}

interface PlanCardProps {
    plan: Plan;
    isSelected: boolean;
    isLoading?: boolean;
    onSelect: () => void;
}

export function PlanCard({ plan, isSelected, isLoading, onSelect }: PlanCardProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onSelect}
            disabled={isLoading}
            className={`p-xl rounded-2xl mb-lg border-2 relative overflow-hidden ${isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark'
                }`}
        >
            {/* "MAIS POPULAR" badge */}
            {plan.popular && (
                <View className="absolute -top-3 left-4 bg-accent px-sm py-xs rounded-full">
                    <Text className="text-white text-xs font-inter-bold">MAIS POPULAR</Text>
                </View>
            )}

            {/* Savings badge */}
            {plan.savingsPercent && (
                <View className="absolute top-3 right-3 bg-emerald-500 px-2 py-1 rounded-lg">
                    <Text className="text-white text-xs font-inter-bold">
                        −{plan.savingsPercent}%
                    </Text>
                </View>
            )}

            {/* Trial badge */}
            {plan.trialDays && (
                <View className="absolute top-3 right-3 bg-amber-500/20 px-2 py-1 rounded-lg">
                    <Text className="text-amber-500 text-xs font-inter-bold">
                        {plan.trialDays}d grátis
                    </Text>
                </View>
            )}

            <View className="flex-row justify-between items-center mb-md">
                <Text className="text-xl font-inter-bold text-text-dark dark:text-text-light">
                    {plan.name}
                </Text>
                <Text className="text-2xl font-inter-bold text-primary">
                    {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                </Text>
            </View>

            <View className="mb-lg space-y-2">
                {plan.features.map((feature, index) => (
                    <View key={index} className="flex-row items-center mb-xs">
                        <FontAwesome name="check-circle" size={16} color="#10B981" />
                        <Text className="ml-sm font-inter text-text-dark dark:text-text-light opacity-80">
                            {feature}
                        </Text>
                    </View>
                ))}
            </View>

            <View
                className={`py-md rounded-lg items-center ${isSelected ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-800'
                    }`}
            >
                {isLoading ? (
                    <ActivityIndicator
                        size="small"
                        color={isSelected ? '#ffffff' : '#3975F9'}
                    />
                ) : (
                    <Text
                        className={`font-inter-bold ${isSelected
                                ? 'text-white'
                                : 'text-text-dark dark:text-text-light opacity-60'
                            }`}
                    >
                        {isSelected ? 'Plano Selecionado' : 'Selecionar Plano'}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}
