import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '@/context/MoodThemeContext';
import { Theme } from '@/constants/Theme';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, title, style, variant = 'default' }: CardProps) {
  const colors = useThemeColors();

  const dynamicStyles = {
    default: {
      backgroundColor: colors.surface,
    },
    elevated: {
      backgroundColor: colors.surface,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
  };

  return (
    <View style={[styles.base, dynamicStyles[variant], style]}>
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
  },
  title: {
    fontFamily: Theme.fontFamily.bold,
    fontSize: Theme.fontSize.lg,
    marginBottom: Theme.spacing.md,
  },
});
