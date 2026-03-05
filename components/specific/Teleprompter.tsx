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

    // Reset animation when script changes
    useEffect(() => {
        scrollY.setValue(0);
    }, [scriptText]);

    return (
        <View
            className="flex-1 overflow-hidden"
            onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
        >
            <Animated.View style={{ transform: [{ translateY: scrollY }] }}>
                <View
                    onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
                    style={{
                        padding: 24,
                        paddingTop: containerHeight > 0 ? containerHeight * 0.4 : 200, // Start scrolling from below the center
                        paddingBottom: containerHeight > 0 ? containerHeight : 200,
                    }}
                >
                    {scriptText.split('\n').map((paragraph, index) => (
                        <Text
                            key={index}
                            style={{
                                fontSize: fontSize,
                                color: 'white',
                                fontWeight: 'bold',
                                textShadowColor: 'rgba(0, 0, 0, 0.75)',
                                textShadowOffset: { width: 0, height: 2 },
                                textShadowRadius: 6,
                                lineHeight: fontSize * 1.5,
                                textAlign: 'center',
                                minHeight: paragraph.trim() === '' ? fontSize * 1.5 : 0
                            }}
                        >
                            {paragraph}
                        </Text>
                    ))}
                </View>
            </Animated.View>
        </View>
    );
}
