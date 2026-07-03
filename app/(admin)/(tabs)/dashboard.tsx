import { useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { orderService } from '../../../services/order.service'
import { useRefreshOnFocus } from '../../../hooks/useRefreshOnFocus'
import StatCard from '../../../components/admin/StatCard'
import OrderRow from '../../../components/admin/OrderRow'
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader'
import { formatCurrency, formatDate } from '../../../utils/formatCurrency'
import type { DashboardStats, OrderStatus, OrderBrief } from '../../../types/api'

const ORANGE = '#FF6B35'
const BG = '#F5F5F5'

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#FF9500',
  confirmed: '#007AFF',
  accepted: '#34C759',
  preparing: '#FF6B35',
  dispatched: '#5856D6',
  delivered: '#34C759',
  cancelled: '#FF3B30',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  accepted: 'Accepted',
  preparing: 'Preparing',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery<DashboardStats>({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => orderService.getDashboard(),
  })

  useRefreshOnFocus(refetch)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const onStatusUpdate = useCallback((orderId: number, status: string) => {
    // Status updates handled in order detail screen
  }, [])

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <View style={styles.statsRow}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={{ flex: 1, marginHorizontal: 4 }}>
                <SkeletonLoader width="100%" height={80} borderRadius={12} />
              </View>
            ))}
          </View>
          <SkeletonLoader width="100%" height={200} borderRadius={12} style={{ marginTop: 16 }} />
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} width="100%" height={72} borderRadius={12} style={{ marginTop: 8 }} />
          ))}
        </ScrollView>
      </View>
    )
  }

  if (isError || !data) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load dashboard</Text>
          <Text style={styles.retryText} onPress={() => refetch()}>
            Tap to retry
          </Text>
        </View>
      </View>
    )
  }

  const totalOrders = data.today_order_count
  const totalRevenue = data.today_revenue
  const pendingOrders = data.pending_order_count
  const totalUsers = data.total_users
  const statusBreakdown = Object.entries(data.status_counts || {}).map(([status, count]) => ({ status: status as OrderStatus, count }))
  const recentOrders = (data.today_orders || []).slice(0, 10)

  const maxStatusCount = Math.max(...statusBreakdown.map((s) => Number(s.count)), 1)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />}
      >
        <View style={styles.statsRow}>
          <StatCard title="Today Orders" value={String(totalOrders)} color={ORANGE} />
          <StatCard title="Today Revenue" value={formatCurrency(totalRevenue)} color="#34C759" />
          <StatCard title="Pending" value={String(pendingOrders)} color="#FF9500" />
          <StatCard title="Total Users" value={String(totalUsers)} color="#007AFF" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status Breakdown</Text>
          <View style={styles.breakdownContainer}>
            {statusBreakdown.map((item) => (
              <View key={item.status} style={styles.breakdownRow}>
                <View style={styles.breakdownLabelRow}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] || GRAY }]} />
                  <Text style={styles.breakdownLabel}>{STATUS_LABELS[item.status] || item.status}</Text>
                </View>
                <View style={styles.breakdownBarContainer}>
                  <View
                    style={[
                      styles.breakdownBar,
                      {
                        backgroundColor: STATUS_COLORS[item.status] || GRAY,
                        width: `${(Number(item.count) / maxStatusCount) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.breakdownCount}>{String(item.count)}</Text>
              </View>
            ))}
            {statusBreakdown.length === 0 && (
              <Text style={styles.emptyText}>No orders yet</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Orders</Text>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No orders today</Text>
          ) : (
            recentOrders.map((order: OrderBrief) => (
              <OrderRow key={order.id} order={order} onStatusUpdate={onStatusUpdate} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const GRAY = '#8E8E93'

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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContent: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  breakdownContainer: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 100,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#333333',
    flexShrink: 1,
  },
  breakdownBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 10,
  },
  breakdownCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    width: 30,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    color: GRAY,
    textAlign: 'center',
    paddingVertical: 16,
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
