import { DarkTheme, DefaultTheme, Link, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { Colors } from '@/ui/theme';

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  const colors = dark ? Colors.dark : Colors.light;

  return (
    <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Garage',
            headerRight: () => (
              <Link href="/settings" style={{ color: colors.primary, fontWeight: '600' }}>
                Settings
              </Link>
            ),
          }}
        />
        <Stack.Screen name="add" options={{ title: 'Add vehicle' }} />
        <Stack.Screen name="vehicle/[id]" options={{ title: 'Vehicle' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
      <StatusBar style={dark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
