export function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${dateStr}-${random}`
}

export function generateTokenCode(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `TKN-${dateStr}-${random}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatQuantity(liters: number): string {
  return `${liters.toFixed(2)} L`
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getExpiryTime(minutes: number = 60): Date {
  return new Date(Date.now() + minutes * 60 * 1000)
}

export function isExpired(expiresAt: string | Date): boolean {
  return new Date(expiresAt) < new Date()
}

export function getTimeRemaining(expiresAt: string | Date): string {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()
  
  if (diff <= 0) return 'Expired'
  
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes} min left`
  
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  return `${hours}h ${remainingMins}m left`
}

export function calculateQuantity(amount: number, pricePerLiter: number): number {
  return Number((amount / pricePerLiter).toFixed(2))
}
