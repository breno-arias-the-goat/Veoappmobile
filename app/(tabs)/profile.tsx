import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as StoreReview from 'expo-store-review';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert, FlatList, Linking, Modal, ScrollView,
    Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { changeAndSaveLanguage } from '../../i18n/i18n';

const LANGUAGES = [
    { code: 'pt', label: 'Português' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'ru', label: 'Русский' }
];

const SUPPORT_EMAIL = 'suporte@veo.app';
const TERMS_URL = 'https://veoteleprompter.com/terms';
const PRIVACY_URL = 'https://veoteleprompter.com/privacy';

export default function ProfileScreen() {
    const { signOut, subscriptionStatus, isPro, credits, subscriptionPlan, user, updateUserProfile } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const { t, i18n } = useTranslation();

    const [isLangModalVisible, setLangModalVisible] = useState(false);
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSignOut = async () => {
        Alert.alert(
            t('profile.sign_out'),
            t('profile.sign_out_confirm') || 'Tem certeza que deseja sair?',
            [
                { text: t('common.cancel') || 'Cancelar', style: 'cancel' },
                {
                    text: t('profile.sign_out'),
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        showToast(t('profile.session_ended'), 'info');
                    }
                }
            ]
        );
    };

    const handleOpenEdit = () => {
        setFirstName(user?.firstName || '');
        setLastName(user?.lastName || '');
        setEditModalVisible(true);
    };

    const handleSaveProfile = async () => {
        if (!firstName.trim()) {
            showToast('O nome não pode estar vazio', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await updateUserProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
            showToast('✅ Perfil atualizado com sucesso!', 'success');
            setEditModalVisible(false);
        } catch (err: any) {
            showToast(err?.message || 'Erro ao atualizar perfil', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSupport = () => {
        const subject = encodeURIComponent('Suporte – VEO App');
        const body = encodeURIComponent(`Olá,\n\nConta: ${user?.email || ''}\n\nDescreva seu problema:\n`);
        Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() =>
            showToast(`Envie um email para ${SUPPORT_EMAIL}`, 'info')
        );
    };

    const handleRateUs = async () => {
        try {
            if (await StoreReview.hasAction()) {
                await StoreReview.requestReview();
            } else {
                // Fallback: open store directly
                const { Platform } = require('react-native');
                const url = Platform.OS === 'ios'
                    ? 'itms-apps://itunes.apple.com/app/id6744289074?action=write-review'
                    : 'market://details?id=com.brenododrop.veoteleprompter';
                Linking.openURL(url).catch(() => {
                    Linking.openURL(Platform.OS === 'ios'
                        ? 'https://apps.apple.com/app/id6744289074'
                        : 'https://play.google.com/store/apps/details?id=com.brenododrop.veoteleprompter'
                    );
                });
            }
        } catch (error) {
            showToast('Não foi possível abrir a avaliação.', 'error');
        }
    };

    const handleOpenLink = (url: string) => {
        Linking.openURL(url).catch(() => showToast('Não foi possível abrir o link.', 'error'));
    };

    const handleRestorePurchase = () => {
        showToast('Suas compras foram restauradas com sucesso.', 'success');
    };

    const renderListItem = (
        icon: React.ReactNode,
        title: string,
        onPress: () => void,
        showDivider: boolean = true,
        valueText?: string
    ) => (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center px-5 py-4 ${showDivider ? 'border-b border-borderSolid/50' : ''} active:opacity-70`}
        >
            <View className="w-8 mr-2 items-center justify-center">
                {icon}
            </View>
            <Text className="text-white font-inter-semibold text-base flex-1">{title}</Text>
            {valueText && (
                <Text className="text-text-secondary font-inter-medium text-sm mr-2">{valueText}</Text>
            )}
            <MaterialIcons name="chevron-right" size={24} color="#A1A1AA" />
        </TouchableOpacity>
    );

    return (
        <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 60 }}>

            {/* User Info Card */}
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#2D1B69', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Text style={{ color: '#A78BFA', fontSize: 20, fontWeight: '700' }}>
                        {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                        {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email || 'Usuário'}
                    </Text>
                    <Text style={{ color: '#A1A1AA', fontSize: 12, marginTop: 2 }}>{user?.email || ''}</Text>
                </View>
                {isPro ? (
                    <View style={{ backgroundColor: '#2D1B69', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#5E2BFF' }}>
                        <Text style={{ color: '#A78BFA', fontWeight: '700', fontSize: 12 }}>PRO ✦</Text>
                    </View>
                ) : (
                    <View style={{ backgroundColor: '#1F1F1F', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#333' }}>
                        <Text style={{ color: '#A1A1AA', fontWeight: '600', fontSize: 12 }}>FREE</Text>
                    </View>
                )}
            </View>

            {/* Credits Card */}
            <View style={{ backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome name="bolt" size={18} color="#FFD93D" style={{ marginRight: 10 }} />
                    <View>
                        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Créditos</Text>
                        <Text style={{ color: '#A1A1AA', fontSize: 12, marginTop: 2 }}>Para geração de legendas</Text>
                    </View>
                </View>
                <Text style={{ color: '#FFD93D', fontWeight: '800', fontSize: 22 }}>{credits}</Text>
            </View>

            {/* Upgrade Banner for Free Users */}
            {!isPro && (
                <TouchableOpacity
                    onPress={() => router.push('/(paywall)')}
                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A0A30', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#5E2BFF' }}
                >
                    <View style={{ backgroundColor: '#5E2BFF', borderRadius: 10, padding: 10, marginRight: 14 }}>
                        <FontAwesome name="star" size={18} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Upgrade para PRO</Text>
                        <Text style={{ color: '#A78BFA', fontSize: 12, marginTop: 2 }}>Legendas ilimitadas, todos os presets</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color="#5E2BFF" />
                </TouchableOpacity>
            )}

            {/* Assinatura Section */}
            <Text className="text-white font-inter-bold text-xl mb-4 ml-1">Assinatura</Text>
            <View className="bg-[#1A1A1A] rounded-xl mb-8 overflow-hidden">
                {renderListItem(
                    <FontAwesome name="credit-card" size={20} color="#FFFFFF" />,
                    'Gerenciar Assinatura',
                    () => router.push('/(main)/subscription'),
                    false
                )}
            </View>

            {/* Configurações Section */}
            <Text className="text-white font-inter-bold text-xl mb-4 ml-1">Configurações</Text>
            <View className="bg-[#1A1A1A] rounded-xl mb-8 overflow-hidden">
                {renderListItem(
                    <FontAwesome name="language" size={20} color="#FFFFFF" />,
                    'Linguagem',
                    () => setLangModalVisible(true),
                    true,
                    LANGUAGES.find(l => l.code === i18n.language.split('-')[0])?.label || 'Português'
                )}
                {renderListItem(
                    <FontAwesome name="user-o" size={20} color="#FFFFFF" />,
                    t('profile.edit_info') || 'Editar Informações',
                    handleOpenEdit,
                    true
                )}
                {renderListItem(
                    <FontAwesome name="file-text-o" size={20} color="#FFFFFF" />,
                    t('profile.my_scripts') || 'Meus Scripts',
                    () => router.push('/(tabs)/scripts'),
                    true
                )}
                {renderListItem(
                    <FontAwesome name="video-camera" size={20} color="#FFFFFF" />,
                    t('profile.my_videos') || 'Meus Vídeos',
                    () => router.push('/(tabs)/videos'),
                    false
                )}
            </View>

            {/* Apoiar Section */}
            <Text className="text-white font-inter-bold text-xl mb-4 ml-1">Apoiar</Text>
            <View className="bg-[#1A1A1A] rounded-xl mb-8 overflow-hidden">
                {renderListItem(
                    <FontAwesome name="support" size={20} color="#FFFFFF" />,
                    'Ajuda',
                    handleSupport,
                    true
                )}
                {renderListItem(
                    <FontAwesome name="star-o" size={20} color="#FFFFFF" />,
                    'Avalie-nos',
                    handleRateUs,
                    true
                )}
                {renderListItem(
                    <FontAwesome name="clipboard" size={20} color="#FFFFFF" />,
                    'Termos de uso',
                    () => handleOpenLink(TERMS_URL),
                    true
                )}
                {renderListItem(
                    <FontAwesome name="shield" size={20} color="#FFFFFF" />,
                    'Política de Privacidade',
                    () => handleOpenLink(PRIVACY_URL),
                    true
                )}
                {renderListItem(
                    <FontAwesome name="history" size={20} color="#FFFFFF" />,
                    'Restaurar Compra',
                    handleRestorePurchase,
                    false
                )}
            </View>

            {/* Conta Section */}
            <Text className="text-white font-inter-bold text-xl mb-4 ml-1">Conta</Text>
            <View className="bg-[#1A1A1A] rounded-xl mb-8 overflow-hidden">
                <TouchableOpacity
                    onPress={handleSignOut}
                    className="flex-row items-center px-5 py-4 active:opacity-70"
                >
                    <View className="w-8 mr-2 items-center justify-center">
                        <FontAwesome name="sign-out" size={20} color="#F87171" />
                    </View>
                    <Text className="text-red-400 font-inter-semibold text-base flex-1 w-full">{t('profile.sign_out') || 'Sair da Conta'}</Text>
                    <MaterialIcons name="chevron-right" size={24} color="#A1A1AA" />
                </TouchableOpacity>
            </View>

            <Text className="text-center text-zinc-500 font-inter-medium text-xs mb-8">
                v14.7.4 - 1
            </Text>

            {/* ─── Language Modal ─────────────────────────────────────────────────── */}
            <Modal
                visible={isLangModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setLangModalVisible(false)}
            >
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <View className="bg-surface rounded-t-3xl pt-6 pb-8 px-6 border-t border-border mt-auto">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-white">{t('profile.lang_modal_title')}</Text>
                            <TouchableOpacity onPress={() => setLangModalVisible(false)} className="p-2 border border-border rounded-full w-8 h-8 items-center justify-center">
                                <Text className="text-text-secondary font-bold text-sm">✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={LANGUAGES}
                            keyExtractor={item => item.code}
                            renderItem={({ item }) => {
                                const isActive = i18n.language.split('-')[0] === item.code;
                                return (
                                    <TouchableOpacity
                                        className={`flex-row items-center px-4 py-4 mb-2 rounded-xl border ${isActive ? 'bg-primary/20 border-primary' : 'bg-[#1A1A1A] border-[#333]'}`}
                                        onPress={() => {
                                            changeAndSaveLanguage(item.code);
                                            setLangModalVisible(false);
                                            showToast(`${t('profile.lang_set')} ${item.label}`, 'success');
                                        }}
                                    >
                                        <Text className={`text-lg flex-1 font-inter-semibold ${isActive ? 'text-primary' : 'text-white'}`}>
                                            {item.label}
                                        </Text>
                                        {isActive && <FontAwesome name="check" size={16} color="#5E2BFF" />}
                                    </TouchableOpacity>
                                );
                            }}
                            style={{ maxHeight: 400 }}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>

            {/* ─── Edit Profile Modal ─────────────────────────────────────────────── */}
            <Modal
                visible={isEditModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <View className="bg-surface rounded-t-3xl pt-6 pb-10 px-6 border-t border-border mt-auto">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-white">{t('profile.edit_info')}</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-2 border border-border rounded-full w-8 h-8 items-center justify-center">
                                <Text className="text-text-secondary font-bold text-sm">✕</Text>
                            </TouchableOpacity>
                        </View>

                        <Text className="text-text-secondary font-inter-medium text-sm mb-2">Nome</Text>
                        <TextInput
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="Seu nome"
                            placeholderTextColor="#666"
                            style={{
                                backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333',
                                borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                                color: '#fff', fontSize: 16, marginBottom: 16, fontFamily: 'Inter_500Medium'
                            }}
                        />

                        <Text className="text-text-secondary font-inter-medium text-sm mb-2">Sobrenome</Text>
                        <TextInput
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Seu sobrenome"
                            placeholderTextColor="#666"
                            style={{
                                backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333',
                                borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                                color: '#fff', fontSize: 16, marginBottom: 24, fontFamily: 'Inter_500Medium'
                            }}
                        />

                        <TouchableOpacity
                            onPress={handleSaveProfile}
                            disabled={isSaving}
                            style={{
                                backgroundColor: '#5E2BFF', borderRadius: 16, paddingVertical: 16,
                                alignItems: 'center', opacity: isSaving ? 0.7 : 1,
                            }}
                        >
                            {isSaving
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                                    Salvar Alterações
                                </Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}
