'use client'

import { useState, useEffect } from 'react'
import { createClient, FuelToken } from '@/lib/supabase'
import { formatCurrency, formatQuantity, formatDateTime, getTimeRemaining, isExpired } from '@/lib/utils'
import { Fuel, Clock, CheckCircle, XCircle, Download, ArrowLeft, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'

export default function TokenPage({ params }: { params: { code: string } }) {
  const [token, setToken] = useState<FuelToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    fetchToken()
  }, [params.code])

  useEffect(() => {
    if (token && token.status === 'paid') {
      const interval = setInterval(() => {
        setTimeRemaining(getTimeRemaining(token.expires_at))
        if (isExpired(token.expires_at)) {
          fetchToken() // Refresh to get updated status
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [token])

  async function fetchToken() {
    setLoading(true)
    const { data, error } = await supabase
      .from('fuel_tokens')
      .select(`*, fuel_types (*), token_orders (*)`)
      .eq('token_code', params.code)
      .single()

    if (error) {
      setError('Token not found')
    } else {
      setToken(data)
      if (data.status === 'paid') {
        generateQR(data.token_code)
      }
    }
    setLoading(false)
  }

  async function generateQR(code: string) {
    try {
      const url = await QRCode.toDataURL(code, {
        width: 280,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
      setQrDataUrl(url)
    } catch (err) {
      console.error('QR generation failed:', err)
    }
  }

  function downloadQR() {
    if (!qrDataUrl || !token) return
    const link = document.createElement('a')
    link.download = `fuelflow-${token.token_code}.png`
    link.href = qrDataUrl
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Token Not Found</h1>
          <p className="text-gray-600 mb-6">This token doesn't exist or has been removed.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-primary-600 font-medium">
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig: Record<string, any> = {
    paid: { bg: 'bg-green-100', text: 'text-green-800', icon: Clock, label: '✅ Ready to Use' },
    used: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: '✓ Fuel Dispensed' },
    expired: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: '✗ Expired' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: '✗ Cancelled' },
  }

  const status = statusConfig[token.status] || statusConfig.paid
  const fuelType = token.fuel_types
  const order = token.token_orders

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <button onClick={fetchToken} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-md">
        {/* Status Banner */}
        <div className={`${status.bg} rounded-2xl p-4 mb-6 text-center`}>
          <p className={`font-bold text-lg ${status.text}`}>{status.label}</p>
          {token.status === 'paid' && (
            <p className="text-sm text-gray-600 mt-1">⏱️ {timeRemaining}</p>
          )}
          {token.status === 'used' && token.used_at && (
            <p className="text-sm text-gray-600 mt-1">Dispensed at {formatDateTime(token.used_at)}</p>
          )}
        </div>

        {/* QR Code Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
          {token.status === 'paid' && qrDataUrl ? (
            <>
              <p className="text-gray-600 mb-4 font-medium">Show this QR at the pump</p>
              <div className="inline-block p-3 bg-white border-4 border-primary-200 rounded-2xl shadow-inner">
                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              <button
                onClick={downloadQR}
                className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </button>
            </>
          ) : (
            <div className="py-12">
              <div className="w-32 h-32 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                {token.status === 'used' ? (
                  <CheckCircle className="w-16 h-16 text-green-500" />
                ) : (
                  <XCircle className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <p className="text-gray-500">
                {token.status === 'used' ? 'Fuel has been dispensed' : 'QR code not available'}
              </p>
            </div>
          )}
        </div>

        {/* Token Details */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-bold text-gray-800 mb-4">Token Details</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Token Code</span>
              <span className="font-mono font-bold text-gray-800">{token.token_code}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Fuel Type</span>
              <span className="font-semibold flex items-center gap-2">
                <Fuel className={`w-4 h-4 ${fuelType?.code === 'PET' ? 'text-orange-500' : 'text-green-500'}`} />
                {fuelType?.name}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Quantity</span>
              <span className="font-bold text-lg text-gray-800">{formatQuantity(token.quantity)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-bold text-lg text-primary-600">{formatCurrency(token.amount)}</span>
            </div>
            
            {order && (
              <>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500">Customer</span>
                  <span className="font-semibold">{order.customer_name}</span>
                </div>
                
                {order.vehicle_number && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500">Vehicle</span>
                    <span className="font-mono font-semibold">{order.vehicle_number}</span>
                  </div>
                )}
              </>
            )}
            
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">Purchased</span>
              <span className="text-sm text-gray-600">{formatDateTime(token.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Buy Another */}
        <div className="mt-6 text-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <Fuel className="w-5 h-5" />
            Buy Another Token
          </Link>
        </div>
      </main>
    </div>
  )
}
