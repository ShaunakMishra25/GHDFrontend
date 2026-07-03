import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../../store/auth.store'
import { orderService } from '../../../services/order.service'
import ErrorBoundary from '../../../components/ui/ErrorBoundary'
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader'
import { useNetworkStatus } from '../../../hooks/useNetworkStatus'
import { formatDateTime } from '../../../utils/formatCurrency'
import { Address, NotificationItem } from '../../../types/api'

const PAGE_LIMIT = 10

export default function ProfileScreen() {
  const router = useRouter()
  const isConnected = useNetworkStatus()
  const { user, logout } = useAuthStore()

  const { data: addresses, isLoading: addrLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: orderService.listAddresses,
    staleTime: 5 * 60 * 1000,
  })

  const { data: notifData, isLoading: notifLoading } = useQuery({
    queryKey: ['notifications', { limit: PAGE_LIMIT, offset: 0 }],
    queryFn: () => orderService.listNotifications({ limit: PAGE_LIMIT, offset: 0 }),
    staleTime: 60 * 1000,
  })

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout()
        },
      },
    ])
  }

  const userAddresses = addresses || []
  const notifications = notifData?.data || []

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.header}>My Profile</Text>

        <View style={styles.card}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userPhone}>+91 {user?.phone}</Text>
        </View>

        <Text style={styles.sectionTitle}>Addresses</Text>
        <View style={styles.card}>
          {addrLoading ? (
            <SkeletonLoader count={2} />
          ) : userAddresses.length === 0 ? (
            <Text style={styles.emptyText}>No addresses saved yet</Text>
          ) : (
            userAddresses.map((addr: Address) => (
              <View key={addr.id} style={styles.addressItem}>
                <View style={styles.addressDot} />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>{addr.label}</Text>
                  <Text style={styles.addressText}>{addr.full_address}</Text>
                  {addr.landmark ? (
                    <Text style={styles.addressLandmark}>{addr.landmark}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
          <TouchableOpacity style={styles.addButton} onPress={() => {}}>
            <Text style={styles.addButtonText}>+ Add Address</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          {notifLoading ? (
            <SkeletonLoader count={3} />
          ) : notifications.length === 0 ? (
            <Text style={styles.emptyText}>No notifications yet</Text>
          ) : (
            notifications.map((notif: NotificationItem) => (
              <View key={notif.id} style={styles.notifItem}>
                <Text style={styles.notifTitle}>{notif.title}</Text>
                <Text style={styles.notifBody}>{notif.body}</Text>
                <Text style={styles.notifDate}>{formatDateTime(notif.created_at)}</Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { paddingBottom: 40 },
  header: { fontSize: 20, fontWeight: '700', color: '#333', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  userName: { fontSize: 18, fontWeight: '700', color: '#333', textAlign: 'center' },
  userPhone: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', paddingHorizontal: 16, marginBottom: 8, marginTop: 4 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 16 },
  addressItem: { flexDirection: 'row', marginBottom: 12 },
  addressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    marginTop: 6,
    marginRight: 12,
  },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  addressText: { fontSize: 13, color: '#666', marginTop: 2 },
  addressLandmark: { fontSize: 12, color: '#999', marginTop: 2, fontStyle: 'italic' },
  addButton: { borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 12, marginTop: 4 },
  addButtonText: { fontSize: 14, color: '#FF6B35', fontWeight: '600', textAlign: 'center' },
  notifItem: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingVertical: 12 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  notifBody: { fontSize: 13, color: '#666', marginTop: 2 },
  notifDate: { fontSize: 11, color: '#999', marginTop: 4 },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E53935',
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: { color: '#E53935', fontSize: 15, fontWeight: '600' },
})
