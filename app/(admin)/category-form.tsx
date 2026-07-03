import { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Switch, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '../../services/product.service'
import { SkeletonLoader } from '../../components/ui/SkeletonLoader'
import type { Category } from '../../types/api'

const ORANGE = '#FF6B35'
const BG = '#F5F5F5'
const GRAY = '#8E8E93'

interface FormData {
  name: string
  name_hi: string
  image_url: string
  sort_order: string
  is_active: boolean
}

const initialForm: FormData = {
  name: '',
  name_hi: '',
  image_url: '',
  sort_order: '0',
  is_active: true,
}

export default function CategoryFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const { data: category, isLoading } = useQuery<Category>({
    queryKey: ['admin', 'category', id],
    queryFn: () => productService.getCategory(Number(id!)),
    enabled: isEdit,
  })

  useEffect(() => {
    if (isEdit && category) {
      setForm({
        name: category.name_en || '',
        name_hi: category.name_hi || '',
        image_url: category.image_url || '',
        sort_order: String(category.sort_order ?? 0),
        is_active: category.is_active ?? true,
      })
    }
  }, [isEdit, category])

  const mapFormToCategory = (data: FormData): Partial<Category> => ({
    name_en: data.name,
    name_hi: data.name_hi,
    image_url: data.image_url,
    sort_order: Number(data.sort_order),
    is_active: data.is_active,
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => productService.createCategory(mapFormToCategory(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      Alert.alert('Success', 'Category created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ])
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to create category')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => productService.updateCategory(Number(id!), mapFormToCategory(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'category', id] })
      Alert.alert('Success', 'Category updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ])
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update category')
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
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

  if (isEdit && isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.backButton} onPress={() => router.back()}>‹ Back</Text>
          <SkeletonLoader width={200} height={28} style={{ marginTop: 8 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => (
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
        <Text style={styles.title}>{isEdit ? 'Edit Category' : 'New Category'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Name (English) *</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(v) => updateField('name', v)}
          placeholder="Category name in English"
          placeholderTextColor={GRAY}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <Text style={styles.label}>Name (Hindi)</Text>
        <TextInput
          style={styles.input}
          value={form.name_hi}
          onChangeText={(v) => updateField('name_hi', v)}
          placeholder="श्रेणी का नाम हिंदी में"
          placeholderTextColor={GRAY}
        />

        <Text style={styles.label}>Image URL</Text>
        <TextInput
          style={styles.input}
          value={form.image_url}
          onChangeText={(v) => updateField('image_url', v)}
          placeholder="https://example.com/category.jpg"
          placeholderTextColor={GRAY}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Sort Order</Text>
        <TextInput
          style={styles.input}
          value={form.sort_order}
          onChangeText={(v) => updateField('sort_order', v)}
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
            <Text style={styles.submitButtonText}>{isEdit ? 'Update Category' : 'Create Category'}</Text>
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
