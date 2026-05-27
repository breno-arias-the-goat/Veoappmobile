import { yupResolver } from '@hookform/resolvers/yup';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import * as yup from 'yup';
import { Button } from '../../components/base/Button';
import { Input } from '../../components/base/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '133042398286-nltn0i7vgbuhp4l58suflumjsfvqaubn.apps.googleusercontent.com';

export default function SignupScreen() {
    const { t } = useTranslation();

    const schema = yup.object({
        name: yup.string().required('Nome é obrigatório'),
        email: yup.string().email(t('auth.email_invalid')).required(t('auth.email_required')),
        password: yup.string().min(6, t('auth.password_min')).required(t('auth.password_required')),
    }).required();

    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const { signUp, signInWithGoogle } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // ── Google OAuth ──────────────────────────────────────────────────────────
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_WEB_CLIENT_ID,
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                handleGoogleToken(authentication.accessToken);
            }
        }
    }, [response]);

    const handleGoogleToken = async (token: string) => {
        try {
            setGoogleLoading(true);
            await signInWithGoogle(token);
            showToast('Bem-vindo ao Veo! 🎉', 'success');
            router.replace('/(onboarding)/1');
        } catch (error: any) {
            showToast(error.message || 'Falha no cadastro com Google', 'error');
        } finally {
            setGoogleLoading(false);
        }
    };

    // ── Email/Password ────────────────────────────────────────────────────────
    const onSubmit = async (data: any) => {
        try {
            setLoading(true);
            await signUp(data);
            showToast(t('auth.signup_success_msg'), 'success');
            router.replace('/(onboarding)/1');
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || t('auth.signup_failure');
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center p-8 bg-background">
            <View className="items-center mb-8">
                <Image
                    source={require('../../assets/images/veo-logo.png')}
                    style={{ width: 240, height: 80 }}
                    resizeMode="contain"
                />
            </View>
            <View className="mb-6">
                <Text className="text-4xl font-inter-bold text-white mb-3 text-center tracking-tight">{t('auth.signup_title')}</Text>
                <Text className="text-base font-inter-medium text-text-secondary text-center px-4">{t('auth.signup_subtitle')}</Text>
            </View>

            {/* Google Sign-Up */}
            <View className="mb-6">
                <TouchableOpacity
                    className="h-14 bg-card rounded-xl border border-border/50 flex-row items-center justify-center mb-3"
                    onPress={() => promptAsync()}
                    disabled={googleLoading || !request}
                >
                    <Text className="text-2xl mr-2">🌐</Text>
                    <Text className="text-white font-inter-semibold text-base">
                        {googleLoading ? 'Entrando...' : 'Continuar com Google'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Divider */}
            <View className="flex-row items-center mb-4">
                <View className="flex-1 h-[1px] bg-border/30" />
                <Text className="mx-4 font-inter-medium text-text-secondary text-sm">ou com email</Text>
                <View className="flex-1 h-[1px] bg-border/30" />
            </View>

            <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                    <View className="mb-4">
                        <Input
                            label={t('auth.firstname_label')}
                            placeholder={t('auth.firstname_placeholder')}
                            onChangeText={onChange}
                            value={value}
                        />
                        {errors.name && (
                            <Text style={{ color: '#FF3366', fontSize: 12, marginTop: 4 }}>
                                {errors.name.message}
                            </Text>
                        )}
                    </View>
                )}
            />

            <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                    <View className="mb-4">
                        <Input
                            label={t('auth.email_label')}
                            placeholder={t('auth.email_placeholder')}
                            onChangeText={onChange}
                            value={value}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        {errors.email && (
                            <Text style={{ color: '#FF3366', fontSize: 12, marginTop: 4 }}>
                                {errors.email.message}
                            </Text>
                        )}
                    </View>
                )}
            />

            <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                    <View className="mb-6">
                        <Input
                            label={t('auth.password_label')}
                            placeholder={t('auth.password_signup_placeholder')}
                            secureTextEntry
                            onChangeText={onChange}
                            value={value}
                        />
                        {errors.password && (
                            <Text style={{ color: '#FF3366', fontSize: 12, marginTop: 4 }}>
                                {errors.password.message}
                            </Text>
                        )}
                    </View>
                )}
            />

            <Button
                title={t('auth.signup_button')}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading}
            />

            <View className="mt-6 flex-row justify-center">
                <Text className="text-text-secondary">{t('auth.has_account')}</Text>
                <Link href="/(auth)/login" asChild>
                    <Text className="text-primary font-bold ml-1">{t('auth.login_link')}</Text>
                </Link>
            </View>
        </View>
    );
}
