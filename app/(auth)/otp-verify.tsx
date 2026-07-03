import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '../../store/auth.store'
import { validateOtp } from '../../utils/validation'

export default function OtpVerifyScreen() {
  const router = useRouter()
  const { phone } = useLocalSearchParams<{ phone: string }>()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (__DEV__) {
      setOtp('000000')
    }
  }, [])

  useEffect(() => {
    if (__DEV__ && otp === '000000') {
      handleVerify()
    }
  }, [otp])

  const handleVerify = async () => {
    const validationError = validateOtp(otp)
    if (validationError) {
      setError(validationError)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await useAuthStore.getState().login(phone, 'Customer')
    } catch (err: any) {
      setError(err?.response?.data?.error?.user_msg || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = () => {
    setOtp('')
    setError(null)
    if (__DEV__) {
      setOtp('000000')
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phoneText}>+91 {phone}</Text>
          </Text>
        </View>

        <View style={styles.otpSection}>
          <TextInput
            ref={inputRef}
            style={styles.otpInput}
            value={otp}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, '').slice(0, 6)
              setOtp(digits)
              setError(null)
              if (digits.length === 6 && !__DEV__) {
                handleVerify()
              }
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
          <View style={styles.otpBoxes}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.otpBox, otp[i] ? styles.otpBoxFilled : null]}>
                <Text style={styles.otpDigit}>{otp[i] || ''}</Text>
              </View>
            ))}
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <Text style={styles.verifyText}>
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton} onPress={handleResend}>
          <Text style={styles.resendText}>Resend OTP</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  backButton: { marginBottom: 32 },
  backText: { fontSize: 16, color: '#FF6B35', fontWeight: '600' },
  header: { marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#333333' },
  subtitle: { fontSize: 15, color: '#666', marginTop: 8, lineHeight: 22 },
  phoneText: { fontWeight: '600', color: '#333' },
  otpSection: { alignItems: 'center', marginBottom: 32 },
  otpInput: {
    position: 'absolute',
    width: '100%',
    height: 60,
    opacity: 0,
    zIndex: 1,
  },
  otpBoxes: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDD',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: { borderColor: '#FF6B35' },
  otpDigit: { fontSize: 24, fontWeight: '700', color: '#333' },
  errorText: { color: '#E53935', fontSize: 13, marginTop: 12 },
  verifyButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyButtonDisabled: { opacity: 0.6 },
  verifyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  resendButton: { alignItems: 'center', marginTop: 20 },
  resendText: { fontSize: 14, color: '#FF6B35', fontWeight: '500' },
})
