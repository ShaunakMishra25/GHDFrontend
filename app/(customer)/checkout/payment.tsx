import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { useCartStore } from '../../../store/cart.store'
import { orderService } from '../../../services/order.service'
import { useNetworkStatus } from '../../../hooks/useNetworkStatus'
import { formatCurrency } from '../../../utils/formatCurrency'
import ErrorBoundary from '../../../components/ui/ErrorBoundary'

export default function CheckoutPaymentScreen() {
  const router = useRouter()
  const { addressId } = useLocalSearchParams<{ addressId: string }>()
  const isConnected = useNetworkStatus()
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.getSubtotal())
  const itemCount = useCartStore((s) => s.getItemCount())
  const clearCart = useCartStore((s) => s.clearCart)

  const deliveryCharge = subtotal <= 1000 ? 50 : itemCount * 10
  const total = subtotal + deliveryCharge

  const [isProcessing, setIsProcessing] = useState(false)

  const createOrderMutation = useMutation({
    mutationFn: () => orderService.createOrder(Number(addressId)),
    onSuccess: async (order) => {
      if (__DEV__) {
        clearCart()
        Alert.alert('Payment Successful', `Order #${order.id} has been placed successfully!`, [
          {
            text: 'View Orders',
            onPress: () => router.replace('/(customer)/(tabs)/orders'),
          },
        ])
      } else {
        handleRealPayment(order.id)
      }
    },
    onError: (err: any) => {
      setIsProcessing(false)
      Alert.alert('Error', err?.response?.data?.error?.user_msg || 'Failed to place order')
    },
  })

  const handleRealPayment = async (orderId: number) => {
    try {
      const paymentData = await orderService.initiatePayment(orderId)
      const { razorpay_order_id, amount, key } = paymentData

      const options = {
        key,
        amount,
        currency: 'INR',
        name: 'Gumla Home Delivery Service',
        description: `Order #${orderId}`,
        order_id: razorpay_order_id,
        prefill: {},
        theme: { color: '#FF6B35' },
      }

      const RazorpayCheckout = require('react-native-razorpay').default
      const paymentResult = await RazorpayCheckout.open(options)

      await orderService.verifyPayment({
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
      })

      clearCart()
      Alert.alert('Payment Successful', `Order #${orderId} has been placed successfully!`, [
        {
          text: 'View Orders',
          onPress: () => router.replace('/(customer)/(tabs)/orders'),
        },
      ])
    } catch (err: any) {
      setIsProcessing(false)
      if (err?.description) {
        Alert.alert('Payment Failed', err.description)
      } else {
        Alert.alert('Error', err?.response?.data?.error?.user_msg || 'Payment failed')
      }
    }
  }

  const handlePayNow = () => {
    if (!addressId) {
      Alert.alert('Error', 'Please select a delivery address')
      router.back()
      return
    }
    setIsProcessing(true)
    createOrderMutation.mutate()
  }

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.product_id} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name_en || item.name_hi}
              </Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Charge</Text>
            <Text style={styles.summaryValue}>{formatCurrency(deliveryCharge)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addressNote}>Address #{(addressId || 'N/A') as string}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, (isProcessing || !isConnected) && styles.payButtonDisabled]}
          onPress={handlePayNow}
          disabled={isProcessing || !isConnected}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>Pay {formatCurrency(total)}</Text>
          )}
        </TouchableOpacity>

        {__DEV__ && (
          <Text style={styles.devNote}>
            Dev Mode: Payment will be simulated without real gateway
          </Text>
        )}
      </ScrollView>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { paddingBottom: 40 },
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
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: { flex: 1, fontSize: 14, color: '#333' },
  itemQty: { fontSize: 13, color: '#666', marginRight: 12, minWidth: 28 },
  itemPrice: { fontSize: 14, color: '#333', fontWeight: '500', minWidth: 60, textAlign: 'right' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#333' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#FF6B35' },
  addressNote: { fontSize: 14, color: '#666' },
  payButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  devNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    marginHorizontal: 16,
    fontStyle: 'italic',
  },
})
