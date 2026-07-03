import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderService } from '../../../services/order.service'
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary'
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader'
import { useNetworkStatus } from '../../../hooks/useNetworkStatus'
import { Address } from '../../../types/api'

export default function CheckoutAddressScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isConnected = useNetworkStatus()

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [label, setLabel] = useState('')
  const [fullAddress, setFullAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: orderService.listAddresses,
    staleTime: 5 * 60 * 1000,
  })

  const createAddressMutation = useMutation({
    mutationFn: (addr: { label: string; full_address: string; landmark: string }) =>
      orderService.createAddress(addr),
    onSuccess: (newAddr) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setSelectedAddressId(newAddr.id)
      setShowAddForm(false)
      resetForm()
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error?.user_msg || 'Failed to save address')
    },
  })

  const resetForm = () => {
    setLabel('')
    setFullAddress('')
    setLandmark('')
    setFormError(null)
  }

  const handleContinue = () => {
    if (!selectedAddressId) return
    router.push({ pathname: '/(customer)/checkout/payment', params: { addressId: selectedAddressId } })
  }

  const handleAddAddress = () => {
    if (!label.trim() || !fullAddress.trim()) {
      setFormError('Please fill in all required fields')
      return
    }
    createAddressMutation.mutate({
      label: label.trim(),
      full_address: fullAddress.trim(),
      landmark: landmark.trim(),
    })
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Address</Text>
          <View style={{ width: 60 }} />
        </View>
        <SkeletonLoader count={3} />
      </View>
    )
  }

  const userAddresses = addresses || []

  return (
    <ErrorBoundary>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Address</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {userAddresses.map((addr: Address) => (
            <TouchableOpacity
              key={addr.id}
              style={[styles.addressCard, selectedAddressId === addr.id && styles.addressCardSelected]}
              onPress={() => setSelectedAddressId(addr.id)}
            >
              <View style={styles.radioRow}>
                <View style={[styles.radio, selectedAddressId === addr.id && styles.radioSelected]}>
                  {selectedAddressId === addr.id && <View style={styles.radioInner} />}
                </View>
                <View style={styles.addressDetails}>
                  <Text style={styles.addressLabel}>{addr.label}</Text>
                  <Text style={styles.addressText}>{addr.full_address}</Text>
                  {addr.landmark ? (
                    <Text style={styles.addressLandmark}>{addr.landmark}</Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {showAddForm ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Add New Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Label (e.g. Home, Work)"
                placeholderTextColor="#999"
                value={label}
                onChangeText={setLabel}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Full address"
                placeholderTextColor="#999"
                value={fullAddress}
                onChangeText={setFullAddress}
                multiline
                numberOfLines={3}
              />
              <TextInput
                style={styles.input}
                placeholder="Landmark (optional)"
                placeholderTextColor="#999"
                value={landmark}
                onChangeText={setLandmark}
              />
              {formError && <Text style={styles.errorText}>{formError}</Text>}
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, createAddressMutation.isPending && styles.saveButtonDisabled]}
                  onPress={handleAddAddress}
                  disabled={createAddressMutation.isPending}
                >
                  {createAddressMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.addCard} onPress={() => setShowAddForm(true)}>
              <Text style={styles.addCardText}>+ Add New Address</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.deliveryNote}>Delivery within 5km radius of Gumla city</Text>
          <TouchableOpacity
            style={[styles.continueButton, !selectedAddressId && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!selectedAddressId}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backText: { fontSize: 16, color: '#FF6B35', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EEE',
  },
  addressCardSelected: { borderColor: '#FF6B35' },
  radioRow: { flexDirection: 'row', alignItems: 'flex-start' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioSelected: { borderColor: '#FF6B35' },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
  },
  addressDetails: { flex: 1 },
  addressLabel: { fontSize: 15, fontWeight: '600', color: '#333' },
  addressText: { fontSize: 13, color: '#666', marginTop: 4 },
  addressLandmark: { fontSize: 12, color: '#999', marginTop: 2, fontStyle: 'italic' },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 16 },
  input: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { color: '#E53935', fontSize: 13, marginBottom: 8 },
  formButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: { fontSize: 14, color: '#666', fontWeight: '500' },
  saveButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  addCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addCardText: { fontSize: 15, color: '#FF6B35', fontWeight: '600' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  deliveryNote: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 8 },
  continueButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonDisabled: { opacity: 0.5 },
  continueButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
})
