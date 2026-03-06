import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing } from 'react-native';


interface TeleprompterProps {
    scriptText: string;
    speed: number;
    fontSize: number;
    isScrolling: boolean;
}

export function Teleprompter({ scriptText, speed, fontSize, isScrolling }: TeleprompterProps) {
    const scrollY = useRef(new Animated.Value(0)).current;
    const [contentHeight, setContentHeight] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    useEffect(() => {
        if (isScrolling && contentHeight > 0 && containerHeight > 0) {
            // Calculate how far to scroll (the entire height of the text plus some padding)
            const distance = Math.max(0, contentHeight);

            // Calculate duration based on speed
            // If speed is 10 to 100, let's treat speed as pixels per second
            // Duration in ms = (distance / speed) * 1000
            // To make the slider feel right, let's add a multiplier or adjust the range
            const pixelsPerSecond = speed;
            const duration = (distance / pixelsPerSecond) * 1000;

            Animated.timing(scrollY, {
                toValue: -distance,
                duration: duration,
                useNativeDriver: true,
                easing: Easing.linear,
            }).start();
        } else {
            // Pause scrolling
            scrollY.stopAnimation();
        }
    }, [isScrolling, speed, contentHeight, containerHeight]);

    // Reset animation when script changes or when scrolling is stopped (between takes)
    useEffect(() => {
        if (!isScrolling) {
            scrollY.setValue(0);
        }
    }, [scriptText, isScrolling]);

    const renderText = () => {
        if (!scriptText) return null;

        // Break script down by newlines
        const paragraphs = scriptText.split('\n');
        return paragraphs.map((paragraph, pIndex) => {
            // Break large paragraphs into smaller chunks of 40 words to avoid Android Texture Limits
            const words = paragraph.split(/\s+/);
            const chunks = [];
            let currentChunk: string[] = [];
            for (const word of words) {
                currentChunk.push(word);
                if (currentChunk.length >= 40) {
                    chunks.push(currentChunk.join(' '));
                    currentChunk = [];
                }
            }
            if (currentChunk.length > 0) chunks.push(currentChunk.join(' '));

            return chunks.map((chunk, cIndex) => (
                <Text
                    key={`${pIndex}-${cIndex}`}
                    style={{
                        fontSize: fontSize,
                        color: 'white',
                        fontWeight: 'bold',
                        textShadowColor: 'rgba(0, 0, 0, 0.75)',
                        textShadowOffset: { width: 0, height: 2 },
                        textShadowRadius: 6,
                        lineHeight: fontSize * 1.5,
                        textAlign: 'center',
                        minHeight: chunk.trim() === '' ? fontSize * 1.5 : 0,
                        marginBottom: cIndex === chunks.length - 1 ? fontSize * 0.5 : 0
                    }}
                >
                    {chunk}
                </Text>
            ));
        });
    };

    return (
        <View
            className="flex-1 overflow-hidden w-full"
            onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
        >
            <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: [{ translateY: scrollY }] }}>
                <View
                    onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
                    style={{
                        width: '100%',
                        paddingHorizontal: 16,
                        paddingTop: containerHeight > 0 ? containerHeight * 0.4 : 200, // Start scrolling from below the center
                        paddingBottom: containerHeight > 0 ? containerHeight : 200,
                    }}
                >
                    {renderText()}
                </View>
            </Animated.View>
        </View>
    );
}
