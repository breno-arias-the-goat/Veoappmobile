import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, Dimensions } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';


import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');
const THUMB_WIDTH = (width - 48) / 8; // 8 thumbnails fit in the screen padding

interface VideoTrimmerProps {
    videoUri: string;
    totalDuration: number; // in seconds
    onRangeChange: (start: number, end: number) => void;
}

export function VideoTrimmer({ videoUri, totalDuration, onRangeChange }: VideoTrimmerProps) {
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(totalDuration || 10); // fallback 10s

    useEffect(() => {
        if (totalDuration > 0) {
            setEndTime(totalDuration);
            generateThumbnails();
        }
    }, [totalDuration, videoUri]);

    const generateThumbnails = async () => {
        try {
            const numThumbnails = 8;
            const newThumbnails = [];

            // To prevent blocking, we generate thumbnails spaced out
            for (let i = 0; i < numThumbnails; i++) {
                const timeStr = (i * (totalDuration / numThumbnails)) * 1000;
                const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
                    time: timeStr,
                    quality: 0.5,
                });
                newThumbnails.push(uri);
            }
            setThumbnails(newThumbnails);
        } catch (e) {
            console.warn("Could not generate thumbnails", e);
        }
    };

    // Since building a custom range slider gesture handler takes significant boilerplate,
    // we fallback to basic sliders for Start and End time bounds
    const handleStartChange = (val: number) => {
        let newStart = Math.min(val, endTime - 1);
        setStartTime(newStart);
        onRangeChange(newStart, endTime);
    };

    const handleEndChange = (val: number) => {
        let newEnd = Math.max(val, startTime + 1);
        setEndTime(newEnd);
        onRangeChange(startTime, newEnd);
    };

    return (
        <View className="w-full bg-background-light dark:bg-background-dark">
            <Text className="text-lg font-inter-bold mb-md text-text-dark dark:text-text-light">
                Recortar Vídeo
            </Text>

            {/* Thumbnails Timeline */}
            <View className="flex-row rounded-lg overflow-hidden h-12 bg-gray-200 dark:bg-gray-800 mb-xl w-full">
                {thumbnails.length > 0 ? (
                    thumbnails.map((uri, i) => (
                        <Image
                            key={i}
                            source={{ uri }}
                            style={{ width: THUMB_WIDTH, height: 48 }}
                            resizeMode="cover"
                        />
                    ))
                ) : (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-xs text-gray-500 font-inter">Carregando timeline...</Text>
                    </View>
                )}

                {/* Visual overlay for omitted parts */}
                <View
                    className="absolute top-0 bottom-0 left-0 bg-black/50"
                    style={{ width: `${(startTime / (totalDuration || 1)) * 100}%` }}
                />
                <View
                    className="absolute top-0 bottom-0 right-0 bg-black/50"
                    style={{ width: `${(1 - (endTime / (totalDuration || 1))) * 100}%` }}
                />
            </View>

            {/* Sliders for tweaking Start & End precisely */}
            <View className="flex-row items-center mb-md justify-between">
                <Text className="text-sm font-inter text-text-dark dark:text-text-light w-16">Início</Text>
                <Slider
                    style={{ flex: 1, height: 40 }}
                    minimumValue={0}
                    maximumValue={totalDuration}
                    value={startTime}
                    onValueChange={handleStartChange}
                    minimumTrackTintColor="#3975F9"
                    maximumTrackTintColor="#A0aec0"
                />
                <Text className="text-sm font-inter text-text-dark dark:text-text-light w-12 text-right">
                    {Math.round(startTime)}s
                </Text>
            </View>

            <View className="flex-row items-center justify-between">
                <Text className="text-sm font-inter text-text-dark dark:text-text-light w-16">Fim</Text>
                <Slider
                    style={{ flex: 1, height: 40 }}
                    minimumValue={0}
                    maximumValue={totalDuration}
                    value={endTime}
                    onValueChange={handleEndChange}
                    minimumTrackTintColor="#3975F9"
                    maximumTrackTintColor="#A0aec0"
                />
                <Text className="text-sm font-inter text-text-dark dark:text-text-light w-12 text-right">
                    {Math.round(endTime)}s
                </Text>
            </View>

        </View>
    );
}
