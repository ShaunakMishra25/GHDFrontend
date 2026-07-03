import { useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, RefreshControl, Alert, StyleSheet } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { productService } from '../../../services/product.service'
import EmptyState from '../../../components/ui/EmptyState'
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader'
import { useRefreshOnFocus } from '../../../hooks/useRefreshOnFocus'
import { formatCurrency } from '../../../utils/formatCurrency'
import type { Product, Category } from '../../../types/api'

const ORANGE = '#FF6B35'
const BG = '#F5F5F5'
const GRAY = '#8E8E93'

export default function ProductsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data: categoriesData } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => productService.listCategories(),
  })

  const { data, isLoading, isError, refetch } = useQuery<{ data: Product[]; total: number }>({
    queryKey: ['admin', 'products', selectedCategory],
    queryFn: () =>
      productService.listProducts({
        category_id: selectedCategory ? Number(selectedCategory) : undefined,
        search: search || undefined,
      }),
  })

  useRefreshOnFocus(refetch)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })

  const categories = categoriesData ?? []
  const products = data?.data ?? []

  const filteredProducts = search
    ? products.filter(
          (p: Product) =>
          p.name_en.toLowerCase().includes(search.toLowerCase()) ||
          (p.name_hi || '').toLowerCase().includes(search.toLowerCase()),
      )
    : products

  const onProductPress = useCallback(
    (product: Product) => {
      router.push(`/(admin)/product-form?id=${product.id}`)
    },
    [router],
  )

  const onAddPress = useCallback(() => {
    router.push('/(admin)/product-form')
  }, [router])

  const onDeleteProduct = useCallback(
    (product: Product) => {
      Alert.alert(
        'Delete Product',
        `Are you sure you want to delete "${product.name_en}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteMutation.mutate(product.id),
          },
        ],
      )
    },
    [deleteMutation],
  )

  const onCategoryPress = useCallback((categoryId: string | null) => {
    setSelectedCategory((prev) => (prev === categoryId ? null : categoryId))
  }, [])

  const renderCategoryChip = useCallback(
    (category: Category) => {
      const isSelected = selectedCategory === String(category.id)
      return (
        <TouchableOpacity
          key={category.id}
          style={[styles.chip, isSelected && styles.chipSelected]}
          onPress={() => onCategoryPress(String(category.id))}
        >
          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
            {category.name_en}
          </Text>
        </TouchableOpacity>
      )
    },
    [selectedCategory, onCategoryPress],
  )

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Products</Text>
        </View>
        <View style={{ padding: 16 }}>
          <SkeletonLoader width="100%" height={44} borderRadius={10} />
          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonLoader key={i} width={80} height={32} borderRadius={16} style={{ marginRight: 8 }} />
            ))}
          </View>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} width="100%" height={80} borderRadius={12} style={{ marginTop: 8 }} />
          ))}
        </View>
      </View>
    )
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Products</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load products</Text>
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
        <Text style={styles.title}>Products</Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={GRAY}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <View style={styles.categoriesContainer}>
        <FlashList
          data={[
            { id: 'all', name: 'All' },
            ...categories,
          ]}
          renderItem={({ item }) =>
            item.id === 'all'
              ? (
                <TouchableOpacity
                  style={[styles.chip, selectedCategory === null && styles.chipSelected]}
                  onPress={() => onCategoryPress(null as any)}
                >
                  <Text style={[styles.chipText, selectedCategory === null && styles.chipTextSelected]}>
                    All
                  </Text>
                </TouchableOpacity>
              )
              : renderCategoryChip(item as Category)
          }
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          estimatedItemSize={80}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>
      <FlashList<Product>
        data={filteredProducts}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.productCard}
            onPress={() => onProductPress(item)}
            onLongPress={() => onDeleteProduct(item)}
          >
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name_en}</Text>
              <Text style={styles.productCategory}>{''}</Text>
              <View style={styles.productMeta}>
                <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                <Text style={styles.productUnit}>/{item.unit}</Text>
                <View style={[styles.stockBadge, item.stock_qty > 0 ? styles.inStock : styles.outOfStock]}>
                  <Text style={[styles.stockText, item.stock_qty > 0 ? styles.inStockText : styles.outOfStockText]}>
                    {item.stock_qty > 0 ? `${item.stock_qty} in stock` : 'Out of stock'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.productRight}>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => String(item.id)}
        estimatedItemSize={80}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState icon="package-outline" title={search ? 'No results' : 'No products'} message={search ? 'No products match your search' : 'No products yet'} />
        }
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor={ORANGE} />
        }
      />
      <TouchableOpacity style={styles.fab} onPress={onAddPress} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333333',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: ORANGE,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: GRAY,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  productCategory: {
    fontSize: 12,
    color: GRAY,
    marginTop: 2,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: ORANGE,
  },
  productUnit: {
    fontSize: 12,
    color: GRAY,
  },
  stockBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  inStock: {
    backgroundColor: '#E8F8E8',
  },
  outOfStock: {
    backgroundColor: '#FDE8E8',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '500',
  },
  inStockText: {
    color: '#34C759',
  },
  outOfStockText: {
    color: '#FF3B30',
  },
  productRight: {
    marginLeft: 8,
  },
  chevron: {
    fontSize: 24,
    color: GRAY,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 30,
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
