import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Image, Text, View, TouchableOpacity, Alert } from 'react-native';
import * as yup from 'yup';
import { Button } from '../../components/base/Button';
import { Input } from '../../components/base/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function SignupScreen() {
    const { t } = useTranslation();

    const schema = yup.object({
        name: yup.string().required(t('auth.email_required')), // Reusing generic required text or name required
        email: yup.string().email(t('auth.email_invalid')).required(t('auth.email_required')),
        password: yup.string().min(6, t('auth.password_min')).required(t('auth.password_required')),
    }).required();

    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });
    const { signUp } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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
            <View className="items-center mb-10">
                <Image
                    source={require('../../assets/images/veo-logo.png')}
                    style={{ width: 240, height: 80 }}
                    resizeMode="contain"
                />
            </View>
            <View className="mb-12">
                <Text className="text-4xl font-inter-bold text-white mb-3 text-center tracking-tight">{t('auth.signup_title')}</Text>
                <Text className="text-base font-inter-medium text-text-secondary text-center px-4">{t('auth.signup_subtitle')}</Text>
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
                        {errors.name && <Text className="text-red-400 mt-1 text-sm">{errors.name.message}</Text>}
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
                        {errors.email && <Text className="text-red-400 mt-1 text-sm">{errors.email.message}</Text>}
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
                            placeholder={t('auth.password_signup_placeholder')}
                            secureTextEntry
                            onChangeText={onChange}
                            value={value}
                        />
                        {errors.password && <Text className="text-red-400 mt-1 text-sm">{errors.password.message}</Text>}
                    </View>
                )}
            />

            <Button
                title={t('auth.signup_button')}
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading}
            />

            <View className="mt-8 flex-row justify-center">
                <Text className="text-text-secondary">{t('auth.has_account')}</Text>
                <Link href="/(auth)/login" asChild>
                    <Text className="text-primary font-bold ml-1">{t('auth.login_link')}</Text>
                </Link>
            </View>

            {/* Social Logins */}
            <View className="mt-8 px-4">
                <View className="flex-row items-center mb-6">
                    <View className="flex-1 h-[1px] bg-border/30" />
                    <Text className="mx-4 font-inter-medium text-text-secondary text-sm">Ou continue com</Text>
                    <View className="flex-1 h-[1px] bg-border/30" />
                </View>

                <View className="flex-row justify-between mb-8 space-x-4">
                    <TouchableOpacity
                        className="flex-1 h-14 bg-card rounded-xl border border-border/50 flex-row items-center justify-center"
                        onPress={() => Alert.alert("Desenvolvimento", "O login OAuth Google nativo funcionará nas builds finais fora do Expo Go.")}
                    >
                        <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg' }} style={{ width: 22, height: 22 }} />
                        <Text className="text-white ml-3 font-inter-semibold">Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-1 h-14 bg-card rounded-xl border border-border/50 flex-row items-center justify-center"
                        onPress={() => Alert.alert("Desenvolvimento", "O login OAuth Apple nativo funcionará nas builds finais para iOS/Mac.")}
                    >
                        <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' }} style={{ width: 22, height: 22, tintColor: 'white' }} />
                        <Text className="text-white ml-3 font-inter-semibold">Apple</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
