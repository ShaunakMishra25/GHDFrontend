import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { OrderStatus } from '../../types/api';

interface ActionButtonsProps {
  status: OrderStatus;
  onAction: (newStatus: string) => void;
  loading?: boolean;
}

const ACTIONS: Record<OrderStatus, { label: string; nextStatus: string; color: string }[]> = {
  pending: [{ label: 'Accept', nextStatus: 'accepted', color: '#4CAF50' }],
  confirmed: [{ label: 'Accept', nextStatus: 'accepted', color: '#4CAF50' }],
  accepted: [{ label: 'Mark Preparing', nextStatus: 'preparing', color: '#9C27B0' }],
  preparing: [{ label: 'Dispatch', nextStatus: 'dispatched', color: '#3F51B5' }],
  dispatched: [{ label: 'Deliver', nextStatus: 'delivered', color: '#4CAF50' }],
  delivered: [],
  cancelled: [],
};

export default function ActionButtons({
  status,
  onAction,
  loading = false,
}: ActionButtonsProps) {
  const actions = ACTIONS[status] || [];

  if (actions.length === 0) return null;

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.nextStatus}
          style={[styles.button, { backgroundColor: action.color }]}
          onPress={() => onAction(action.nextStatus)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>{action.label}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
