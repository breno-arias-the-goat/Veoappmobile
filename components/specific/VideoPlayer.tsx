import React, { useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, PanResponder, Animated } from 'react-native';
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
        fontFamily?: string;
        positionX?: number;
        positionY?: number;
    };
    onSubtitlePositionChange?: (x: number, y: number) => void;
}

export function VideoPlayer({ videoUri, startTime = 0, endTime, subtitles = [], subtitleStyle = {}, onSubtitlePositionChange }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentSubtitle, setCurrentSubtitle] = useState<string | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const pan = useRef(new Animated.ValueXY()).current;

    // Initial centering if dragged
    useEffect(() => {
        if (subtitleStyle.positionX !== undefined && subtitleStyle.positionY !== undefined && containerSize.width > 0) {
            // positionX/Y are normalized 0-1 centers.
            // Pan is offset from the natural rendering center (middle of the view).
            // We'll manage pan visually
        }
    }, [subtitleStyle.positionX, subtitleStyle.positionY, containerSize]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: (pan.y as any)._value
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                pan.flattenOffset();
                if (onSubtitlePositionChange && containerSize.width > 0 && containerSize.height > 0) {
                    // Calc normalized X, Y using the final translation.
                    // Subtitles start conceptually at CenterX, CenterY due to flex layout
                    const absoluteX = (containerSize.width / 2) + (pan.x as any)._value;
                    const absoluteY = (containerSize.height / 2) + (pan.y as any)._value; // Assuming middle position. Wait, we render in 'absolute inset-0 items-center justify-center'

                    let normalizedX = absoluteX / containerSize.width;
                    let normalizedY = absoluteY / containerSize.height;

                    // Clamping
                    normalizedX = Math.max(0.1, Math.min(0.9, normalizedX));
                    normalizedY = Math.max(0.05, Math.min(0.95, normalizedY));

                    onSubtitlePositionChange(normalizedX, normalizedY);
                }
            }
        })
    ).current;

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
        <View
            className="w-full h-full bg-black rounded-xl overflow-hidden shadow-sm"
            onLayout={(e) => setContainerSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        >
            <VideoView
                player={player}
                style={{ flex: 1 }}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
                nativeControls={false}
            />

            {/* Play/Pause Overlay - must be BEHIND subtitles so subtitles intercept drag */}
            <TouchableOpacity
                activeOpacity={1}
                onPress={handlePlayPause}
                className="absolute inset-0 items-center justify-center bg-transparent z-0"
            >
                {!isPlaying && (
                    <View className="w-16 h-16 rounded-full bg-black/50 items-center justify-center">
                        <FontAwesome name="play" size={24} color="white" style={{ marginLeft: 4 }} />
                    </View>
                )}
            </TouchableOpacity>

            {/* Subtitles Overlay (Draggable) */}
            {currentSubtitle && (
                <View
                    {...panResponder.panHandlers}
                    className="absolute inset-0 z-20"
                    style={{ elevation: 10 }}
                >
                    <Animated.View
                        style={{
                            transform: [{ translateX: pan.x }, { translateY: pan.y }],
                            // Start precisely in the middle so drag offset works logically
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            marginLeft: '-50%',
                            marginTop: -20, // Approximate centering
                            width: '100%',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Text
                            className={`text-center px-4 py-2 rounded-xl ${subtitleStyle.fontFamily === 'Inter-Bold' ? 'font-inter-bold' : subtitleStyle.fontFamily === 'Inter-Black' ? 'font-inter-black' : 'font-inter'}`}
                            style={{
                                fontSize: subtitleStyle.fontSize || 24,
                                color: subtitleStyle.color || '#FFFFFF',
                                backgroundColor: subtitleStyle.backgroundColor || 'transparent',
                                textShadowColor: subtitleStyle.color === '#000000' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                                textShadowOffset: { width: 1, height: 1 },
                                textShadowRadius: 4,
                                textTransform: 'uppercase',
                                lineHeight: (subtitleStyle.fontSize || 24) * 1.3
                            }}
                        >
                            {currentSubtitle}
                        </Text>
                    </Animated.View>
                </View>
            )}



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
