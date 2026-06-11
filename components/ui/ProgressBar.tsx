import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/context/MoodThemeContext';
import { Theme } from '@/constants/Theme';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showFraction?: boolean;
}

export function ProgressBar({ current, total, label, showFraction = true }: ProgressBarProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {(label || showFraction) && (
        <View style={styles.labelRow}>
          {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
          {showFraction && (
            <Text style={[styles.fraction, { color: colors.textMuted }]}>
              {current} / {total}
            </Text>
          )}
        </View>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(progress, 100)}%`, backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  label: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
  },
  fraction: {
    fontFamily: Theme.fontFamily.medium,
    fontSize: Theme.fontSize.sm,
  },
  track: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: Theme.borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Theme.borderRadius.full,
  },
});
