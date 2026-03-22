import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRotateAnimation } from '../hooks/useAnimation';
import { ThemedText } from './themed-text';

interface LoadingIndicatorProps {
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Simple rotating loading indicator
 */
export function LoadingIndicator({
  label = 'Se încarcă...',
  size = 'medium',
}: LoadingIndicatorProps) {
  const animatedStyle = useRotateAnimation(1500);

  const sizeConfig = {
    small: { size: 30, fontSize: 12 },
    medium: { size: 50, fontSize: 14 },
    large: { size: 70, fontSize: 16 },
  };

  const config = sizeConfig[size];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          animatedStyle,
          {
            width: config.size,
            height: config.size,
          },
        ]}
      >
        <View style={[styles.spinner, { borderWidth: config.size / 10 }]} />
      </Animated.View>
      {label && (
        <ThemedText style={[styles.label, { fontSize: config.fontSize }]}>
          {label}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  spinner: {
    borderColor: 'transparent',
    borderTopColor: '#007AFF',
    borderRightColor: '#007AFF',
    borderRadius: 999,
  },
  label: {
    marginTop: 16,
    color: '#666',
    fontWeight: '500',
  },
});
