import React, { useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, PanResponder, Animated } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubtitleSegment {
    id?: string;
    text: string;
    startTimeMs: number;
    endTimeMs: number;
}

export interface SubtitleStyle {
    fontSize?: number;
    // color is the legacy field; textColor is the new canonical field (matches web)
    color?: string;
    textColor?: string;
    backgroundColor?: string;
    backgroundOpacity?: number;
    position?: 'top' | 'middle' | 'bottom';
    fontFamily?: string;
    fontWeight?: string;
    positionX?: number;
    positionY?: number;
    // CapCut-style extras
    highlightColor?: string;
    highlightTextColor?: string;
    outlineColor?: string;
    outlineWidth?: number;
    shadowEnabled?: boolean;
    shadowBlur?: number;
    shadowColor?: string;
    uppercase?: boolean;
    wordHighlight?: boolean;
    animationStyle?: 'pop' | 'none';
    animationIn?: string;
    borderRadius?: number;
    padding?: number;
}

interface VideoPlayerProps {
    videoUri: string;
    startTime?: number;
    endTime?: number;
    subtitles?: SubtitleSegment[];
    subtitleStyle?: SubtitleStyle;
    onSubtitlePositionChange?: (x: number, y: number) => void;
}

// ─── Word timing helper ───────────────────────────────────────────────────────
interface WordTiming {
    word: string;
    startMs: number;
    endMs: number;
}

function splitWordsWithTiming(sub: SubtitleSegment): WordTiming[] {
    const words = (sub.text || '').split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    const dur = sub.endTimeMs - sub.startTimeMs;
    const wordDur = dur / words.length;
    return words.map((word, i) => ({
        word,
        startMs: sub.startTimeMs + i * wordDur,
        endMs: sub.startTimeMs + (i + 1) * wordDur,
    }));
}

// ─── Caption Overlay ──────────────────────────────────────────────────────────
interface CaptionOverlayProps {
    subtitle: SubtitleSegment;
    currentMs: number;
    style: SubtitleStyle;
}

function CaptionOverlay({ subtitle, currentMs, style }: CaptionOverlayProps) {
    const words = splitWordsWithTiming(subtitle);
    const activeIdx = words.findIndex(w => currentMs >= w.startMs && currentMs < w.endMs);

    const highlightColor = style.highlightColor || '#FFD93D';
    const highlightTextColor = style.highlightTextColor || '#000000';
    const textColor = style.textColor || style.color || '#FFFFFF';
    const fontSize = style.fontSize || 28;
    const fontFamily = style.fontFamily || 'Inter-Black';
    const fontWeight = (style.fontWeight || '800') as any;
    const uppercase = style.uppercase ?? true;
    const wordHighlight = style.wordHighlight ?? true;
    const outlineWidth = style.outlineWidth ?? 0;
    const outlineColor = style.outlineColor ?? '#000000';
    const shadowEnabled = style.shadowEnabled ?? true;
    const shadowBlur = style.shadowBlur ?? (shadowEnabled ? 6 : 0);
    const shadowColorVal = style.shadowColor ?? 'rgba(0,0,0,0.9)';
    const borderRadius = style.borderRadius ?? 8;
    const padding = style.padding ?? 8;

    const positionStyle: any = {
        position: 'absolute' as const,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 16,
        zIndex: 20,
        ...(style.position === 'top' ? { top: '10%' } : {}),
        ...(style.position === 'middle' ? { top: '45%' } : {}),
        ...(!style.position || style.position === 'bottom' ? { bottom: '15%' } : {}),
    };

    const baseTextStyle: any = {
        fontFamily,
        fontSize,
        fontWeight,
        color: textColor,
        textTransform: uppercase ? 'uppercase' : 'none',
        textShadowColor: shadowBlur > 0 ? shadowColorVal : 'transparent',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: shadowBlur,
        lineHeight: fontSize * 1.25,
    };

    if (!wordHighlight) {
        return (
        <View style={positionStyle}>
            <View style={{
                backgroundColor: style.backgroundColor || 'transparent',
                borderRadius,
                paddingHorizontal: padding * 1.5,
                paddingVertical: padding * 0.6,
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
            }}>
                    <Text style={baseTextStyle}>
                        {uppercase ? subtitle.text.toUpperCase() : subtitle.text}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={positionStyle}>
            <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                backgroundColor: style.backgroundColor || 'transparent',
                borderRadius,
                paddingHorizontal: padding,
                paddingVertical: padding * 0.5,
                gap: 4,
            }}>
                {words.map((w, i) => {
                    const isActive = i === activeIdx;
                    const displayWord = uppercase ? w.word.toUpperCase() : w.word;
                    return (
                        <View
                            key={i}
                            style={{
                                backgroundColor: isActive ? highlightColor : 'transparent',
                                borderRadius: 4,
                                paddingHorizontal: isActive ? 4 : 0,
                                transform: [{ scale: isActive ? 1.08 : 1 }],
                            }}
                        >
                            <Text
                                style={{
                                    ...baseTextStyle,
                                    color: isActive ? highlightTextColor : textColor,
                                    textShadowColor: isActive ? 'transparent' : (shadowBlur > 0 ? shadowColorVal : 'transparent'),
                                }}
                            >
                                {displayWord}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

// ─── Main VideoPlayer ─────────────────────────────────────────────────────────
export function VideoPlayer({
    videoUri,
    startTime = 0,
    endTime,
    subtitles = [],
    subtitleStyle = {},
    onSubtitlePositionChange,
}: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleSegment | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const pan = useRef(new Animated.ValueXY()).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: (pan.y as any)._value,
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
                    const absoluteX = containerSize.width / 2 + (pan.x as any)._value;
                    const absoluteY = containerSize.height / 2 + (pan.y as any)._value;
                    const normalizedX = Math.max(0.1, Math.min(0.9, absoluteX / containerSize.width));
                    const normalizedY = Math.max(0.05, Math.min(0.95, absoluteY / containerSize.height));
                    onSubtitlePositionChange(normalizedX, normalizedY);
                }
            },
        })
    ).current;

    const player = useVideoPlayer(videoUri, (p) => {
        p.loop = false;
    });

    useEffect(() => {
        if (!player) return;
        const interval = setInterval(() => {
            setIsPlaying(player.playing);
            setCurrentTime(player.currentTime);
            setDuration(player.duration);

            if (player.playing && endTime && player.currentTime >= endTime) {
                player.pause();
                player.currentTime = startTime;
            }

            if (subtitles.length > 0) {
                const ms = player.currentTime * 1000;
                const active = subtitles.find(s => ms >= s.startTimeMs && ms <= s.endTimeMs) ?? null;
                setCurrentSubtitle(active);
            } else {
                setCurrentSubtitle(null);
            }
        }, 80); // 80ms for smoother word tracking

        return () => clearInterval(interval);
    }, [player, startTime, endTime, subtitles]);

    const handlePlayPause = () => {
        if (!player) return;
        if (player.playing) {
            player.pause();
        } else {
            if (endTime && player.currentTime >= endTime - 0.1) {
                player.currentTime = startTime;
            }
            player.play();
        }
    };

    const formatTime = (seconds: number) => {
        const s = Math.floor(seconds);
        const m = Math.floor(s / 60);
        return `${m}:${(s % 60 < 10 ? '0' : '')}${s % 60}`;
    };

    const currentMs = currentTime * 1000;

    return (
        <View
            className="w-full h-full bg-black rounded-xl overflow-hidden"
            onLayout={(e) => setContainerSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        >
            <VideoView
                player={player}
                style={{ flex: 1 }}
                contentFit="contain"
                allowsFullscreen={false}
                allowsPictureInPicture={false}
                nativeControls={false}
            />

            {/* Play/Pause Overlay */}
            <TouchableOpacity
                activeOpacity={1}
                onPress={handlePlayPause}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 0 }}
            >
                {!isPlaying && (
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                        <FontAwesome name="play" size={24} color="white" style={{ marginLeft: 4 }} />
                    </View>
                )}
            </TouchableOpacity>

            {/* CapCut-style Subtitle Overlay */}
            {currentSubtitle && (
                <View
                    {...panResponder.panHandlers}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 }}
                >
                    <Animated.View
                        style={{
                            transform: [{ translateX: pan.x }, { translateY: pan.y }],
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        }}
                    >
                        <CaptionOverlay
                            subtitle={currentSubtitle}
                            currentMs={currentMs}
                            style={subtitleStyle}
                        />
                    </Animated.View>
                </View>
            )}

            {/* Progress Bar */}
            {duration > 0 && (
                <View style={{ position: 'absolute', bottom: 8, left: 8, right: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8, zIndex: 10 }}>
                    <Text style={{ color: 'white', fontSize: 11, marginRight: 8, fontFamily: 'Inter' }}>
                        {formatTime(currentTime)}
                    </Text>
                    <View style={{ flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
                        <View
                            style={{ height: '100%', backgroundColor: '#5E2BFF', width: `${(currentTime / (duration || 1)) * 100}%` }}
                        />
                    </View>
                    <Text style={{ color: 'white', fontSize: 11, marginLeft: 8, fontFamily: 'Inter' }}>
                        {formatTime(duration)}
                    </Text>
                </View>
            )}
        </View>
    );
}
