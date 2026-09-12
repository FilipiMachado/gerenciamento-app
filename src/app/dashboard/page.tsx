'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, Wallet, History, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string>('')
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthorization()
  }, [])

  const checkAuthorization = async () => {
    if (!supabase) {
      router.push('/login')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    setUserEmail(session.user.email || '')

    // Verificar whitelist
    const { data: allowedUser, error } = await supabase!
      .from('allowed_users')
      .select('*')
      .eq('email', session.user.email)
      .eq('is_active', true)
      .single()

    if (error || !allowedUser) {
      setIsAuthorized(false)
      setLoading(false)
      return
    }

    setIsAuthorized(true)
    setLoading(false)
  }

  const handleLogout = async () => {
    if (!supabase) {
      router.push('/login')
      return
    }

    await supabase!.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Acesso não autorizado
          </h2>
          <p className="text-gray-600 mb-6">
            Seu e-mail não está na lista de usuários autorizados.
          </p>
          <button
            onClick={handleLogout}
            className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">
              Gerenciamento Pessoal
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="text-gray-600">
            Bem-vindo, <span className="font-semibold">{userEmail}</span>
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lista de Compras */}
          <button
            onClick={() => router.push('/shopping-list')}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 active:scale-95 text-left group"
          >
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <ShoppingCart className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Lista de Compras
            </h2>
            <p className="text-gray-600 text-sm">
              Gerencie sua lista de compras com valores estimados
            </p>
          </button>

          {/* Controle Financeiro */}
          <button
            onClick={() => router.push('/financial')}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 active:scale-95 text-left group"
          >
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <Wallet className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Controle Financeiro
            </h2>
            <p className="text-gray-600 text-sm">
              Acompanhe seus limites e despesas mensais
            </p>
          </button>

          {/* Histórico e Relatórios */}
          <button
            onClick={() => router.push('/history')}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 active:scale-95 text-left group"
          >
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <History className="w-7 h-7 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Histórico e Relatórios
            </h2>
            <p className="text-gray-600 text-sm">
              Visualize relatórios de meses anteriores
            </p>
          </button>
        </div>
      </main>
    </div>
  )
}
