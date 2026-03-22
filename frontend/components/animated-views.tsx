import React from 'react';
import Animated from 'react-native-reanimated';
import {
  useFadeInAnimation,
  useSlideUpAnimation,
} from '../hooks/useAnimation';

interface AnimatedViewProps {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}

/**
 * View with fade in animation on mount
 */
export function FadeInView({ children, delay = 0, style }: AnimatedViewProps) {
  const animatedStyle = useFadeInAnimation(delay);

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

/**
 * View with slide up + fade animation on mount
 */
export function SlideUpView({ children, delay = 0, style }: AnimatedViewProps) {
  const animatedStyle = useSlideUpAnimation(delay);

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
