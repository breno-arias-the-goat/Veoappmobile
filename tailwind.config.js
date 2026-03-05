/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#5E2BFF', // Electric Indigo
        primaryLight: '#8E2DE2',
        secondary: '#FF3366', // Neon Coral
        background: {
          DEFAULT: '#000000', // Deep Space Black (Apple style)
          dark: '#000000',
          light: '#000000',
        },
        surface: '#13131A', // Slightly tinted deep grey
        surfaceHover: '#1C1C26',
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A1AA', // Sleeker zinc gray
          dark: '#FFFFFF',
          light: '#FFFFFF',
        },
        border: 'rgba(255,255,255,0.08)', // Glass border
        borderSolid: '#272733',
        success: '#10B981',
        error: '#EF4444',
      },
      fontFamily: {
        inter: ['Inter_400Regular', 'sans-serif'],
        'inter-medium': ['Inter_500Medium', 'sans-serif'],
        'inter-semibold': ['Inter_600SemiBold', 'sans-serif'],
        'inter-bold': ['Inter_700Bold', 'sans-serif'],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      borderRadius: {
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px', // Squircle effect for cards
        full: '9999px',
      },
    },
  },
  plugins: [],
};
