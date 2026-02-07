import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type FuelType = {
  id: number
  code: string
  name: string
  price: number
}

export type TokenOrder = {
  id: number
  order_number: string
  customer_name: string
  customer_phone: string
  vehicle_number?: string
  fuel_type_id: number
  quantity_liters: number
  amount: number
  payment_status: string
  created_at: string
}

export type FuelToken = {
  id: number
  order_id: number
  token_code: string
  fuel_type_id: number
  quantity: number
  amount: number
  status: 'paid' | 'used' | 'expired' | 'cancelled'
  expires_at: string
  used_at?: string
  created_at: string
  fuel_types?: FuelType
  token_orders?: TokenOrder
}
