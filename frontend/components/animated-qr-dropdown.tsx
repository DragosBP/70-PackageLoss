import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedQRDropdownProps {
  isOpen: boolean;
  children: React.ReactNode;
}

/**
 * Animated dropdown for QR code display with smooth expand/collapse
 */
export function AnimatedQRDropdown({ isOpen, children }: AnimatedQRDropdownProps) {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      height.value = withTiming(280, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
      opacity.value = withTiming(1, {
        duration: 300,
      });
    } else {
      height.value = withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.ease),
      });
      opacity.value = withTiming(0, {
        duration: 200,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: 'hidden',
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
