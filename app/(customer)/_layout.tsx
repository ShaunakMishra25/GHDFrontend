import { Stack } from 'expo-router'
import { View } from 'react-native'
import OfflineBanner from '../../components/ui/OfflineBanner'

export default function CustomerLayout() {
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="checkout/address"
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="checkout/payment"
          options={{ presentation: 'card', animation: 'slide_from_right' }}
        />
      </Stack>
    </View>
  )
}
