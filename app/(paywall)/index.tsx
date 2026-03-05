import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Platform,
    SafeAreaView,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
    ViewToken,
} from 'react-native';
import { CheckoutWebView } from '../../components/specific/CheckoutWebView';
import { STRIPE_URLS } from '../../config/stripe';
import { useAuth } from '../../contexts/AuthContext';
import { useStripeCheckout } from '../../hooks/useSubscription';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Altura fixa do CTA fixo no rodapé — usada para padding do scroll
const CTA_HEIGHT = 160;

type PlanKey = 'weekly' | 'yearly';

const PLANS: Record<PlanKey, {
    id: string;
    label: string;
    price: string;
    priceDetail: string;
    badge: string;
    badgeStyle: 'amber' | 'emerald';
    tagline: string;
    savingsLabel?: string;
}> = {
    weekly: {
        id: 'weekly',
        label: 'Plano Semanal',
        price: 'R$19,90',
        priceDetail: 'por semana',
        badge: '3 dias grátis',
        badgeStyle: 'amber',
        tagline: 'Comece grátis, cancele quando quiser',
    },
    yearly: {
        id: 'yearly',
        label: 'Plano Anual',
        price: 'R$5,90',
        priceDetail: 'por sem. • R$299/ano',
        badge: 'Melhor valor',
        badgeStyle: 'emerald',
        tagline: 'Economize 71% em relação ao semanal',
        savingsLabel: '−71%',
    },
};

const BENEFITS = [
    {
        emoji: '🎬',
        title: 'Queremos que você experimente o Teleprompter-Vilo ',
        highlight: 'GRATUITAMENTE',
        isBell: false,
    },
    {
        emoji: '🔔',
        title: 'Enviaremos um lembrete\nantes do término do seu\nteste gratuito.',
        highlight: null,
        isBell: true,
    },
    {
        emoji: '⚡',
        title: 'Scripts com IA, 4K e\nsem marca d\'água — tudo ',
        highlight: 'PRO',
        isBell: false,
    },
];

const TIMELINE_STEPS = [
    {
        icon: '✓',
        active: true,
        title: 'Hoje: Acesso total',
        description: 'Acesso imediato a todos os recursos premium.',
    },
    {
        icon: '🔔',
        active: false,
        title: 'Dia 2: Lembrete',
        description: 'Aviso antes do término da sua avaliação.',
    },
    {
        icon: '★',
        active: false,
        title: 'Dia 3: Assinatura inicia',
        description: 'Cancele a qualquer momento antes de ser cobrado.',
    },
];

function BenefitSlide({ item }: { item: typeof BENEFITS[0] }) {
    const parts = item.highlight ? item.title.split(item.highlight) : [item.title];

    if (item.isBell) {
        return (
            <View style={{ width: SCREEN_WIDTH }} className="items-center justify-center py-4 px-8">
                <Text className="text-white text-2xl font-bold text-center leading-tight mb-6">
                    {item.title}
                </Text>
                <View style={{ width: 120, height: 120 }} className="relative items-center justify-center">
                    <View className="w-24 h-24 rounded-full bg-white/10 items-center justify-center">
                        <Text style={{ fontSize: 48 }}>🔔</Text>
                    </View>
                    <View
                        style={{ position: 'absolute', top: 2, right: 2 }}
                        className="w-8 h-8 rounded-full bg-red-500 items-center justify-center"
                    >
                        <Text className="text-white text-sm font-bold">1</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={{ width: SCREEN_WIDTH }} className="items-center justify-center py-4 px-8">
            <Text style={{ fontSize: 56 }} className="mb-3">{item.emoji}</Text>
            <Text className="text-white text-2xl font-bold text-center leading-tight">
                {parts[0]}
                {item.highlight && (
                    <Text className="text-amber-400">{item.highlight}</Text>
                )}
                {parts.length > 1 && parts[1]}
            </Text>
        </View>
    );
}

export default function PaywallScreen() {
    const router = useRouter();
    const { userEmail, refreshSubscriptionStatus } = useAuth();
    const { mutate: createCheckout, isPending: creatingCheckout } = useStripeCheckout();

    const [selectedPlan, setSelectedPlan] = useState<PlanKey>('weekly');
    const [notifyEnabled, setNotifyEnabled] = useState(true);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const [activeBenefitIndex, setActiveBenefitIndex] = useState(0);

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0) {
                setActiveBenefitIndex(viewableItems[0].index ?? 0);
            }
        }
    ).current;

    const handleContinue = () => {
        const email = userEmail || 'guest@vilo.app';
        createCheckout(
            {
                planId: selectedPlan,
                email,
                successUrl: STRIPE_URLS.successUrl,
                cancelUrl: STRIPE_URLS.cancelUrl,
            } as any,
            {
                onSuccess: (data: any) => {
                    if (data?.checkoutUrl) {
                        setCheckoutUrl(data.checkoutUrl);
                    } else {
                        Alert.alert('Erro', 'Não foi possível gerar o link de pagamento.');
                    }
                },
                onError: (error: any) => {
                    Alert.alert('Erro', error?.message || 'Não foi possível iniciar o checkout.');
                },
            }
        );
    };

    const handleCheckoutSuccess = async () => {
        setCheckoutUrl(null);
        await refreshSubscriptionStatus();
        Alert.alert(
            '🎉 Bem-vindo ao Pro!',
            'Seu acesso premium está ativo!',
            [{ text: 'Continuar', onPress: () => router.replace('/(tabs)') }]
        );
    };

    const handleCheckoutCancel = () => setCheckoutUrl(null);
    const plan = PLANS[selectedPlan];

    const handleSkip = () => {
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0d17' }}>
            <StatusBar style="light" />

            {/* ── Botão fechar (X) ── */}
            <TouchableOpacity
                onPress={handleSkip}
                activeOpacity={0.7}
                style={{
                    position: 'absolute',
                    top: Platform.OS === 'ios' ? 56 : 20,
                    right: 20,
                    zIndex: 10,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '700', lineHeight: 18 }}>✕</Text>
            </TouchableOpacity>

            {/* ── Conteúdo scrollável ── */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: CTA_HEIGHT + 16 }}
                showsVerticalScrollIndicator={false}
                bounces
            >
                {/* Carrossel de benefícios */}
                <View style={{ paddingTop: 32 }}>
                    <FlatList
                        data={BENEFITS}
                        horizontal
                        pagingEnabled
                        snapToAlignment="center"
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, i) => String(i)}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                        decelerationRate="fast"
                        style={{ height: 220 }}
                        renderItem={({ item }) => <BenefitSlide item={item} />}
                    />
                    {/* Pagination dots */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 4, gap: 6 }}>
                        {BENEFITS.map((_, i) => (
                            <View
                                key={i}
                                style={{
                                    borderRadius: 99,
                                    backgroundColor: i === activeBenefitIndex ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                                    width: i === activeBenefitIndex ? 16 : 8,
                                    height: 8,
                                }}
                            />
                        ))}
                    </View>
                </View>

                {/* Timeline — "Como funciona" */}
                <View style={{
                    marginHorizontal: 20,
                    marginTop: 16,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14, textTransform: 'uppercase' }}>
                        Como funciona seu teste
                    </Text>
                    {TIMELINE_STEPS.map((step, index) => (
                        <View key={index} style={{ flexDirection: 'row', marginBottom: index < TIMELINE_STEPS.length - 1 ? 0 : 0 }}>
                            {/* Icon + line */}
                            <View style={{ alignItems: 'center', marginRight: 12 }}>
                                <View style={{
                                    width: 32, height: 32, borderRadius: 16,
                                    backgroundColor: step.active ? '#fbbf24' : '#1e293b',
                                    borderWidth: step.active ? 0 : 1,
                                    borderColor: 'rgba(255,255,255,0.15)',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: step.active ? '#0b0d17' : '#fff' }}>
                                        {step.icon}
                                    </Text>
                                </View>
                                {index < TIMELINE_STEPS.length - 1 && (
                                    <View style={{
                                        width: 2, height: 28,
                                        backgroundColor: step.active ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)',
                                        marginTop: 2,
                                    }} />
                                )}
                            </View>
                            {/* Text */}
                            <View style={{ flex: 1, paddingTop: 4, paddingBottom: index < TIMELINE_STEPS.length - 1 ? 20 : 0 }}>
                                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{step.title}</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>{step.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Cards de plano */}
                <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 16, gap: 12 }}>
                    {(Object.keys(PLANS) as PlanKey[]).map((key) => {
                        const p = PLANS[key];
                        const isSelected = selectedPlan === key;
                        return (
                            <TouchableOpacity
                                key={key}
                                activeOpacity={0.8}
                                onPress={() => setSelectedPlan(key)}
                                style={{
                                    flex: 1,
                                    borderRadius: 20,
                                    padding: 14,
                                    borderWidth: 2,
                                    borderColor: isSelected ? '#fbbf24' : 'rgba(255,255,255,0.12)',
                                    backgroundColor: isSelected ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.04)',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Checkmark */}
                                {isSelected && (
                                    <View style={{
                                        position: 'absolute', top: 10, right: 10,
                                        width: 20, height: 20, borderRadius: 10,
                                        backgroundColor: '#fbbf24',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Text style={{ color: '#0b0d17', fontSize: 11, fontWeight: '900' }}>✓</Text>
                                    </View>
                                )}
                                {/* Savings badge */}
                                {p.savingsLabel && (
                                    <View style={{
                                        position: 'absolute', top: 10, left: 10,
                                        backgroundColor: '#10b981',
                                        paddingHorizontal: 6, paddingVertical: 2,
                                        borderRadius: 6,
                                    }}>
                                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{p.savingsLabel}</Text>
                                    </View>
                                )}

                                <Text style={{
                                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)',
                                    fontSize: 13, fontWeight: '700',
                                    marginTop: p.savingsLabel ? 22 : 0,
                                    marginBottom: 4,
                                }}>
                                    {p.label}
                                </Text>
                                <Text style={{ color: isSelected ? '#fbbf24' : 'rgba(255,255,255,0.4)', fontSize: 22, fontWeight: '800' }}>
                                    {p.price}
                                </Text>
                                <Text style={{ color: isSelected ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 2 }}>
                                    {p.priceDetail}
                                </Text>

                                <View style={{
                                    marginTop: 10,
                                    paddingVertical: 5, paddingHorizontal: 10,
                                    borderRadius: 8, alignSelf: 'flex-start',
                                    backgroundColor: p.badgeStyle === 'amber' ? 'rgba(251,191,36,0.2)' : 'rgba(52,211,153,0.2)',
                                }}>
                                    <Text style={{
                                        fontSize: 11, fontWeight: '700',
                                        color: p.badgeStyle === 'amber' ? '#fbbf24' : '#34d399',
                                    }}>
                                        {p.badge}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Toggle de notificação */}
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    marginHorizontal: 20, marginTop: 14,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                }}>
                    <Switch
                        trackColor={{ false: '#1e293b', true: '#fbbf24' }}
                        thumbColor={notifyEnabled ? '#0b0d17' : '#94a3b8'}
                        ios_backgroundColor="#1e293b"
                        onValueChange={setNotifyEnabled}
                        value={notifyEnabled}
                    />
                    <Text style={{ color: 'rgba(255,255,255,0.55)', marginLeft: 12, fontSize: 13, flex: 1 }}>
                        Avisar-me antes do teste terminar
                    </Text>
                </View>
            </ScrollView>

            {/* ── CTA FIXO NO RODAPÉ ── */}
            <View style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                backgroundColor: '#0b0d17',
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.08)',
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: Platform.OS === 'ios' ? 32 : 20,
            }}>
                {/* Tagline */}
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', marginBottom: 8 }}>
                    {plan.tagline}
                </Text>

                {/* Badge "nenhum pagamento" */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10, gap: 6 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' }}>
                        Nenhum pagamento devido agora!
                    </Text>
                </View>

                {/* Botão CTA */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handleContinue}
                    disabled={creatingCheckout}
                    style={{
                        backgroundColor: '#ffffff',
                        borderRadius: 16,
                        paddingVertical: 16,
                        alignItems: 'center',
                        marginBottom: 10,
                        opacity: creatingCheckout ? 0.8 : 1,
                    }}
                >
                    {creatingCheckout ? (
                        <ActivityIndicator color="#0b0d17" />
                    ) : (
                        <Text style={{ color: '#0b0d17', fontSize: 17, fontWeight: '800' }}>
                            Experimente GRÁTIS
                        </Text>
                    )}
                </TouchableOpacity>

                <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'center' }}>
                    Termos • Privacidade • Restaurar{'\n'}Renova automaticamente. Cancele quando quiser.
                </Text>
            </View>

            {/* Stripe Checkout WebView */}
            <CheckoutWebView
                checkoutUrl={checkoutUrl}
                isVisible={!!checkoutUrl}
                onSuccess={handleCheckoutSuccess}
                onCancel={handleCheckoutCancel}
            />
        </SafeAreaView>
    );
}
