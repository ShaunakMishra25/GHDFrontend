import { useState, useCallback, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, RefreshControl, StyleSheet, Dimensions } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { FlashList } from '@shopify/flash-list'
import { productService } from '../../../services/product.service'
import ProductCard from '../../../components/customer/ProductCard'
import CategoryCard from '../../../components/customer/CategoryCard'
import { SkeletonLoader } from '../../../components/ui/SkeletonLoader'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorBoundary from '../../../components/ui/ErrorBoundary'
import { useNetworkStatus } from '../../../hooks/useNetworkStatus'
import { useRefreshOnFocus } from '../../../hooks/useRefreshOnFocus'
import { Category, Product } from '../../../types/api'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 48) / 2
const PAGE_LIMIT = 20

export default function CatalogScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ search?: string; categoryId?: string }>()
  const isConnected = useNetworkStatus()

  const [searchText, setSearchText] = useState(params.search || '')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    params.categoryId ? Number(params.categoryId) : null
  )
  const [offset, setOffset] = useState(0)
  const [accumulatedProducts, setAccumulatedProducts] = useState<Product[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.listCategories,
    staleTime: 5 * 60 * 1000,
  })

  const queryParams: { category_id?: number; search?: string; limit: number; offset: number } = {
    limit: PAGE_LIMIT,
    offset,
  }
  if (selectedCategory) queryParams.category_id = selectedCategory
  if (searchText.trim()) queryParams.search = searchText.trim()

  const { data, isLoading, isFetching, refetch } = useQuery<{ data: Product[]; total: number }>({
    queryKey: ['products', queryParams],
    queryFn: () => productService.listProducts(queryParams),
    staleTime: 5 * 60 * 1000,
  })

  const hasMore = (data?.total || 0) > offset + (data?.data.length || 0)

  useEffect(() => {
    if (data?.data) {
      if (offset === 0) {
        setAccumulatedProducts(data.data)
      } else {
        setAccumulatedProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id))
          const newItems = data.data.filter((p: Product) => !existingIds.has(p.id))
          return [...prev, ...newItems]
        })
      }
    }
  }, [data, offset])

  useRefreshOnFocus(refetch)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    setOffset(0)
    setAccumulatedProducts([])
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const handleSearch = () => {
    setOffset(0)
    setAccumulatedProducts([])
  }

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category?.id || null)
    setOffset(0)
    setAccumulatedProducts([])
  }

  const handleEndReached = () => {
    if (!isFetching && hasMore) {
      setOffset((prev) => prev + PAGE_LIMIT)
    }
  }

  const renderCategoryFilter = () => (
    <FlashList
      data={[
        { id: null, name_en: 'All', name_hi: 'सभी', image_url: '', sort_order: 0, is_active: true } as any,
        ...(categories || []),
      ]}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedCategory === item.id && styles.filterChipActive,
          ]}
          onPress={() => handleCategorySelect(item.id ? item : null)}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedCategory === item.id && styles.filterChipTextActive,
            ]}
          >
            {item.name_en}
          </Text>
        </TouchableOpacity>
      )}
      horizontal
      showsHorizontalScrollIndicator={false}
      estimatedItemSize={80}
      keyExtractor={(item: any) => String(item.id || 'all')}
      contentContainerStyle={styles.filterList}
    />
  )

  const displayProducts = accumulatedProducts

  if (isLoading && offset === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        {renderCategoryFilter()}
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonLoader key={i} count={1} />
          ))}
        </View>
      </View>
    )
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <FlashList
          data={displayProducts}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard product={item} onAddToCart={() => {}} />
            </View>
          )}
          keyExtractor={(item: Product) => String(item.id)}
          numColumns={2}
          estimatedItemSize={260}
          ListHeaderComponent={
            <View>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search products..."
                  placeholderTextColor="#999"
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
              </View>
              {renderCategoryFilter()}
            </View>
          }
          ListFooterComponent={
            isFetching ? (
              <View style={styles.footerLoading}>
                <Text style={styles.footerText}>Loading more...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState icon="search" title="No products found" message="Try a different search or category" />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
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
  filterList: { paddingHorizontal: 16, paddingVertical: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  filterChipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  filterChipText: { fontSize: 13, color: '#666' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 8 },
  cardWrapper: { width: CARD_WIDTH, paddingHorizontal: 4, marginBottom: 8 },
  listContent: { paddingBottom: 16 },
  footerLoading: { paddingVertical: 20, alignItems: 'center' },
  footerText: { fontSize: 13, color: '#999' },
})
