import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSpring,
} from 'react-native-reanimated';

/**
 * Simple fade in animation on component mount
 */
export function useFadeInAnimation(delay: number = 0) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
}

/**
 * Slide up animation on component mount
 */
export function useSlideUpAnimation(delay: number = 0) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      translateY.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
      opacity.value = withTiming(1, {
        duration: 400,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));
}

/**
 * Scale animation on press
 */
export function useScaleOnPress() {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, {
      damping: 10,
      mass: 1,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 10,
      mass: 1,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, handlePressIn, handlePressOut };
}

/**
 * Gentle rotation animation (e.g., loading spinner)
 */
export function useRotateAnimation(duration: number = 1500) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      rotation.value = withTiming(360, {
        duration,
        easing: Easing.linear,
      });
      setTimeout(() => {
        rotation.value = 0;
        animate();
      }, duration);
    };

    animate();
  }, [duration]);

  return useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
}
