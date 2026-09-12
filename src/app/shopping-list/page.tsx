'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, ShoppingCart, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ShoppingListItem } from '@/types'
import * as IndexedDB from '@/lib/indexedDB'

// Constantes de validação
const VALIDATION = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 9,
  MAX_NAME_LENGTH: 50,
  TOAST_DURATION: 3000
} as const

type ToastType = 'success' | 'error' | 'warning'

export default function ShoppingListPage() {
  const router = useRouter()
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({ item_name: '', quantity: 1, estimated_value: 0 })
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    fetchItems()
    setupOfflineDetection()
  }, [])

  // Toast Notification
  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), VALIDATION.TOAST_DURATION)
  }

  // Sync Status Notification
  const showSyncStatus = (message: string, type: 'success' | 'error' | 'info') => {
    setSyncStatus({ message, type })
    setTimeout(() => setSyncStatus(null), 5000)
  }

  // Setup offline detection
  const setupOfflineDetection = () => {
    const handleOnline = () => {
      setIsOffline(false)
      showSyncStatus('Conexão restaurada. Sincronizando...', 'info')
      syncOfflineItems()
    }

    const handleOffline = () => {
      setIsOffline(true)
      showSyncStatus('Você está offline. As alterações serão salvas localmente.', 'info')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  // Sync offline items to Supabase
  const syncOfflineItems = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const pendingItems = await IndexedDB.getPendingSyncItems(session.user.id)

      for (const item of pendingItems) {
        if (item.pendingAction === 'create') {
          const { error } = await supabase
            .from('shopping_list')
            .insert({
              user_id: session.user.id,
              item_name: item.item_name,
              quantity: item.quantity,
              estimated_value: item.estimated_value,
              is_purchased: item.is_purchased
            })

          if (!error && item.id) {
            await IndexedDB.markItemAsSynced(item.id)
          }
        } else if (item.pendingAction === 'update') {
          const { error } = await supabase
            .from('shopping_list')
            .update({
              item_name: item.item_name,
              quantity: item.quantity,
              estimated_value: item.estimated_value,
              is_purchased: item.is_purchased
            })
            .eq('id', item.id)

          if (!error && item.id) {
            await IndexedDB.markItemAsSynced(item.id)
          }
        } else if (item.pendingAction === 'delete' && item.id) {
          const { error } = await supabase
            .from('shopping_list')
            .delete()
            .eq('id', item.id)

          if (!error) {
            await IndexedDB.deleteItemFromOfflineCache(item.id)
          }
        }
      }

      if (pendingItems.length > 0) {
        showSyncStatus(`${pendingItems.length} item(ns) sincronizado(s) com sucesso!`, 'success')
        fetchItems()
      }
    } catch (error) {
      console.error('Erro ao sincronizar itens:', error)
      showSyncStatus('Erro ao sincronizar itens. Tente novamente.', 'error')
    }
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

  // Validação de item
  const isValidItem = (name: string, quantity: number) => {
    return name.trim().length > 0 && 
           quantity >= VALIDATION.MIN_QUANTITY && 
           quantity <= VALIDATION.MAX_QUANTITY
  }

  // Verificação de duplicatas
  const checkForDuplicates = (name: string, ignoreId: string | null = null) => {
    return items.find(i => 
      i.id !== ignoreId && 
      i.item_name.trim().toLowerCase() === name.trim().toLowerCase()
    )
  }

  // Confirmação de duplicata
  const confirmDuplicate = (itemName: string, action: 'add' | 'edit') => {
    const message = action === 'add' 
      ? `O item "${itemName.trim()}" já está na lista. Deseja adicionar outro mesmo assim?`
      : `Já existe um item chamado "${itemName.trim()}" na sua lista. Deseja manter este nome mesmo assim?`
    return confirm(message)
  }

  // Busca itens do Supabase
  const fetchItems = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    try {
      const { data, error } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', session.user.id)
        .order('is_purchased', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao buscar itens:', error)
        // Se offline, busca do cache local
        if (!navigator.onLine) {
          const offlineItems = await IndexedDB.getOfflineItems(session.user.id)
          setItems(offlineItems as ShoppingListItem[])
          showToast('Carregando dados offline.', 'warning')
        } else {
          showToast('Erro ao carregar sua lista.', 'error')
        }
      } else {
        setItems(data || [])
        // Salva no cache local quando online
        if (navigator.onLine && data) {
          for (const item of data) {
            await IndexedDB.updateItemInOfflineCache({
              ...item,
              synced: true,
              pendingAction: null
            })
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar itens:', error)
      showToast('Erro ao carregar sua lista.', 'error')
    }
    setLoading(false)
  }

  // Adiciona novo item
  const handleAddItem = async () => {
    if (!isValidItem(newItem.item_name, newItem.quantity)) return

    const isDuplicate = checkForDuplicates(newItem.item_name)
    if (isDuplicate && !confirmDuplicate(newItem.item_name, 'add')) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const newItemData = {
      user_id: session.user.id,
      item_name: newItem.item_name.trim(),
      quantity: newItem.quantity,
      estimated_value: newItem.estimated_value,
      is_purchased: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (!navigator.onLine) {
      // Salva no cache local quando offline
      const offlineItem = {
        ...newItemData,
        id: crypto.randomUUID(),
        synced: false,
        pendingAction: 'create' as const
      }
      await IndexedDB.addItemToOfflineCache(offlineItem)
      setItems([...items, offlineItem as ShoppingListItem])
      resetNewItem()
      showToast('Item salvo localmente. Será sincronizado quando voltar online.', 'warning')
      return
    }

    const { error } = await supabase
      .from('shopping_list')
      .insert(newItemData)

    if (error) {
      console.error('Erro ao adicionar item:', error)
      showToast('Erro ao adicionar item.', 'error')
    } else {
      resetNewItem()
      showToast('Item adicionado com sucesso!')
      fetchItems()
    }
  }

  // Reseta formulário de novo item
  const resetNewItem = () => {
    setNewItem({ item_name: '', quantity: 1, estimated_value: 0 })
    setShowAddForm(false)
  }

  // Toggle comprado/não comprado
  const handleTogglePurchased = async (id: string, isPurchased: boolean) => {
    if (!navigator.onLine) {
      // Atualiza no cache local quando offline
      const item = items.find(i => i.id === id)
      if (item) {
        const updatedItem = { ...item, is_purchased: !isPurchased, synced: false, pendingAction: 'update' as const }
        await IndexedDB.updateItemInOfflineCache(updatedItem)
        setItems(items.map(i => i.id === id ? updatedItem : i))
        showToast('Alteração salva localmente. Será sincronizada quando voltar online.', 'warning')
      }
      return
    }

    const { error } = await supabase
      .from('shopping_list')
      .update({ is_purchased: !isPurchased })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar item:', error)
      showToast('Erro ao atualizar status.', 'error')
    } else {
      fetchItems()
    }
  }

  // Deleta item
  const handleDeleteItem = async (id: string) => {
    if (!navigator.onLine) {
      // Deleta do cache local quando offline
      const item = items.find(i => i.id === id)
      if (item) {
        if (item.synced) {
          // Se já foi sincronizado, marca para deletar
          await IndexedDB.updateItemInOfflineCache({ ...item, synced: false, pendingAction: 'delete' as const })
          setItems(items.filter(i => i.id !== id))
          showToast('Item marcado para remoção. Será sincronizado quando voltar online.', 'warning')
        } else {
          // Se ainda não foi sincronizado, deleta direto do cache
          await IndexedDB.deleteItemFromOfflineCache(id)
          setItems(items.filter(i => i.id !== id))
          showToast('Item removido localmente.', 'success')
        }
      }
      return
    }

    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar item:', error)
      showToast('Erro ao deletar item.', 'error')
    } else {
      showToast('Item removido!')
      fetchItems()
    }
  }

  // Atualiza item existente
  const handleUpdateItem = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item || !isValidItem(item.item_name, item.quantity)) return

    const isDuplicate = checkForDuplicates(item.item_name, id)
    if (isDuplicate && !confirmDuplicate(item.item_name, 'edit')) return

    if (!navigator.onLine) {
      // Atualiza no cache local quando offline
      const updatedItem = {
        ...item,
        item_name: item.item_name.trim(),
        synced: false,
        pendingAction: 'update' as const,
        updated_at: new Date().toISOString()
      }
      await IndexedDB.updateItemInOfflineCache(updatedItem)
      setItems(items.map(i => i.id === id ? updatedItem : i))
      setEditingItem(null)
      showToast('Alteração salva localmente. Será sincronizada quando voltar online.', 'warning')
      return
    }

    const { error } = await supabase
      .from('shopping_list')
      .update({
        item_name: item.item_name.trim(),
        quantity: item.quantity,
        estimated_value: item.estimated_value
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar item:', error)
      showToast('Erro ao atualizar item.', 'error')
    } else {
      setEditingItem(null)
      showToast('Item atualizado com sucesso!')
      fetchItems()
    }
  }

  // Limpa lista completa
  const handleClearList = async () => {
    if (!confirm('Tem certeza que deseja limpar toda a lista?')) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Erro ao limpar lista:', error)
      showToast('Erro ao limpar a lista.', 'error')
    } else {
      showToast('Lista limpa com sucesso!')
      fetchItems()
    }
  }

  // Calcula total estimado
  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.estimated_value), 0)
  }

  // Atualiza item localmente durante edição
  const updateLocalItem = (id: string, updates: Partial<ShoppingListItem>) => {
    setItems(items.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-4 rounded-xl shadow-2xl text-white font-medium flex items-center gap-2 z-50 transition-all transform ${
          toast.type === 'success' ? 'bg-green-600' :
          toast.type === 'error' ? 'bg-red-600' : 'bg-yellow-500'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Sync Status Notification */}
      {syncStatus && (
        <div className={`fixed bottom-20 right-4 px-6 py-4 rounded-xl shadow-2xl text-white font-medium flex items-center gap-2 z-50 transition-all transform ${
          syncStatus.type === 'success' ? 'bg-green-600' :
          syncStatus.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {syncStatus.type === 'success' ? <Check className="w-5 h-5" /> :
           syncStatus.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
          {syncStatus.message}
        </div>
      )}

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
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-800">Lista de Compras</h1>
              {isOffline ? (
                <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-xs font-medium">
                  <WifiOff className="w-4 h-4" />
                  <span>Offline</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-medium">
                  <Wifi className="w-4 h-4" />
                  <span>Online</span>
                </div>
              )}
            </div>
            <button
              onClick={handleClearList}
              className="flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Total Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8" />
              <div>
                <p className="text-blue-100 text-sm">Valor Total Estimado</p>
                <p className="text-3xl font-bold">{formatToBRL(calculateTotal())}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-white text-indigo-600 font-semibold py-3 px-6 rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-md active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Adicionar Item</span>
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Novo Item</h3>
              <span className="text-xs text-gray-500 font-medium">* Campos obrigatórios</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Item <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Ex: Arroz"
                  maxLength={VALIDATION.MAX_NAME_LENGTH}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newItem.quantity || ''}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    min={VALIDATION.MIN_QUANTITY}
                    max={VALIDATION.MAX_QUANTITY}
                    placeholder={`Máx: ${VALIDATION.MAX_QUANTITY}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Estimado
                  </label>
                  <input
                    type="text"
                    value={formatToBRL(newItem.estimated_value)}
                    onChange={(e) => handleCurrencyFormat(e.target.value, (val) => setNewItem({ ...newItem, estimated_value: val }))}
                    className="w-full px-4 py-3 border text-black border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddItem}
                  disabled={!isValidItem(newItem.item_name, newItem.quantity)}
                  className="flex-1 bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors active:scale-95 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewItem({ item_name: '', quantity: 1, estimated_value: 0 })
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Sua lista de compras está vazia</p>
              <p className="text-gray-400 text-sm mt-1">Adicione itens para começar</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md ${
                  item.is_purchased ? 'opacity-50 bg-gray-50' : ''
                }`}
              >
                {editingItem === item.id ? (
                  <div className="space-y-3">
                     <p className="text-xs text-gray-500 font-medium text-right">* Campos obrigatórios</p>
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => updateLocalItem(item.id, { item_name: e.target.value })}
                      className="w-full px-4 py-3 text-black border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      maxLength={VALIDATION.MAX_NAME_LENGTH}
                      placeholder="Nome do Item *"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => updateLocalItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 text-black border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        min={VALIDATION.MIN_QUANTITY}
                        max={VALIDATION.MAX_QUANTITY}
                        placeholder={`Qtd (Máx ${VALIDATION.MAX_QUANTITY}) *`}
                      />
                      <input
                        type="text"
                        value={formatToBRL(item.estimated_value)}
                        onChange={(e) => handleCurrencyFormat(e.target.value, (val) => updateLocalItem(item.id, { estimated_value: val }))}
                        className="w-full px-4 py-3 text-black border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleUpdateItem(item.id)}
                        disabled={!isValidItem(item.item_name, item.quantity)}
                        className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                      >
                        <Check className="w-4 h-4" />
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(null)
                          fetchItems() // Restaura o valor original do banco caso cancele
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 active:scale-95"
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleTogglePurchased(item.id, item.is_purchased)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        item.is_purchased
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {item.is_purchased && <Check className="w-5 h-5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-gray-800 truncate ${item.is_purchased ? 'line-through text-gray-400' : ''}`}>
                        {item.item_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qtd: {item.quantity} × {formatToBRL(item.estimated_value)} = <span className="font-medium text-gray-700">{formatToBRL(item.quantity * item.estimated_value)}</span>
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditingItem(item.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors active:scale-95"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors active:scale-95"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}