'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      if (!supabase) {
        console.error('Supabase não configurado')
        router.push('/login')
        return
      }

      // Wait for Supabase to handle the OAuth callback
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: { session }, error } = await supabase!.auth.getSession()

      if (error) {
        console.error('Erro no callback:', error)
        router.push('/login')
        return
      }

      if (session) {
        router.push('/dashboard')
      } else {
        console.error('Nenhuma sessão encontrada após OAuth')
        router.push('/login')
      }
    } catch (error) {
      console.error('Erro no callback:', error)
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Autenticando...</p>
      </div>
    </div>
  )
}
