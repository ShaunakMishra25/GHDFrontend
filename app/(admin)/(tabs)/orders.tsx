import { useState, useCallback, useMemo } from 'react'
import { View, Text, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { orderService } from '../../../services/order.service'
import OrderRow from '../../../components/admin/OrderRow'
import EmptyState from '../../../components/ui/EmptyState'
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader'
import { useRefreshOnFocus } from '../../../hooks/useRefreshOnFocus'
import type { Order, OrderBrief, OrderStatus } from '../../../types/api'

const ORANGE = '#FF6B35'
const BG = '#F5F5F5'
const GRAY = '#8E8E93'

const FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Dispatched', value: 'dispatched' },
  { label: 'Delivered', value: 'delivered' },
]

export default function OrdersScreen() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all')
  const [refreshing, setRefreshing] = useState(false)
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['admin', 'orders', activeFilter],
    queryFn: ({ pageParam = 0 }) =>
      orderService.listOrders({
        status: activeFilter === 'all' ? undefined : activeFilter,
        offset: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, p) => sum + p.data.length, 0)
      return loadedCount < lastPage.total ? loadedCount : undefined
    },
    initialPageParam: 0,
  })

  useRefreshOnFocus(refetch)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const orders: OrderBrief[] = (data?.pages.flatMap((p) => p.data) ?? []) as unknown as OrderBrief[]

  const onFilterPress = useCallback((filter: OrderStatus | 'all') => {
    setActiveFilter(filter)
  }, [])

  const onOrderPress = useCallback(
    (order: OrderBrief) => {
      router.push(`/(admin)/order-detail?id=${order.id}`)
    },
    [router],
  )

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const renderFilterTab = useCallback(
    (filter: { label: string; value: OrderStatus | 'all' }) => {
      const isActive = activeFilter === filter.value
      return (
        <TouchableOpacity
          key={filter.value}
          style={[styles.filterTab, isActive && styles.filterTabActive]}
          onPress={() => onFilterPress(filter.value)}
        >
          <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      )
    },
    [activeFilter, onFilterPress],
  )

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Orders</Text>
        </View>
        <View style={styles.filtersContainer}>
          {FILTERS.map((f) => (
            <SkeletonLoader key={f.value} width={80} height={36} borderRadius={18} style={{ marginRight: 8 }} />
          ))}
        </View>
        <View style={{ padding: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonLoader key={i} width="100%" height={72} borderRadius={12} style={{ marginBottom: 8 }} />
          ))}
        </View>
      </View>
    )
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Orders</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load orders</Text>
          <Text style={styles.retryText} onPress={() => refetch()}>
            Tap to retry
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>
      <View style={styles.filtersContainer}>
        <FlashList
          data={FILTERS}
          renderItem={({ item }) => renderFilterTab(item)}
          keyExtractor={(item) => item.value}
          horizontal
          showsHorizontalScrollIndicator={false}
          estimatedItemSize={80}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>
      <FlashList
        data={orders}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.7} onPress={() => onOrderPress(item)}>
            <OrderRow order={item} onStatusUpdate={() => {}} />
          </TouchableOpacity>
        )}
        keyExtractor={(item) => String(item.id)}
        estimatedItemSize={80}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState icon="receipt-outline" title="No orders" message="No orders found" />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator size="small" color={ORANGE} />
            </View>
          ) : null
        }
      />
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: ORANGE,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: GRAY,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
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
})
