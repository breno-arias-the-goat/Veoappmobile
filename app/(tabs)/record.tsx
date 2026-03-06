import { useIsFocused } from '@react-navigation/native';
import { CameraView } from 'expo-camera';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { RecordControls } from '../../components/specific/RecordControls';
import { Teleprompter } from '../../components/specific/Teleprompter';
import { useCamera } from '../../hooks/useCamera';
import { getScriptById } from '../../services/scriptService';

export default function RecordScreen() {
    const { scriptId } = useGlobalSearchParams();
    const router = useRouter();
    const isFocused = useIsFocused();

    const [scriptText, setScriptText] = useState(
        "Preparando o seu estúdio e o roteiro..."
    );
    const [speed, setSpeed] = useState(70);
    const [fontSize, setFontSize] = useState(24);
    const [isScrolling, setIsScrolling] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);

    // Listener reativo: Busca o texto completo ilimitado da nuvem ou do aparelho através da ID do Script em vez da URL truncada
    useEffect(() => {
        const fetchScript = async () => {
            setIsScrolling(false); // Segurança: Para Rolagem
            setScriptText("Preparando o seu estúdio e o roteiro..."); // Loading Screen

            if (scriptId) {
                try {
                    const data = await getScriptById(scriptId as string);
                    if (data && data.content) {
                        setScriptText(data.content);
                    }
                } catch (error) {
                    console.error("Erro ao carregar script completo", error);
                    setScriptText("Erro ao carregar o roteiro salvos no servidor.");
                }
            } else {
                setScriptText("Este é um texto de exemplo para o teleprompter. Ajuste a velocidade e o tamanho da fonte usando os controles na parte inferior do aplicativo. Quando você estiver preparado para começar, clique no botão de gravar.\n\nAproveite a contagem regressiva e prepare-se para o sucesso.");
            }
        };
        fetchScript();
    }, [scriptId]);

    const {
        hasPermission,
        cameraPermission,
        checkPermissions,
        cameraRef,
        isRecording,
        cameraType,
        startRecording,
        stopRecording,
        flipCamera
    } = useCamera();

    useEffect(() => {
        checkPermissions();
    }, [checkPermissions]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown !== null) {
            if (countdown > 0) {
                timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            } else {
                setCountdown(null);
                handleStartRecording();
            }
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleRecordPress = () => {
        if (Platform.OS === 'web') {
            alert("A gravação de vídeo não é suportada na versão web atualmente. Use o aplicativo iOS/Android.");
            return;
        }
        if (!hasPermission) {
            Alert.alert("Permissão Necessária", "Precisamos de acesso à câmera e ao microfone para gravar.");
            return;
        }
        // Initiate countdown
        setCountdown(3);
    };

    const handleStartRecording = async () => {
        setIsScrolling(true);
        const uri = await startRecording();
        setIsScrolling(false);
        if (uri) {
            console.log("Vídeo salvo localmente em:", uri);
            router.push({ pathname: '/(main)/preview', params: { videoUri: uri, scriptId: scriptId } });
        }
    };

    const handleStopPress = () => {
        setIsScrolling(false);
        stopRecording();
    };

    if (Platform.OS !== 'web' && cameraPermission !== null && hasPermission === false) {
        return (
            <View className="flex-1 justify-center items-center bg-background-light dark:bg-background-dark p-lg">
                <Text className="text-xl font-inter-bold text-center mb-md text-text-dark dark:text-text-light">Sem acesso à câmera</Text>
                <Text className="text-center text-text-dark dark:text-text-light opacity-70">
                    Você precisa conceder as permissões de câmera e microfone nas configurações do dispositivo para usar a gravação!
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            {Platform.OS === 'web' ? (
                <View className="flex-1 bg-gray-900 justify-center items-center p-xl">
                    <Text className="text-white text-lg font-inter-bold text-center">
                        Câmera indisponível na Web
                    </Text>
                    <Text className="text-gray-400 mt-2 text-center max-w-sm">
                        Para gravar seus textos no teleprompter e salvar vídeos, acesse o VILO através do aplicativo no seu celular.
                    </Text>
                </View>
            ) : !isFocused ? (
                <View className="flex-1 bg-black justify-center items-center">
                    <Text className="text-white text-lg font-inter-medium opacity-50">Câmera desativada (Aba inativa)</Text>
                </View>
            ) : hasPermission ? (
                <CameraView
                    ref={cameraRef}
                    style={{ flex: 1 }}
                    facing={cameraType}
                    mode="video"
                />
            ) : (
                <View className="flex-1 bg-black justify-center items-center">
                    <Text className="text-white">Solicitando permissões...</Text>
                </View>
            )}

            {/* Teleprompter Overlay */}
            <View pointerEvents="none" className="absolute top-0 left-0 right-0 bottom-40 bg-black/40 pt-xl">
                <Teleprompter
                    scriptText={scriptText}
                    speed={speed}
                    fontSize={fontSize}
                    isScrolling={isScrolling}
                />
            </View>

            {/* Controls Overlay */}
            <View className="absolute bottom-0 left-0 right-0">
                <RecordControls
                    isRecording={isRecording}
                    onRecordPress={handleRecordPress}
                    onStopPress={handleStopPress}
                    onFlipCamera={flipCamera}
                    speed={speed}
                    setSpeed={setSpeed}
                    fontSize={fontSize}
                    setFontSize={setFontSize}
                    countdown={countdown}
                />
            </View>
        </View>
    );
}
