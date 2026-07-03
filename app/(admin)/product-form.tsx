import { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Switch, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import productService from '../../services/product.service'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import type { Product, ProductCategory } from '../../types/api'

const ORANGE = '#FF6B35'
const BG = '#F5F5F5'
const GRAY = '#8E8E93'

interface FormData {
  category_id: string
  name: string
  name_hi: string
  description: string
  description_hi: string
  price: string
  unit: string
  image_url: string
  stock: string
  is_active: boolean
}

const initialForm: FormData = {
  category_id: '',
  name: '',
  name_hi: '',
  description: '',
  description_hi: '',
  price: '',
  unit: 'piece',
  image_url: '',
  stock: '0',
  is_active: true,
}

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<{ categories: ProductCategory[] }>({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories(),
  })

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ['admin', 'product', id],
    queryFn: () => productService.getProduct(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (isEdit && product) {
      setForm({
        category_id: product.category_id || '',
        name: product.name || '',
        name_hi: product.name_hi || '',
        description: product.description || '',
        description_hi: product.description_hi || '',
        price: String(product.price || ''),
        unit: product.unit || 'piece',
        image_url: product.image_url || '',
        stock: String(product.stock ?? 0),
        is_active: product.is_active ?? true,
      })
    }
  }, [isEdit, product])

  const categories = categoriesData?.categories ?? []

  const createMutation = useMutation({
    mutationFn: (data: FormData) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      Alert.alert('Success', 'Product created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ])
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to create product')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => productService.updateProduct(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] })
      Alert.alert('Success', 'Product updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ])
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update product')
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.price.trim()) newErrors.price = 'Price is required'
    else if (isNaN(Number(form.price)) || Number(form.price) <= 0)
      newErrors.price = 'Price must be a positive number'
    if (!form.unit.trim()) newErrors.unit = 'Unit is required'
    if (!form.category_id) newErrors.category_id = 'Category is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const mutation = isEdit ? updateMutation : createMutation
    mutation.mutate(form)
  }

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  if ((isEdit && productLoading) || categoriesLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.backButton} onPress={() => router.back()}>‹ Back</Text>
          <SkeletonLoader width={200} height={28} style={{ marginTop: 8 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <SkeletonLoader key={i} width="100%" height={56} borderRadius={10} style={{ marginBottom: 12 }} />
          ))}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.backButton} onPress={() => router.back()}>‹ Back</Text>
        <Text style={styles.title}>{isEdit ? 'Edit Product' : 'New Product'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryOption, form.category_id === cat.id && styles.categoryOptionSelected]}
              onPress={() => updateField('category_id', cat.id)}
            >
              <Text
                style={[styles.categoryOptionText, form.category_id === cat.id && styles.categoryOptionTextSelected]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {errors.category_id && <Text style={styles.errorText}>{errors.category_id}</Text>}

        <Text style={styles.label}>Name (English) *</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(v) => updateField('name', v)}
          placeholder="Product name in English"
          placeholderTextColor={GRAY}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <Text style={styles.label}>Name (Hindi)</Text>
        <TextInput
          style={styles.input}
          value={form.name_hi}
          onChangeText={(v) => updateField('name_hi', v)}
          placeholder="उत्पाद का नाम हिंदी में"
          placeholderTextColor={GRAY}
        />

        <Text style={styles.label}>Description (English)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={(v) => updateField('description', v)}
          placeholder="Product description in English"
          placeholderTextColor={GRAY}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Description (Hindi)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description_hi}
          onChangeText={(v) => updateField('description_hi', v)}
          placeholder="उत्पाद विवरण हिंदी में"
          placeholderTextColor={GRAY}
          multiline
          numberOfLines={3}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={form.price}
              onChangeText={(v) => updateField('price', v)}
              placeholder="0.00"
              placeholderTextColor={GRAY}
              keyboardType="decimal-pad"
            />
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Unit *</Text>
            <TextInput
              style={styles.input}
              value={form.unit}
              onChangeText={(v) => updateField('unit', v)}
              placeholder="kg, piece, dozen"
              placeholderTextColor={GRAY}
            />
            {errors.unit && <Text style={styles.errorText}>{errors.unit}</Text>}
          </View>
        </View>

        <Text style={styles.label}>Image URL</Text>
        <TextInput
          style={styles.input}
          value={form.image_url}
          onChangeText={(v) => updateField('image_url', v)}
          placeholder="https://example.com/image.jpg"
          placeholderTextColor={GRAY}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Stock Quantity</Text>
        <TextInput
          style={styles.input}
          value={form.stock}
          onChangeText={(v) => updateField('stock', v)}
          placeholder="0"
          placeholderTextColor={GRAY}
          keyboardType="number-pad"
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Active</Text>
          <Switch
            value={form.is_active}
            onValueChange={(v) => updateField('is_active', v)}
            trackColor={{ false: '#E5E5EA', true: ORANGE }}
            thumbColor={form.is_active ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>{isEdit ? 'Update Product' : 'Create Product'}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  backButton: {
    fontSize: 17,
    color: ORANGE,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  categoryPicker: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryOptionSelected: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: GRAY,
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  submitButton: {
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
})
