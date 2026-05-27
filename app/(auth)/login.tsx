import { yupResolver } from '@hookform/resolvers/yup';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { Link } from 'expo-router';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Image, Platform, Text, TouchableOpacity, View } from 'react-native';
import * as yup from 'yup';
import { Button } from '../../components/base/Button';
import { Input } from '../../components/base/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '133042398286-nltn0i7vgbuhp4l58suflumjsfvqaubn.apps.googleusercontent.com';

export default function LoginScreen() {
    const { t } = useTranslation();

    const schema = yup.object({
        email: yup.string().email(t('auth.email_invalid')).required(t('auth.email_required')),
        password: yup.string().min(6, t('auth.password_min')).required(t('auth.password_required')),
    }).required();

    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const { signIn, signInWithGoogle, signInWithApple } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);

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
            showToast(t('auth.login_success'), 'success');
        } catch (error: any) {
            showToast(error.message || 'Falha no login com Google', 'error');
        } finally {
            setGoogleLoading(false);
        }
    };

    // ── Apple Sign-In ─────────────────────────────────────────────────────────
    const handleAppleSignIn = async () => {
        try {
            setAppleLoading(true);
            const nonce = Crypto.randomUUID();
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce,
            });
            if (credential.identityToken) {
                await signInWithApple(credential.identityToken, nonce);
                showToast(t('auth.login_success'), 'success');
            }
        } catch (error: any) {
            if (error.code !== 'ERR_REQUEST_CANCELED') {
                showToast(error.message || 'Falha no login com Apple', 'error');
            }
        } finally {
            setAppleLoading(false);
        }
    };

    // ── Email/Password ────────────────────────────────────────────────────────
    const onSubmit = async (data: any) => {
        try {
            setLoading(true);
            await signIn(data);
            showToast(t('auth.login_success'), 'success');
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || t('auth.auth_failure');
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center p-8 bg-background">
            <View className="items-center mb-10">
                <Image
                    source={require('../../assets/images/veo-logo.png')}
                    style={{ width: 240, height: 80 }}
                    resizeMode="contain"
                />
            </View>
            <View className="mb-8">
                <Text className="text-4xl font-inter-bold text-white mb-3 text-center tracking-tight">{t('auth.login_title')}</Text>
                <Text className="text-base font-inter-medium text-text-secondary text-center px-4">{t('auth.login_subtitle')}</Text>
            </View>

            {/* Social Logins */}
            <View className="mb-6">
                <TouchableOpacity
                    className="h-14 bg-card rounded-xl border border-border/50 flex-row items-center justify-center mb-3"
                    onPress={() => promptAsync()}
                    disabled={googleLoading || !request}
                >
                    <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg' }} style={{ width: 22, height: 22 }} />
                    <Text className="text-white ml-3 font-inter-semibold">
                        {googleLoading ? 'Entrando...' : 'Continuar com Google'}
                    </Text>
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                    <AppleAuthentication.AppleAuthenticationButton
                        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                        cornerRadius={12}
                        style={{ height: 56 }}
                        onPress={handleAppleSignIn}
                    />
                )}
            </View>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
                <View className="flex-1 h-[1px] bg-border/30" />
                <Text className="mx-4 font-inter-medium text-text-secondary text-sm">ou com email</Text>
                <View className="flex-1 h-[1px] bg-border/30" />
            </View>

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
                            <Text style={{ color: '#FF3366', fontSize: 12, marginTop: 4, marginBottom: 8 }}>
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
                    <View className="mb-8">
                        <Input
                            label={t('auth.password_label')}
                            placeholder={t('auth.password_placeholder')}
                            secureTextEntry
                            onChangeText={onChange}
                            value={value}
                        />
                        {errors.password && (
                            <Text style={{ color: '#FF3366', fontSize: 12, marginTop: 4, marginBottom: 8 }}>
                                {errors.password.message}
                            </Text>
                        )}
                    </View>
                )}
            />

            <Button
                title={t('auth.enter_button')}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading}
            />

            <View className="mt-8 flex-row justify-center">
                <Text className="text-text-secondary">{t('auth.no_account')}</Text>
                <Link href="/(auth)/signup" asChild>
                    <Text className="text-primary font-bold ml-1">{t('auth.signup_link')}</Text>
                </Link>
            </View>
        </View>
    );
}
