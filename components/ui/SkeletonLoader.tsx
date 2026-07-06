import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, DimensionValue } from 'react-native';

function Shimmer({ style }: { style?: any }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return <Animated.View style={[styles.shimmer, { opacity }, style]} />;
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.productCard}>
      <Shimmer style={{ width: '100%', height: 140, borderRadius: 8 }} />
      <View style={{ marginTop: 12 }}>
        <Shimmer style={{ width: '60%', height: 14, borderRadius: 4 }} />
      </View>
      <View style={{ marginTop: 8 }}>
        <Shimmer style={{ width: '40%', height: 16, borderRadius: 4 }} />
      </View>
      <View style={{ marginTop: 8 }}>
        <Shimmer style={{ width: '30%', height: 12, borderRadius: 4 }} />
      </View>
    </View>
  );
}

export function OrderCardSkeleton() {
  return (
    <View style={styles.orderCard}>
      <Shimmer style={{ width: '50%', height: 16, borderRadius: 4 }} />
      <View style={{ marginTop: 12 }}>
        <Shimmer style={{ width: '30%', height: 14, borderRadius: 4 }} />
      </View>
      <View style={{ marginTop: 8 }}>
        <Shimmer style={{ width: '40%', height: 14, borderRadius: 4 }} />
      </View>
    </View>
  );
}

export function SkeletonLoader({
  count,
  width,
  height = 60,
  borderRadius = 8,
  style,
}: {
  count?: number;
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: any;
}) {
  if (count) {
    return (
      <View>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={[{ marginBottom: 8 }, style]}>
            <Shimmer style={{ width: '100%', height, borderRadius }} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={style}>
      <Shimmer style={{ width: width || '100%', height, borderRadius }} />
    </View>
  );
}

const styles = StyleSheet.create({
  shimmer: {
    backgroundColor: '#E1E9EE',
  },
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
