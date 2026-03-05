import { useState, useRef, useCallback } from 'react';
import { Camera, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';

export const useCamera = () => {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

    const [isRecording, setIsRecording] = useState(false);
    const [cameraType, setCameraType] = useState<'front' | 'back'>('front');

    // Using any for the ref because CameraView type doesn't expose recordAsync easily in some expo versions without digging into internals
    const cameraRef = useRef<any>(null);

    const checkPermissions = useCallback(async () => {
        if (!cameraPermission?.granted) {
            await requestCameraPermission();
        }
        if (!microphonePermission?.granted) {
            await requestMicrophonePermission();
        }
    }, [cameraPermission, microphonePermission, requestCameraPermission, requestMicrophonePermission]);

    const startRecording = useCallback(async () => {
        if (!cameraRef.current) return null;

        try {
            setIsRecording(true);
            const video = await cameraRef.current.recordAsync({
                maxDuration: 600, // 10 minutes max for now
            });
            setIsRecording(false);
            return video?.uri || null;
        } catch (error) {
            console.error("Failed to start recording", error);
            setIsRecording(false);
            return null;
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (cameraRef.current && isRecording) {
            cameraRef.current.stopRecording();
            setIsRecording(false);
        }
    }, [isRecording]);

    const flipCamera = useCallback(() => {
        setCameraType(current => (current === 'back' ? 'front' : 'back'));
    }, []);

    const hasPermission = cameraPermission?.granted && microphonePermission?.granted;

    return {
        hasPermission,
        cameraPermission,
        microphonePermission,
        checkPermissions,
        cameraRef,
        isRecording,
        cameraType,
        startRecording,
        stopRecording,
        flipCamera,
    };
};
