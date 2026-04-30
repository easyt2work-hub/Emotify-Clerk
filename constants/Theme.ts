export const Theme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20, // Outer padding
    xl: 24, // Section spacing
    xxl: 32,
    hero: 48,
  },
  borderRadius: {
    sm: 12,
    md: 16,
    lg: 24, // Standard card radius
    xl: 28, // Large card radius
    xxl: 32,
    full: 999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 26, 
    xxl: 30, 
    hero: 40,
  },
  fontFamily: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    bold: 'DMSans_700Bold',
  },
  shadows: {
    primary: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 30,
      elevation: 12,
    },
    secondary: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 8,
    },
    tertiary: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 4,
    },
    premium: {
      shadowColor: "#7C5CFF",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 40,
      elevation: 10,
    }
  }
};
