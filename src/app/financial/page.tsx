'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Wallet, CreditCard, Utensils, TrendingDown, Edit2, Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { FinancialLimits, Expense, PaymentMethod } from '@/types'

export default function FinancialPage() {
  const router = useRouter()
  const [limits, setLimits] = useState<FinancialLimits | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingLimits, setEditingLimits] = useState(false)
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [newExpense, setNewExpense] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Outros',
    payment_method: 'credit' as PaymentMethod,
    amount: 0
  })
  const [tempLimits, setTempLimits] = useState({
    credit_limit: 900,
    vale_filipi_limit: 320,
    vale_vitoria_limit: 320
  })

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    if (!supabase) {
      router.push('/login')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    console.log('Buscando limites para:', { user_id: session.user.id, month: currentMonth, year: currentYear })

    // Buscar limites do mês atual (sem .single() para evitar erro quando não existe)
    const { data: limitsData, error: limitsError } = await supabase!
      .from('financial_limits')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('month', currentMonth)
      .eq('year', currentYear)

    console.log('Resultado da busca:', limitsData, limitsError)

    if (limitsError || !limitsData || limitsData.length === 0) {
      console.log('Criando novos limites padrão')
      // Criar limites padrão se não existirem
      const { data: newLimits, error: createError } = await supabase!
        .from('financial_limits')
        .insert({
          user_id: session.user.id,
          month: currentMonth,
          year: currentYear,
          credit_limit: 900,
          vale_filipi_limit: 320,
          vale_vitoria_limit: 320
        })
        .select()
        .single()

      if (createError) {
        console.error('Erro ao criar limites:', createError)
      } else {
        console.log('Limites criados:', newLimits)
        setLimits(newLimits)
        setTempLimits({
          credit_limit: newLimits.credit_limit,
          vale_filipi_limit: newLimits.vale_filipi_limit,
          vale_vitoria_limit: newLimits.vale_vitoria_limit
        })
      }
    } else {
      console.log('Limites encontrados:', limitsData[0])
      setLimits(limitsData[0])
      setTempLimits({
        credit_limit: limitsData[0].credit_limit,
        vale_filipi_limit: limitsData[0].vale_filipi_limit,
        vale_vitoria_limit: limitsData[0].vale_vitoria_limit
      })
    }

    // Buscar despesas
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate()
    const { data: expensesData, error: expensesError } = await supabase!
      .from('expenses')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('expense_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
      .lte('expense_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDayOfMonth}`)
      .order('expense_date', { ascending: true })

    if (expensesError) {
      console.error('Erro ao buscar despesas:', expensesError)
    } else {
      setExpenses(expensesData || [])
    }

    setLoading(false)
  }

  const handleUpdateLimits = async () => {
    if (!supabase) {
      alert('Erro: Supabase não configurado')
      return
    }

    const { data: { session } } = await supabase!.auth.getSession()
    if (!session) {
      alert('Erro: Sessão não encontrada')
      return
    }

    console.log('Salvando limites:', tempLimits)
    console.log('Para usuário:', session.user.id, 'Mês:', currentMonth, 'Ano:', currentYear)

    // Primeiro tenta atualizar se já existir
    if (limits) {
      console.log('Atualizando limites existentes, ID:', limits.id)
      const { error } = await supabase!
        .from('financial_limits')
        .update({
          credit_limit: tempLimits.credit_limit,
          vale_filipi_limit: tempLimits.vale_filipi_limit,
          vale_vitoria_limit: tempLimits.vale_vitoria_limit
        })
        .eq('id', limits.id)

      if (error) {
        console.error('Erro ao atualizar limites:', error)
        alert('Erro ao salvar alterações: ' + error.message)
      } else {
        alert('Alterações salvas com sucesso!')
        setEditingLimits(false)
        fetchData()
      }
    } else {
      // Se não existir, cria novos limites
      console.log('Criando novos limites')
      const { data: newLimits, error: createError } = await supabase!
        .from('financial_limits')
        .insert({
          user_id: session.user.id,
          month: currentMonth,
          year: currentYear,
          credit_limit: tempLimits.credit_limit,
          vale_filipi_limit: tempLimits.vale_filipi_limit,
          vale_vitoria_limit: tempLimits.vale_vitoria_limit
        })
        .select()
        .single()

      if (createError) {
        console.error('Erro ao criar limites:', createError)
        alert('Erro ao criar limites: ' + createError.message)
      } else {
        console.log('Limites criados:', newLimits)
        alert('Limites criados com sucesso!')
        setEditingLimits(false)
        fetchData()
      }
    }
  }

  const handleAddExpense = async () => {
    if (!newExpense.description.trim() || newExpense.amount <= 0) return

    if (!supabase) return

    const { data: { session } } = await supabase!.auth.getSession()
    if (!session) return

    const { error } = await supabase!
      .from('expenses')
      .insert({
        user_id: session.user.id,
        expense_date: newExpense.expense_date,
        description: newExpense.description,
        category: newExpense.category,
        payment_method: newExpense.payment_method,
        amount: newExpense.amount
      })

    if (error) {
      console.error('Erro ao adicionar despesa:', error)
    } else {
      setNewExpense({
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'Outros',
        payment_method: 'credit',
        amount: 0
      })
      setShowAddExpense(false)
      fetchData()
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta despesa?')) return

    if (!supabase) return

    const { error } = await supabase!
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar despesa:', error)
    } else {
      fetchData()
    }
  }

  const handleUpdateExpense = async (id: string) => {
    const expense = expenses.find(e => e.id === id)
    if (!expense || !expense.description.trim() || expense.amount <= 0) return

    if (!supabase) return

    const { error } = await supabase
      .from('expenses')
      .update({
        expense_date: expense.expense_date,
        description: expense.description.trim(),
        category: expense.category || 'Outros',
        payment_method: expense.payment_method,
        amount: expense.amount
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar despesa:', error)
    } else {
      setEditingExpense(null)
      fetchData()
    }
  }

  const updateLocalExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  // Formatação de moeda
  const formatToBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Máscara de input de moeda
  const handleCurrencyFormat = (inputValue: string, callback: (value: number) => void) => {
    const numbersOnly = inputValue.replace(/\D/g, '')
    if (!numbersOnly) {
      callback(0)
      return
    }
    const floatValue = parseInt(numbersOnly, 10) / 100
    callback(floatValue)
  }

  const calculateSpent = (method: PaymentMethod) => {
    return expenses
      .filter(e => e.payment_method === method)
      .reduce((sum, e) => sum + e.amount, 0)
  }

  const calculateRunningBalance = (method: PaymentMethod, currentIndex: number) => {
    const limit = limits ? (
      method === 'credit' ? limits.credit_limit :
      method === 'vale_filipi' ? limits.vale_filipi_limit :
      limits.vale_vitoria_limit
    ) : 0

    const spentUpToCurrent = expenses
      .filter((e, i) => e.payment_method === method && i <= currentIndex)
      .reduce((sum, e) => sum + e.amount, 0)

    return limit - spentUpToCurrent
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
      case 'credit': return <CreditCard className="w-5 h-5" />
      case 'vale_filipi': return <Utensils className="w-5 h-5" />
      case 'vale_vitoria': return <Utensils className="w-5 h-5" />
    }
  }

  const getPaymentMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case 'credit': return 'bg-blue-100 text-blue-600'
      case 'vale_filipi': return 'bg-green-100 text-green-600'
      case 'vale_vitoria': return 'bg-purple-100 text-purple-600'
    }
  }

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
            <h1 className="text-xl font-bold text-gray-800">Controle Financeiro</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Financial Limits Panel */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Limites do Mês
            </h2>
            <button
              onClick={() => {
                if (editingLimits) {
                  setTempLimits({
                    credit_limit: limits!.credit_limit,
                    vale_filipi_limit: limits!.vale_filipi_limit,
                    vale_vitoria_limit: limits!.vale_vitoria_limit
                  })
                }
                setEditingLimits(!editingLimits)
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              {editingLimits ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Crédito */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-700">Crédito</span>
              </div>
              {editingLimits ? (
                <input
                  type="number"
                  value={tempLimits.credit_limit}
                  onChange={(e) => setTempLimits({ ...tempLimits, credit_limit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              ) : (
                <p className="text-2xl font-bold text-gray-800">{formatToBRL(limits?.credit_limit || 0)}</p>
              )}
              <div className="mt-2 pt-2 border-t border-blue-200">
                <p className="text-sm text-gray-600">Restante: <span className="font-semibold text-blue-700">{formatToBRL((limits?.credit_limit || 0) - calculateSpent('credit'))}</span></p>
              </div>
            </div>

            {/* Vale Filipi */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-700">Vale Filipi</span>
              </div>
              {editingLimits ? (
                <input
                  type="number"
                  value={tempLimits.vale_filipi_limit}
                  onChange={(e) => setTempLimits({ ...tempLimits, vale_filipi_limit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              ) : (
                <p className="text-2xl font-bold text-gray-800">{formatToBRL(limits?.vale_filipi_limit || 0)}</p>
              )}
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="text-sm text-gray-600">Restante: <span className="font-semibold text-green-700">{formatToBRL((limits?.vale_filipi_limit || 0) - calculateSpent('vale_filipi'))}</span></p>
              </div>
            </div>

            {/* Vale Vitória */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-700">Vale Vitória</span>
              </div>
              {editingLimits ? (
                <input
                  type="number"
                  value={tempLimits.vale_vitoria_limit}
                  onChange={(e) => setTempLimits({ ...tempLimits, vale_vitoria_limit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              ) : (
                <p className="text-2xl font-bold text-gray-800">{formatToBRL(limits?.vale_vitoria_limit || 0)}</p>
              )}
              <div className="mt-2 pt-2 border-t border-purple-200">
                <p className="text-sm text-gray-600">Restante: <span className="font-semibold text-purple-700">{formatToBRL((limits?.vale_vitoria_limit || 0) - calculateSpent('vale_vitoria'))}</span></p>
              </div>
            </div>
          </div>

          {editingLimits && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleUpdateLimits}
                className="flex-1 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors active:scale-95"
              >
                Salvar Alterações
              </button>
            </div>
          )}
        </div>

        {/* Add Expense Button */}
        <button
          onClick={() => setShowAddExpense(!showAddExpense)}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg mb-6 flex items-center justify-center gap-3 active:scale-95"
        >
          <Plus className="w-6 h-6" />
          <span>Adicionar Despesa</span>
        </button>

        {/* Add Expense Form */}
        {showAddExpense && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Nova Despesa</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  value={newExpense.expense_date}
                  onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                  className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-black block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ex: Mercado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="Alimentação">Alimentação</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Moradia">Moradia</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Educação">Educação</option>
                  <option value="Lazer">Lazer</option>
                  <option value="Vestuário">Vestuário</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                <select
                  value={newExpense.payment_method}
                  onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value as PaymentMethod })}
                  className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="credit">Crédito</option>
                  <option value="vale_filipi">Vale Filipi</option>
                  <option value="vale_vitoria">Vale Vitória</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <input
                  type="text"
                  value={formatToBRL(newExpense.amount)}
                  onChange={(e) => handleCurrencyFormat(e.target.value, (val) => setNewExpense({ ...newExpense, amount: val }))}
                  className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddExpense}
                  className="flex-1 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors active:scale-95"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setShowAddExpense(false)
                    setNewExpense({
                      expense_date: new Date().toISOString().split('T')[0],
                      description: '',
                      category: 'Outros',
                      payment_method: 'credit',
                      amount: 0
                    })
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Despesas do Mês
            </h2>
          </div>

          {expenses.length === 0 ? (
            <div className="p-8 text-center">
              <TrendingDown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma despesa registrada este mês</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Restante</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense, index) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      {editingExpense === expense.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="date"
                              value={expense.expense_date}
                              onChange={(e) => updateLocalExpense(expense.id, { expense_date: e.target.value })}
                              className="w-full text-black px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={expense.description}
                              onChange={(e) => updateLocalExpense(expense.id, { description: e.target.value })}
                              className="w-full text-black px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={expense.category || 'Outros'}
                              onChange={(e) => updateLocalExpense(expense.id, { category: e.target.value })}
                              className="w-full text-black px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                            >
                              <option value="Alimentação">Alimentação</option>
                              <option value="Transporte">Transporte</option>
                              <option value="Moradia">Moradia</option>
                              <option value="Saúde">Saúde</option>
                              <option value="Educação">Educação</option>
                              <option value="Lazer">Lazer</option>
                              <option value="Vestuário">Vestuário</option>
                              <option value="Outros">Outros</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={expense.payment_method}
                              onChange={(e) => updateLocalExpense(expense.id, { payment_method: e.target.value as PaymentMethod })}
                              className="w-full text-black px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                            >
                              <option value="credit">Crédito</option>
                              <option value="vale_filipi">Vale Filipi</option>
                              <option value="vale_vitoria">Vale Vitória</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={formatToBRL(expense.amount)}
                              onChange={(e) => handleCurrencyFormat(e.target.value, (val) => updateLocalExpense(expense.id, { amount: val }))}
                              className="w-full text-black px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-700">
                            {formatToBRL(calculateRunningBalance(expense.payment_method, index))}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateExpense(expense.id)}
                                disabled={!expense.description.trim() || expense.amount <= 0}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors active:scale-95 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingExpense(null)
                                  fetchData()
                                }}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {new Date(expense.expense_date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                            {expense.description}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {expense.category || 'Outros'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getPaymentMethodColor(expense.payment_method)}`}>
                              {getPaymentMethodIcon(expense.payment_method)}
                              {getPaymentMethodLabel(expense.payment_method)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800">
                            {formatToBRL(expense.amount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-700">
                            {formatToBRL(calculateRunningBalance(expense.payment_method, index))}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingExpense(expense.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-95"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
