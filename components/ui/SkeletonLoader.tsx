import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

export function ProductCardSkeleton() {
  return (
    <View style={styles.productCard}>
      <SkeletonPlaceholder>
        <SkeletonPlaceholder.Item>
          <SkeletonPlaceholder.Item
            width="100%"
            height={140}
            borderRadius={8}
          />
          <SkeletonPlaceholder.Item marginTop={12}>
            <SkeletonPlaceholder.Item
              width="60%"
              height={14}
              borderRadius={4}
            />
          </SkeletonPlaceholder.Item>
          <SkeletonPlaceholder.Item marginTop={8}>
            <SkeletonPlaceholder.Item
              width="40%"
              height={16}
              borderRadius={4}
            />
          </SkeletonPlaceholder.Item>
          <SkeletonPlaceholder.Item marginTop={8}>
            <SkeletonPlaceholder.Item
              width="30%"
              height={12}
              borderRadius={4}
            />
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder>
    </View>
  );
}

export function OrderCardSkeleton() {
  return (
    <View style={styles.orderCard}>
      <SkeletonPlaceholder>
        <SkeletonPlaceholder.Item>
          <SkeletonPlaceholder.Item
            width="50%"
            height={16}
            borderRadius={4}
          />
          <SkeletonPlaceholder.Item
            marginTop={12}
            width="30%"
            height={14}
            borderRadius={4}
          />
          <SkeletonPlaceholder.Item
            marginTop={8}
            width="40%"
            height={14}
            borderRadius={4}
          />
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder>
    </View>
  );
}

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    margin: 6,
    flex: 1,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
  },
});
