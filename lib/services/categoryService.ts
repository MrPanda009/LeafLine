import { supabase } from '@/lib/supabase'
import { Category } from '@/types/database'

/**
 * Fetches all categories from the database
 */
export async function fetchCategories(): Promise<{
  success: boolean
  categories: Category[]
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon, description, parent_id, created_at')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      
      // Check for specific error codes
      if (error.code === '42P01') {
        return {
          success: false,
          categories: [],
          error: 'Categories table does not exist. Please run database setup.'
        }
      }

      return {
        success: false,
        categories: [],
        error: `Failed to load categories: ${error.message}`
      }
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        categories: [],
        error: 'No categories available. Please contact administrator.'
      }
    }

    return {
      success: true,
      categories: data as Category[]
    }
  } catch (error) {
    console.error('Exception fetching categories:', error)
    return {
      success: false,
      categories: [],
      error: 'An unexpected error occurred while loading categories'
    }
  }
}

/**
 * Fetches a single category by ID
 */
export async function fetchCategoryById(categoryId: string): Promise<{
  success: boolean
  category?: Category
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, icon, description, parent_id, created_at')
      .eq('id', categoryId)
      .single()

    if (error) {
      console.error('Error fetching category:', error)
      return {
        success: false,
        error: `Failed to load category: ${error.message}`
      }
    }

    return {
      success: true,
      category: data as Category
    }
  } catch (error) {
    console.error('Exception fetching category:', error)
    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}

/**
 * Fetches categories with subcategory support (if implemented)
 */
export async function fetchCategoriesWithSubcategories(): Promise<{
  success: boolean
  categories: (Category & { subcategories?: Category[] })[]
  error?: string
}> {
  // For now, just return flat categories
  // This can be extended when subcategories are added to the schema
  const result = await fetchCategories()
  
  return {
    success: result.success,
    categories: result.categories.map(cat => ({ ...cat, subcategories: [] })),
    error: result.error
  }
}
