import React, { useRef } from 'react';
import { Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps {
    title: string;
    onPress: () => void;
    className?: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
}

export function Button({ title, onPress, className = '', variant = 'primary', loading = false, disabled = false }: ButtonProps) {
    const scale = useRef(new Animated.Value(1)).current;
    const isDisabled = disabled || loading;

    console.log("🔥 NativeWind HMR Forced Update: Button Rendered");

    const animateIn = () => {
        if (isDisabled) return;
        Animated.spring(scale, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 20,
            bounciness: 2
        }).start();
    };

    const animateOut = () => {
        if (isDisabled) return;
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 2
        }).start();
    };

    const baseStyle = 'px-6 py-4 rounded-full items-center justify-center flex-row flex-shrink-0';
    const variants = {
        primary: `bg-primary shadow-lg shadow-primary/30 ${isDisabled ? 'opacity-50' : ''}`,
        secondary: `bg-surface border border-borderSolid shadow-sm ${isDisabled ? 'opacity-50' : ''}`,
        ghost: `bg-transparent ${isDisabled ? 'opacity-50' : ''}`,
    };

    const textStyle = {
        primary: 'text-white text-base font-inter-semibold tracking-wide',
        secondary: 'text-white text-base font-inter-semibold tracking-wide',
        ghost: 'text-primary text-base font-inter-semibold tracking-wide',
    };

    return (
        <AnimatedTouchableOpacity
            style={{ transform: [{ scale }] }}
            className={`${baseStyle} ${variants[variant]} ${className}`}
            onPressIn={animateIn}
            onPressOut={animateOut}
            onPress={onPress}
            activeOpacity={isDisabled ? 1 : 0.85}
            disabled={isDisabled}
        >
            {loading && (
                <ActivityIndicator
                    size="small"
                    color={variant === 'ghost' ? '#5E2BFF' : '#ffffff'}
                    style={{ marginRight: 8 }}
                />
            )}
            <Text className={textStyle[variant]}>
                {loading ? 'Processando...' : title}
            </Text>
        </AnimatedTouchableOpacity>
    );
}
