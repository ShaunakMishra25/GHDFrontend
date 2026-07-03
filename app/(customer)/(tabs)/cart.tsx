import { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { FlashList } from '@shopify/flash-list'
import { useCartStore } from '../../../store/cart.store'
import CartItemComponent from '../../../components/customer/CartItem'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorBoundary from '../../../components/ui/ErrorBoundary'
import { useNetworkStatus } from '../../../hooks/useNetworkStatus'
import { useCartSync } from '../../../hooks/useCartSync'
import { formatCurrency } from '../../../utils/formatCurrency'

export default function CartScreen() {
  const router = useRouter()
  const isConnected = useNetworkStatus()
  const { syncFromServer } = useCartSync()
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  useFocusEffect(
    useCallback(() => {
      if (isConnected) {
        syncFromServer()
      }
    }, [isConnected])
  )

  const subtotal = useCartStore((s) => s.getSubtotal())
  const itemCount = useCartStore((s) => s.getItemCount())

  const deliveryCharge = subtotal <= 1000 ? 50 : itemCount * 10
  const total = subtotal + deliveryCharge

  const handleProceedToCheckout = () => {
    if (!isConnected) return
    router.push('/(customer)/checkout/address')
  }

  if (items.length === 0) {
    return (
      <ErrorBoundary>
        <View style={styles.container}>
          <EmptyState
            icon="cart-outline"
            title="Your cart is empty"
            message="Browse catalog and add items to your cart"
          />
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(customer)/(tabs)/catalog')}
          >
            <Text style={styles.browseButtonText}>Browse Catalog</Text>
          </TouchableOpacity>
        </View>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Text style={styles.header}>Your Cart ({itemCount} items)</Text>

        <FlashList
          data={items}
          renderItem={({ item }) => (
            <CartItemComponent
              item={item}
              onUpdateQuantity={(qty) => updateQuantity(item.product_id, qty)}
              onRemove={() => removeItem(item.product_id)}
            />
          )}
          keyExtractor={(item) => String(item.product_id)}
          estimatedItemSize={100}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.summary}>
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

          <TouchableOpacity
            style={[styles.checkoutButton, !isConnected && styles.checkoutButtonDisabled]}
            onPress={handleProceedToCheckout}
            disabled={!isConnected}
            activeOpacity={0.8}
          >
            <Text style={styles.checkoutButtonText}>
              {isConnected ? 'Proceed to Checkout' : 'You are offline'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { fontSize: 18, fontWeight: '700', color: '#333', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  listContent: { paddingBottom: 8 },
  summary: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
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
  checkoutButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutButtonDisabled: { opacity: 0.5 },
  checkoutButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  browseButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  browseButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
})
