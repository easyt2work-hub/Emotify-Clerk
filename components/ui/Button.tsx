import React from 'react';
import { StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Pressable, Animated, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/context/MoodThemeContext';
import { Theme } from '@/constants/Theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const scale = React.useRef(new Animated.Value(1)).current;
  const colors = useThemeColors();

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const dynamicBgStyles = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.secondary },
    outline: { backgroundColor: 'transparent', borderColor: colors.primary, borderWidth: 1.5 },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.error },
  };

  const dynamicTextStyles = {
    primary: { color: colors.white },
    secondary: { color: colors.white },
    outline: { color: colors.primary },
    ghost: { color: colors.primary },
    danger: { color: colors.white },
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        testID={testID}
        style={[
          styles.base,
          dynamicBgStyles[variant],
          styles[`size_${size}`],
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white} />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, dynamicTextStyles[variant], styles[`textSize_${size}`], textStyle]}>
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.borderRadius.xl,
    gap: Theme.spacing.sm,
  },
  size_sm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  size_md: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  size_lg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: Theme.fontFamily.bold,
    textAlign: 'center',
  },
  textSize_sm: { fontSize: Theme.fontSize.sm },
  textSize_md: { fontSize: Theme.fontSize.md },
  textSize_lg: { fontSize: Theme.fontSize.lg },
});
