
export const colors = {
  primary: '#007AFF',
  accent: '#FF9500',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#000000',
  card: 'rgba(255, 255, 255, 0.1)',
  cardSecondary: 'rgba(255, 255, 255, 0.05)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 255, 255, 0.2)',
  highlight: '#007AFF',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
};
