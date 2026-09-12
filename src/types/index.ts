export interface ShoppingListItem {
  id: string
  user_id: string
  item_name: string
  quantity: number
  estimated_value: number
  is_purchased: boolean
  created_at: string
  updated_at: string
  synced?: boolean
  pendingAction?: 'create' | 'update' | 'delete' | null
}

export interface FinancialLimits {
  id: string
  user_id: string
  month: number
  year: number
  credit_limit: number
  vale_filipi_limit: number
  vale_vitoria_limit: number
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  expense_date: string
  description: string
  category: string
  payment_method: 'credit' | 'vale_filipi' | 'vale_vitoria'
  amount: number
  created_at: string
  updated_at: string
}

export interface AllowedUser {
  id: string
  email: string
  created_at: string
  is_active: boolean
}

export type PaymentMethod = 'credit' | 'vale_filipi' | 'vale_vitoria'
