import { useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, RefreshControl, StyleSheet, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { FlashList } from '@shopify/flash-list'
import { productService } from '../../../services/product.service'
import ProductCard from '../../../components/customer/ProductCard'
import CategoryCard from '../../../components/customer/CategoryCard'
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader'
import ErrorBoundary from '../../../components/ui/ErrorBoundary'
import { useNetworkStatus } from '../../../hooks/useNetworkStatus'
import { useRefreshOnFocus } from '../../../hooks/useRefreshOnFocus'
import { Category, Product } from '../../../types/api'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 48) / 2

export default function HomeScreen() {
  const router = useRouter()
  const isConnected = useNetworkStatus()
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const { data: categories, isLoading: catLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: productService.listCategories,
    staleTime: 5 * 60 * 1000,
  })

  const { data: productsData, isLoading: prodLoading, refetch } = useQuery<{ data: Product[]; total: number }>({
    queryKey: ['products', { limit: 20, offset: 0 }],
    queryFn: () => productService.listProducts({ limit: 20, offset: 0 }),
    staleTime: 5 * 60 * 1000,
  })

  useRefreshOnFocus(refetch)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetch()])
    setRefreshing(false)
  }, [refetch])

  const handleSearch = () => {
    const trimmed = search.trim()
    if (trimmed) {
      router.push({ pathname: '/(customer)/(tabs)/catalog', params: { search: trimmed } })
    }
  }

  const handleCategoryPress = (category: Category) => {
    router.push({ pathname: '/(customer)/(tabs)/catalog', params: { categoryId: category.id } })
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Categories</Text>
      {catLoading ? (
        <SkeletonLoader count={4} />
      ) : (
        <FlashList<Category>
          data={categories || []}
          renderItem={({ item }) => (
            <CategoryCard category={item} onPress={() => handleCategoryPress(item)} />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          estimatedItemSize={100}
          keyExtractor={(item: Category) => String(item.id)}
          contentContainerStyle={styles.categoriesList}
        />
      )}

      <Text style={styles.sectionTitle}>Featured Products</Text>
    </View>
  )

  if (prodLoading && !refreshing) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} count={1} />
          ))}
        </View>
      </View>
    )
  }

  const products = productsData?.data || []

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <FlashList<Product>
          data={products}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard product={item} onAddToCart={() => {}} />
            </View>
          )}
          keyExtractor={(item: Product) => String(item.id)}
          numColumns={2}
          estimatedItemSize={260}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No products available</Text>
              <Text style={styles.emptySubtitle}>Check back later for new items</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  headerContainer: { paddingTop: 16 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20 },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  searchButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginLeft: 8,
  },
  searchButtonText: { fontSize: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', paddingHorizontal: 16, marginBottom: 12 },
  categoriesList: { paddingHorizontal: 16, paddingBottom: 16 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  cardWrapper: { width: CARD_WIDTH, paddingHorizontal: 4, marginBottom: 8 },
  listContent: { paddingBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#666' },
  emptySubtitle: { fontSize: 13, color: '#999', marginTop: 4 },
})
