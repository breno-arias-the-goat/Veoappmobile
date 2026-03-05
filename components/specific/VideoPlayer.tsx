import React, { useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import FontAwesome from '@expo/vector-icons/FontAwesome';

interface SubtitleSegment {
    id?: string;
    text: string;
    startTimeMs: number;
    endTimeMs: number;
}

interface VideoPlayerProps {
    videoUri: string;
    startTime?: number;
    endTime?: number;
    subtitles?: SubtitleSegment[];
    subtitleStyle?: {
        fontSize?: number;
        color?: string;
        backgroundColor?: string;
        position?: 'top' | 'middle' | 'bottom';
    };
}

export function VideoPlayer({ videoUri, startTime = 0, endTime, subtitles = [], subtitleStyle = {} }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);

    const player = useVideoPlayer(videoUri, player => {
        player.loop = false;
        // player.currentTime = startTime; // initial position
    });

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (player) {
            interval = setInterval(() => {
                setIsPlaying(player.playing);
                setCurrentTime(player.currentTime);
                setDuration(player.duration);

                // Enforce trim boundaries during playback
                if (player.playing && endTime && player.currentTime >= endTime) {
                    player.pause();
                    player.currentTime = startTime;
                }

                // Check for active subtitle
                if (subtitles.length > 0) {
                    const currentMs = player.currentTime * 1000;
                    const activeSub = subtitles.find(s => currentMs >= s.startTimeMs && currentMs <= s.endTimeMs);
                    setCurrentSubtitle(activeSub ? activeSub.text : null);
                } else {
                    setCurrentSubtitle(null);
                }

            }, 100); // 100ms polling for smooth updates
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [player, startTime, endTime]);

    const handlePlayPause = () => {
        if (!player) return;
        if (player.playing) {
            player.pause();
        } else {
            // Restart from startTime if it reached the end of the trim
            if (endTime && player.currentTime >= endTime - 0.1) {
                player.currentTime = startTime;
                player.play();
            } else {
                player.play();
            }
        }
    };

    const formatTime = (seconds: number) => {
        const roundedSeconds = Math.floor(seconds);
        const minutes = Math.floor(roundedSeconds / 60);
        const secs = roundedSeconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const getSubtitlePositionClass = () => {
        switch (subtitleStyle.position) {
            case 'top': return 'top-10';
            case 'middle': return 'top-1/2 -mt-10';
            case 'bottom': default: return 'bottom-20';
        }
    };

    return (
        <View className="w-full h-full bg-black rounded-xl overflow-hidden shadow-sm">
            <VideoView
                player={player}
                style={{ flex: 1 }}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
                nativeControls={false}
            />

            {/* Subtitles Overlay */}
            {currentSubtitle && (
                <View className={`absolute left-4 right-4 items-center justify-center pointer-events-none drop-shadow-2xl ${getSubtitlePositionClass()}`}>
                    <Text
                        className="text-center font-inter-black px-3 py-1 rounded-lg"
                        style={{
                            fontSize: subtitleStyle.fontSize || 24,
                            color: subtitleStyle.color || '#FFFFFF',
                            backgroundColor: subtitleStyle.backgroundColor || 'rgba(0,0,0,0.5)',
                            textShadowColor: 'rgba(0,0,0,0.8)',
                            textShadowOffset: { width: -1, height: 1 },
                            textShadowRadius: 3
                        }}
                    >
                        {currentSubtitle}
                    </Text>
                </View>
            )}

            {/* Play/Pause Overlay */}
            <TouchableOpacity
                activeOpacity={1}
                onPress={handlePlayPause}
                className="absolute inset-0 items-center justify-center bg-transparent"
            >
                {!isPlaying && (
                    <View className="w-16 h-16 rounded-full bg-black/50 items-center justify-center">
                        <FontAwesome name="play" size={24} color="white" style={{ marginLeft: 4 }} />
                    </View>
                )}
            </TouchableOpacity>

            {/* Progress Bar & Time */}
            {duration > 0 && (
                <View className="absolute bottom-md left-md right-md flex-row items-center bg-black/50 p-2 rounded-lg">
                    <Text className="text-white text-xs mr-2 font-inter">
                        {formatTime(currentTime)}
                    </Text>
                    <View className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
                        <View
                            className="h-full bg-primary"
                            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                        />
                    </View>
                    <Text className="text-white text-xs ml-2 font-inter">
                        {formatTime(duration)}
                    </Text>
                </View>
            )}
        </View>
    );
}
