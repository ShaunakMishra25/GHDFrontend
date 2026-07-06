import { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { FlashList } from '@shopify/flash-list'
import { orderService } from '../../../services/order.service'
import OrderCard from '../../../components/customer/OrderCard'
import EmptyState from '../../../components/ui/EmptyState'
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader'
import ErrorBoundary from '../../../components/ui/ErrorBoundary'
import { useRefreshOnFocus } from '../../../hooks/useRefreshOnFocus'
import { Order, OrderStatus } from '../../../types/api'

const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
]

const PAGE_LIMIT = 20

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all')
  const [offset, setOffset] = useState(0)
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const queryParams: { status?: string; limit: number; offset: number } = {
    limit: PAGE_LIMIT,
    offset,
  }
  if (activeTab !== 'all') queryParams.status = activeTab

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['orders', queryParams],
    queryFn: () => orderService.listOrders(queryParams),
    staleTime: 30 * 1000,
  })

  const orders = data?.data || []

  useRefreshOnFocus(refetch)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    setOffset(0)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const handleTabChange = (tab: OrderStatus | 'all') => {
    setActiveTab(tab)
    setOffset(0)
  }

  const handleEndReached = () => {
    if (!isFetching && orders.length >= PAGE_LIMIT) {
      setOffset((prev) => prev + PAGE_LIMIT)
    }
  }

  if (isLoading && offset === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>My Orders</Text>
        <View style={styles.tabRow}>
          {STATUS_TABS.map((tab) => (
            <View key={tab.value} style={[styles.tab, activeTab === tab.value && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.skeletonList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} count={1} />
          ))}
        </View>
      </View>
    )
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Text style={styles.header}>My Orders</Text>

        <FlashList
          data={orders}
          renderItem={({ item }) => <OrderCard order={item} onPress={() => {}} />}
          keyExtractor={(item: Order) => String(item.id)}
          ListHeaderComponent={
            <View style={styles.tabRow}>
              {STATUS_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.value}
                  style={[styles.tab, activeTab === tab.value && styles.tabActive]}
                  onPress={() => handleTabChange(tab.value)}
                >
                  <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          }
          ListFooterComponent={
            isFetching ? (
              <View style={styles.footerLoading}>
                <Text style={styles.footerText}>Loading more...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              message="Your orders will appear here once you place one"
            />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { fontSize: 20, fontWeight: '700', color: '#333', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  tabActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  tabText: { fontSize: 13, color: '#666' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  skeletonList: { paddingHorizontal: 16, paddingTop: 8 },
  listContent: { paddingBottom: 16 },
  footerLoading: { paddingVertical: 20, alignItems: 'center' },
  footerText: { fontSize: 13, color: '#999' },
})
