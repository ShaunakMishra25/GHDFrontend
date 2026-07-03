import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { OrderBrief, OrderStatus } from '../../types/api';
import { formatCurrency, formatTime } from '../../utils/formatCurrency';
import StatusBadge from './StatusBadge';

interface OrderRowProps {
  order: OrderBrief;
  onStatusUpdate: (orderId: number, status: string) => void;
}

const STATUS_ACTIONS: Record<OrderStatus, { label: string; nextStatus: string }[]> = {
  pending: [{ label: 'Accept', nextStatus: 'accepted' }],
  confirmed: [{ label: 'Accept', nextStatus: 'accepted' }],
  accepted: [{ label: 'Mark Preparing', nextStatus: 'preparing' }],
  preparing: [{ label: 'Dispatch', nextStatus: 'dispatched' }],
  dispatched: [{ label: 'Deliver', nextStatus: 'delivered' }],
  delivered: [],
  cancelled: [],
};

export default function OrderRow({ order, onStatusUpdate }: OrderRowProps) {
  const actions = STATUS_ACTIONS[order.status] || [];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.orderId}>#{order.id}</Text>
        <StatusBadge status={order.status} size="small" />
      </View>
      <View style={styles.details}>
        <View style={styles.row}>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>
            {order.user_name} ({order.user_phone})
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.value}>{formatCurrency(order.total)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Time</Text>
          <Text style={styles.value}>{formatTime(order.created_at)}</Text>
        </View>
      </View>
      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.nextStatus}
              style={styles.actionButton}
              onPress={() => onStatusUpdate(order.id, action.nextStatus)}
            >
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  details: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#888',
    width: 70,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
