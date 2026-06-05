export const Colors = {
  primary: '#7C5CFF', // Soft purple
  primaryLight: '#A289FF',
  primaryDark: '#5E3BFF',
  
  secondary: '#00C2FF', // Aqua blue
  secondaryLight: '#5ED8FF',
  
  accent: '#FFB6C1', // Soft pink
  accentLight: '#FFD1D9',

  // Wellness Backgrounds
  background: '#F4F7FB', 
  backgroundGradient: ['#F4F7FB', '#EEF3FF'],
  backgroundDark: '#0B0F1A', 
  backgroundDarkGradient: ['#0B0F1A', '#12182B'],
  
  // Surface / Cards
  surface: '#FFFFFF',
  surfaceDark: 'rgba(255, 255, 255, 0.08)', // Glass effect for dark
  
  card: 'rgba(255, 255, 255, 0.9)', // Glass for light (increased opacity for readability)
  cardDark: 'rgba(255, 255, 255, 0.12)', // Glass for dark
  
  text: '#1E293B',
  textDark: '#FFFFFF',
  textSecondary: '#64748B',
  textSecondaryDark: '#A0A0C0',
  textMuted: '#94A3B8',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  mild: '#10B981',
  moderate: '#F59E0B',
  severe: '#EF4444',

  border: 'rgba(255, 255, 255, 0.2)',
  borderDark: 'rgba(255, 255, 255, 0.1)',
  
  white: '#FFFFFF',
  black: '#000000',
  glass: 'rgba(255, 255, 255, 0.1)',
};

export type ThemeColorsType = typeof Colors;

export const EmotionPalettes: Record<string, Partial<ThemeColorsType>> = {
  anger: {
    primary: '#EF4444',
    primaryLight: '#FCA5A5',
    primaryDark: '#991B1B',
    secondary: '#B91C1C',
    secondaryLight: '#FEE2E2',
    accent: '#F59E0B',
    accentLight: '#FEF3C7',
    background: '#FFF5F5',
    backgroundGradient: ['#FFF5F5', '#FEE2E2'],
  },
  excitement: {
    primary: '#F97316',
    primaryLight: '#FED7AA',
    primaryDark: '#C2410C',
    secondary: '#EA580C',
    secondaryLight: '#FFEDD5',
    accent: '#EAB308',
    accentLight: '#FEF08A',
    background: '#FFF7ED',
    backgroundGradient: ['#FFF7ED', '#FFEDD5'],
  },
  happy: {
    primary: '#EAB308',
    primaryLight: '#FEF08A',
    primaryDark: '#854D0E',
    secondary: '#CA8A04',
    secondaryLight: '#FEF9C3',
    accent: '#10B981',
    accentLight: '#A7F3D0',
    background: '#FEFCE8',
    backgroundGradient: ['#FEFCE8', '#FEF9C3'],
  },
  calm: {
    primary: '#22C55E',
    primaryLight: '#86EFAC',
    primaryDark: '#166534',
    secondary: '#16A34A',
    secondaryLight: '#DCFCE7',
    accent: '#06B6D4',
    accentLight: '#A5F3FC',
    background: '#F0FDF4',
    backgroundGradient: ['#F0FDF4', '#DCFCE7'],
  },
  sad: {
    primary: '#3B82F6',
    primaryLight: '#93C5FD',
    primaryDark: '#1E40AF',
    secondary: '#2563EB',
    secondaryLight: '#DBEAFE',
    accent: '#6366F1',
    accentLight: '#C7D2FE',
    background: '#EFF6FF',
    backgroundGradient: ['#EFF6FF', '#DBEAFE'],
  },
  creative: {
    primary: '#A855F7',
    primaryLight: '#D8B4FE',
    primaryDark: '#6B21A8',
    secondary: '#9333EA',
    secondaryLight: '#F3E8FF',
    accent: '#EC4899',
    accentLight: '#FBCFE8',
    background: '#FAF5FF',
    backgroundGradient: ['#FAF5FF', '#F3E8FF'],
  },
  love: {
    primary: '#EC4899',
    primaryLight: '#FBCFE8',
    primaryDark: '#9D174D',
    secondary: '#DB2777',
    secondaryLight: '#FCE7F3',
    accent: '#A855F7',
    accentLight: '#D8B4FE',
    background: '#FDF2F8',
    backgroundGradient: ['#FDF2F8', '#FCE7F3'],
  },
  fearful: {
    primary: '#1E293B',
    primaryLight: '#64748B',
    primaryDark: '#0F172A',
    secondary: '#334155',
    secondaryLight: '#E2E8F0',
    accent: '#020617',
    accentLight: '#F1F5F9',
    background: '#F8FAFC',
    backgroundGradient: ['#F8FAFC', '#E2E8F0'],
    backgroundDark: '#020408',
    backgroundDarkGradient: ['#020408', '#0A0F1D'],
  },
  peaceful: {
    primary: '#64748B',
    primaryLight: '#CBD5E1',
    primaryDark: '#334155',
    secondary: '#475569',
    secondaryLight: '#F1F5F9',
    accent: '#0F172A',
    accentLight: '#F8FAFC',
    background: '#FAFAFA',
    backgroundGradient: ['#FAFAFA', '#F4F4F5'],
  },
  disgusted: {
    primary: '#78350F',
    primaryLight: '#FCD34D',
    primaryDark: '#451A03',
    secondary: '#B45309',
    secondaryLight: '#FEF3C7',
    accent: '#D97706',
    accentLight: '#FEF3C7',
    background: '#FEF3C7',
    backgroundGradient: ['#FEF3C7', '#FDE68A'],
  },
};

export function getColorsForEmotion(emotionId: string | null | undefined): ThemeColorsType {
  if (!emotionId || !EmotionPalettes[emotionId]) {
    return Colors;
  }
  return {
    ...Colors,
    ...EmotionPalettes[emotionId],
  };
}
