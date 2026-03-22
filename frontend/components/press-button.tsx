import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useScaleOnPress } from '../hooks/useAnimation';
import { ThemedText } from './themed-text';

interface PressButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  color?: string;
}

/**
 * Button with subtle scale animation on press
 */
export function PressButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  color = '#007AFF',
}: PressButtonProps) {
  const { animatedStyle, handlePressIn, handlePressOut } = useScaleOnPress();

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: color },
          (disabled || loading) && styles.disabled,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <ThemedText style={styles.buttonText}>{title}</ThemedText>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
});
