'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Calendar, TrendingDown, CreditCard, Utensils, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Expense, PaymentMethod } from '@/types'

export default function HistoryPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  useEffect(() => {
    fetchExpenses()
  }, [selectedMonth, selectedYear])

  const fetchExpenses = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`
    const endDate = `${selectedYear}-${String(selectedMonth + 2).padStart(2, '0')}-01`

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('expense_date', startDate)
      .lt('expense_date', endDate)
      .order('expense_date', { ascending: true })

    if (error) {
      console.error('Erro ao buscar despesas:', error)
    } else {
      setExpenses(data || [])
    }
    setLoading(false)
  }

  const calculateTotalByMethod = (method: PaymentMethod) => {
    return expenses
      .filter(e => e.payment_method === method)
      .reduce((sum, e) => sum + e.amount, 0)
  }

  const findHighestSpendingDay = () => {
    if (expenses.length === 0) return null

    const spendingByDay = expenses.reduce((acc, expense) => {
      const day = expense.expense_date
      acc[day] = (acc[day] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    const highestDay = Object.entries(spendingByDay).reduce((max, [day, amount]) => 
      amount > max.amount ? { day, amount } : max
    , { day: '', amount: 0 })

    return highestDay
  }

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'credit': return 'Crédito'
      case 'vale_filipi': return 'Vale Filipi'
      case 'vale_vitoria': return 'Vale Vitória'
    }
  }

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'credit': return <CreditCard className="w-4 h-4" />
      case 'vale_filipi': return <Utensils className="w-4 h-4" />
      case 'vale_vitoria': return <Utensils className="w-4 h-4" />
    }
  }

  const getPaymentMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case 'credit': return 'bg-blue-100 text-blue-600'
      case 'vale_filipi': return 'bg-green-100 text-green-600'
      case 'vale_vitoria': return 'bg-purple-100 text-purple-600'
    }
  }

  const highestSpendingDay = findHighestSpendingDay()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Histórico e Relatórios</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Month/Year Selector */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-800">Selecione o Período</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full text-black px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {monthNames.map((name, index) => (
                  <option key={index} value={index}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full text-black px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Crédito Total */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-6 h-6" />
              <span className="font-medium">Crédito</span>
            </div>
            <p className="text-3xl font-bold">R$ {calculateTotalByMethod('credit').toFixed(2)}</p>
            <p className="text-blue-100 text-sm mt-1">Total gasto</p>
          </div>

          {/* Vale Filipi Total */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Utensils className="w-6 h-6" />
              <span className="font-medium">Vale Filipi</span>
            </div>
            <p className="text-3xl font-bold">R$ {calculateTotalByMethod('vale_filipi').toFixed(2)}</p>
            <p className="text-green-100 text-sm mt-1">Total gasto</p>
          </div>

          {/* Vale Vitória Total */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Utensils className="w-6 h-6" />
              <span className="font-medium">Vale Vitória</span>
            </div>
            <p className="text-3xl font-bold">R$ {calculateTotalByMethod('vale_vitoria').toFixed(2)}</p>
            <p className="text-purple-100 text-sm mt-1">Total gasto</p>
          </div>
        </div>

        {/* Highest Spending Day */}
        {highestSpendingDay && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6" />
              <span className="font-semibold text-lg">Dia de Maior Gasto</span>
            </div>
            <p className="text-3xl font-bold">
              {new Date(highestSpendingDay.day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </p>
            <p className="text-orange-100 mt-1">
              Total: R$ {highestSpendingDay.amount.toFixed(2)}
            </p>
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Despesas de {monthNames[selectedMonth]} de {selectedYear}
            </h2>
          </div>

          {expenses.length === 0 ? (
            <div className="p-8 text-center">
              <TrendingDown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma despesa registrada neste período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(expense.expense_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {expense.description}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getPaymentMethodColor(expense.payment_method)}`}>
                          {getPaymentMethodIcon(expense.payment_method)}
                          {getPaymentMethodLabel(expense.payment_method)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                        R$ {expense.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Grand Total */}
        {expenses.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Total Geral do Período</p>
                <p className="text-4xl font-bold mt-1">
                  R$ {expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                </p>
              </div>
              <TrendingDown className="w-12 h-12 opacity-50" />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
