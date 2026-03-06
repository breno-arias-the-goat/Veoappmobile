import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Slider from '@react-native-community/slider';

interface RecordControlsProps {
    isRecording: boolean;
    onRecordPress: () => void;
    onStopPress: () => void;
    onFlipCamera: () => void;
    speed: number;
    setSpeed: (val: number) => void;
    fontSize: number;
    setFontSize: (val: number) => void;
    countdown: number | null;
}

export function RecordControls({
    isRecording, onRecordPress, onStopPress, onFlipCamera,
    speed, setSpeed, fontSize, setFontSize, countdown
}: RecordControlsProps) {
    return (
        <View className="bg-black/80 px-lg py-xl rounded-t-3xl w-full">
            {/* Sliders */}
            <View className="flex-row items-center justify-between mb-md">
                <Text className="text-white font-inter text-xs w-16">Aa</Text>
                <Slider
                    style={{ flex: 1, height: 40 }}
                    minimumValue={16}
                    maximumValue={72}
                    value={fontSize}
                    onValueChange={setFontSize}
                    minimumTrackTintColor="#3975F9"
                    maximumTrackTintColor="#FFFFFF"
                />
            </View>
            <View className="flex-row items-center justify-between mb-xl">
                <Text className="text-white font-inter text-xs w-16">Veloc.</Text>
                <Slider
                    style={{ flex: 1, height: 40 }}
                    minimumValue={20}
                    maximumValue={150}
                    value={speed}
                    onValueChange={setSpeed}
                    minimumTrackTintColor="#3975F9"
                    maximumTrackTintColor="#FFFFFF"
                />
            </View>

            {/* Buttons */}
            <View className="flex-row items-center justify-evenly">
                <TouchableOpacity onPress={onFlipCamera} className="p-md rounded-full bg-gray-800" disabled={isRecording || countdown !== null}>
                    <FontAwesome name="refresh" size={24} color={isRecording || countdown !== null ? 'gray' : 'white'} />
                </TouchableOpacity>

                {isRecording ? (
                    <TouchableOpacity onPress={onStopPress} className="w-20 h-20 rounded-full bg-white items-center justify-center">
                        <View className="w-8 h-8 rounded-sm bg-error" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={onRecordPress} className="w-20 h-20 rounded-full border-4 border-white items-center justify-center">
                        {countdown !== null ? (
                            <Text className="text-error font-inter-bold text-2xl">{countdown}</Text>
                        ) : (
                            <View className="w-16 h-16 rounded-full bg-error" />
                        )}
                    </TouchableOpacity>
                )}

                <View className="w-12" />
            </View>
        </View>
    );
}
