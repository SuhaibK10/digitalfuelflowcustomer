'use client'

import { useState, useEffect } from 'react'
import { createClient, FuelType } from '@/lib/supabase'
import { generateOrderNumber, generateTokenCode, formatCurrency, calculateQuantity, getExpiryTime } from '@/lib/utils'
import { Fuel, CreditCard, QrCode, ArrowRight, Loader2, Zap } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([])
  const [selectedFuel, setSelectedFuel] = useState<FuelType | null>(null)
  const [amount, setAmount] = useState<string>('500')
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenCode, setTokenCode] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchFuelTypes()
  }, [])

  async function fetchFuelTypes() {
    const { data } = await supabase
      .from('fuel_types')
      .select('*')
      .eq('is_active', true)
    
    if (data) {
      setFuelTypes(data)
      if (data.length > 0) setSelectedFuel(data[0])
    }
  }

  async function handlePayment() {
    if (!selectedFuel || !customerName || !phone) {
      setError('Please fill all required fields')
      return
    }

    if (phone.length !== 10) {
      setError('Please enter valid 10-digit phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const orderNumber = generateOrderNumber()
      const tokenCodeGen = generateTokenCode()
      const amountNum = Number(amount)
      const quantity = calculateQuantity(amountNum, selectedFuel.price)

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('token_orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_phone: phone,
          vehicle_number: vehicleNumber || null,
          fuel_type_id: selectedFuel.id,
          quantity_liters: quantity,
          amount: amountNum,
          payment_status: 'success', // Mock payment for demo
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create token
      const { data: token, error: tokenError } = await supabase
        .from('fuel_tokens')
        .insert({
          order_id: order.id,
          token_code: tokenCodeGen,
          fuel_type_id: selectedFuel.id,
          quantity: quantity,
          amount: amountNum,
          status: 'paid',
          expires_at: getExpiryTime(60).toISOString(),
        })
        .select()
        .single()

      if (tokenError) throw tokenError

      setTokenCode(token.token_code)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Success page with QR link
  if (tokenCode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">Your fuel token is ready</p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500">Token Code</p>
            <p className="text-xl font-mono font-bold text-gray-800">{tokenCode}</p>
          </div>
          
          <Link 
            href={`/token/${tokenCode}`}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold px-6 py-4 rounded-xl transition-colors"
          >
            <QrCode className="w-5 h-5" />
            View QR Code
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={() => {
              setTokenCode(null)
              setCustomerName('')
              setPhone('')
              setVehicleNumber('')
              setAmount('500')
            }}
            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Buy Another Token
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Fuel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">FuelFlow</h1>
              <p className="text-xs text-gray-500">AMU Petrol Pump</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-md">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Skip the Queue!
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Buy Fuel Token Online
          </h2>
          <p className="text-gray-600">
            Pay digitally, get QR code, no waiting at counter
          </p>
        </div>

        {/* Fuel Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h3 className="font-semibold text-gray-800 mb-4">Select Fuel Type</h3>
          <div className="grid grid-cols-2 gap-3">
            {fuelTypes.map((fuel) => (
              <button
                key={fuel.id}
                onClick={() => setSelectedFuel(fuel)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedFuel?.id === fuel.id
                    ? 'border-primary-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center ${
                  fuel.code === 'PET' ? 'bg-orange-100' : 'bg-green-100'
                }`}>
                  <Fuel className={`w-6 h-6 ${
                    fuel.code === 'PET' ? 'text-orange-600' : 'text-green-600'
                  }`} />
                </div>
                <p className="font-bold text-gray-800">{fuel.name}</p>
                <p className="text-sm text-gray-500">₹{fuel.price}/L</p>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h3 className="font-semibold text-gray-800 mb-4">Enter Amount</h3>
          
          <div className="flex gap-2 mb-4">
            {['200', '500', '1000', '2000'].map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  amount === amt
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-semibold">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none text-2xl font-bold text-center"
              placeholder="Enter amount"
            />
          </div>

          {selectedFuel && amount && (
            <div className="mt-4 text-center p-3 bg-orange-50 rounded-xl">
              <p className="text-gray-600">
                You will get: <span className="font-bold text-primary-600 text-lg">
                  {calculateQuantity(Number(amount), selectedFuel.price)} Liters
                </span> of {selectedFuel.name}
              </p>
            </div>
          )}
        </div>

        {/* Customer Details */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h3 className="font-semibold text-gray-800 mb-4">Your Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                placeholder="10-digit mobile number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Vehicle Number <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                placeholder="UP81AB1234"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={loading || !selectedFuel || !amount || !customerName || !phone}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay {formatCurrency(Number(amount) || 0)}
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          ⏱️ Token valid for 60 minutes after purchase
        </p>
      </main>
    </div>
  )
}
