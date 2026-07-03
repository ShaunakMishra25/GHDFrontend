import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OrderStatus } from '../../types/api';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#FF9800',
  confirmed: '#2196F3',
  accepted: '#009688',
  preparing: '#9C27B0',
  dispatched: '#3F51B5',
  delivered: '#4CAF50',
  cancelled: '#F44336',
};

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'small' | 'medium';
}

export default function StatusBadge({
  status,
  size = 'medium',
}: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || '#999';
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Text style={[styles.text, isSmall && styles.textSmall]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  textSmall: {
    fontSize: 11,
  },
});
