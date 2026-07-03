import { View, Text, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderService } from '../../services/order.service'
import StatusBadge from '../../components/admin/StatusBadge'
import ActionButtons from '../../components/admin/ActionButtons'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import { formatCurrency, formatDate } from '../../utils/formatCurrency'
import type { Order, OrderStatus } from '../../types/api'

const ORANGE = '#FF6B35'
const BG = '#F5F5F5'
const GRAY = '#8E8E93'

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: order, isLoading, isError, refetch } = useQuery<Order>({
    queryKey: ['admin', 'order', id],
    queryFn: () => orderService.getOrder(Number(id!)),
    enabled: !!id,
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => orderService.updateOrderStatus(Number(id!), status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update order status')
    },
  })

  const handleStatusUpdate = (status: string) => {
    Alert.alert('Update Status', `Change order to ${status}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Update',
        onPress: () => statusMutation.mutate(status),
      },
    ])
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.backButton} onPress={() => router.back()}>
            ‹ Back
          </Text>
          <SkeletonLoader width={180} height={28} style={{ marginTop: 8 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <SkeletonLoader width="100%" height={200} borderRadius={12} />
          <SkeletonLoader width="100%" height={150} borderRadius={12} style={{ marginTop: 12 }} />
          <SkeletonLoader width="100%" height={100} borderRadius={12} style={{ marginTop: 12 }} />
        </ScrollView>
      </View>
    )
  }

  if (isError || !order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.backButton} onPress={() => router.back()}>
            ‹ Back
          </Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load order</Text>
          <Text style={styles.retryText} onPress={() => refetch()}>
            Tap to retry
          </Text>
        </View>
      </View>
    )
  }

  const orderStatuses: OrderStatus[] = [
    'pending',
    'confirmed',
    'accepted',
    'preparing',
    'dispatched',
    'delivered',
  ]
  const currentIndex = orderStatuses.indexOf(order.status)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backButton} onPress={() => router.back()}>
          ‹ Back
        </Text>
        <View style={styles.headerRow}>
          <Text style={styles.orderId}>Order #{String(order.id).slice(0, 8)}</Text>
          <StatusBadge status={order.status} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <Text style={styles.customerName}>N/A</Text>
          <Text style={styles.customerPhone}>N/A</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <Text style={styles.addressText}>
            {order.address_text || 'No address provided'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Items</Text>
          {(order.items || []).length === 0 ? (
            <Text style={styles.emptyText}>No items</Text>
          ) : (
            (order.items || []).map((item: any, index: number) => (
              <View key={item.id || index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product_name || item.name}</Text>
                  <Text style={styles.itemQty}>
                    {item.quantity} x {formatCurrency(item.price || item.unit_price)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {formatCurrency((item.price || item.unit_price) * item.quantity)}
                </Text>
              </View>
            ))
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.subtotal || 0)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery Charge</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.delivery_charge || 0)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(order.total || 0)}</Text>
          </View>
        </View>

        {order.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Timeline</Text>
          <View style={styles.timelineRow}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineStatus}>Order placed</Text>
              <Text style={styles.timelineDate}>{formatDate(order.created_at)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.actionBar}>
        {statusMutation.isPending ? (
          <ActivityIndicator size="small" color={ORANGE} />
        ) : (
          <ActionButtons
            status={order.status}
            onAction={handleStatusUpdate}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    fontSize: 17,
    color: ORANGE,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  customerPhone: {
    fontSize: 14,
    color: GRAY,
    marginTop: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  itemQty: {
    fontSize: 12,
    color: GRAY,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: GRAY,
  },
  totalValue: {
    fontSize: 14,
    color: '#333333',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 4,
    paddingTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: ORANGE,
  },
  notesText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    position: 'relative',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ORANGE,
    marginTop: 4,
    marginRight: 12,
  },
  timelineLine: {
    position: 'absolute',
    left: 4,
    top: 14,
    bottom: 0,
    width: 2,
    backgroundColor: '#E5E5EA',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    textTransform: 'capitalize',
  },
  timelineDate: {
    fontSize: 12,
    color: GRAY,
    marginTop: 2,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: GRAY,
  },
  retryText: {
    fontSize: 16,
    color: ORANGE,
    marginTop: 8,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: GRAY,
    textAlign: 'center',
    paddingVertical: 8,
  },
})
