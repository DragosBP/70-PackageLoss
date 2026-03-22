import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean; // True for destructive actions (red color)
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: string; // Emoji or icon string
}

const COLOR_RED = '#E63946';
const COLOR_GREEN = '#34C759';
const COLOR_WHITE = '#FFFFFF';
const COLOR_DARK = '#1A1A1A';
const COLOR_DARKER = '#2A2A2A';
const COLOR_DIM = '#666666';
const COLOR_BORDER = '#3A3A3A';

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
  icon,
}) => {
  const confirmButtonColor = isDangerous ? COLOR_RED : COLOR_GREEN;

  React.useEffect(() => {
    if (visible) {
      console.log('ConfirmationModal is now visible:', title);
    }
  }, [visible, title]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      hardwareAccelerated={true}>
      <View style={styles.container}>
        {/* Background overlay */}
        <Pressable
          style={styles.overlay}
          onPress={onCancel}
        />

        {/* Modal content */}
        <View style={styles.modalContent}>
          {/* Icon */}
          {icon && (
            <Text style={styles.icon}>{icon}</Text>
          )}

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Cancel Button */}
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}>
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </Pressable>

            {/* Confirm Button */}
            <Pressable
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: confirmButtonColor },
              ]}
              onPress={onConfirm}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color={COLOR_WHITE} />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...Platform.select({
      web: {
        zIndex: 9999,
      },
    }),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...Platform.select({
      web: {
        zIndex: 9998,
      },
    }),
  },
  modalContent: {
    backgroundColor: COLOR_DARKER,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    alignItems: 'center',
    ...Platform.select({
      web: {
        zIndex: 10000,
      },
    }),
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLOR_WHITE,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLOR_DIM,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: COLOR_BORDER,
  },
  confirmButton: {
    backgroundColor: COLOR_GREEN,
  },
  cancelButtonText: {
    color: COLOR_DIM,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: COLOR_WHITE,
    fontSize: 14,
    fontWeight: '700',
  },
});
