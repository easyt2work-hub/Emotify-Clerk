import React from 'react';
import { StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Pressable, Animated, Text, StyleProp } from 'react-native';
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
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

function splitStyles(style: any) {
  if (!style) return { layoutStyles: {}, buttonStyles: {} };
  const flattened = StyleSheet.flatten(style);
  if (!flattened) return { layoutStyles: {}, buttonStyles: {} };
  
  const layoutKeys = [
    'flex', 'flexDirection', 'justifyContent', 'alignItems', 'alignSelf',
    'alignContent', 'flexWrap', 'flexGrow', 'flexShrink', 'flexBasis',
    'margin', 'marginBottom', 'marginTop', 'marginLeft', 'marginRight',
    'marginHorizontal', 'marginVertical', 'position', 'top', 'bottom',
    'left', 'right', 'zIndex', 'width', 'height', 'minWidth', 'minHeight',
    'maxWidth', 'maxHeight', 'aspectRatio'
  ];
  const layoutStyles: any = {};
  const buttonStyles: any = {};
  
  Object.keys(flattened).forEach((key) => {
    if (layoutKeys.includes(key)) {
      layoutStyles[key] = flattened[key];
    } else {
      buttonStyles[key] = flattened[key];
    }
  });
  return { layoutStyles, buttonStyles };
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

  const { layoutStyles, buttonStyles } = splitStyles(style);
  const isWidthOrFlexSet = layoutStyles.flex !== undefined || layoutStyles.width !== undefined || layoutStyles.alignSelf === 'stretch';

  return (
    <Animated.View style={[{ transform: [{ scale }] }, layoutStyles]}>
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
          buttonStyles,
          isWidthOrFlexSet && { width: '100%' },
          layoutStyles.height !== undefined && { height: '100%' },
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
