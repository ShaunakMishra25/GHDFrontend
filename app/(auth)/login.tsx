import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../store/auth.store'
import { validatePhone } from '../../utils/validation'

export default function LoginScreen() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSendOtp = () => {
    const validationError = validatePhone(phone)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    router.push({ pathname: '/(auth)/otp-verify', params: { phone } })
  }

  const handleDevLogin = async () => {
    const validationError = validatePhone(phone)
    if (validationError) {
      setError(validationError)
      return
    }
    try {
      await useAuthStore.getState().login(phone, 'Customer')
    } catch (err: any) {
      setError(err?.response?.data?.error?.user_msg || 'Login failed')
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🛒</Text>
          </View>
          <Text style={styles.title}>Gumla Home Delivery Service</Text>
          <Text style={styles.tagline}>Aapki Zaroorat, Hamari Zimmedari</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneInputRow}>
            <View style={styles.prefixBox}>
              <Text style={styles.prefixText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/[^0-9]/g, ''))
                setError(null)
              }}
            />
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity style={styles.sendOtpButton} onPress={handleSendOtp} activeOpacity={0.8}>
            <Text style={styles.sendOtpText}>Send OTP</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <TouchableOpacity style={styles.devLoginButton} onPress={handleDevLogin} activeOpacity={0.8}>
              <Text style={styles.devLoginText}>Dev Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoArea: { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#333333', textAlign: 'center' },
  tagline: { fontSize: 14, color: '#666', marginTop: 8, fontStyle: 'italic' },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  phoneInputRow: { flexDirection: 'row', alignItems: 'center' },
  prefixBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginRight: 8,
  },
  prefixText: { fontSize: 16, color: '#333' },
  phoneInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  errorText: { color: '#E53935', fontSize: 13, marginTop: 8 },
  sendOtpButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  sendOtpText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  devLoginButton: {
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  devLoginText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
})
