import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session } from '@supabase/supabase-js'
import { useSupabase } from '@/composables/useSupabase'

const invalidCredentialsCode = 'invalid_credentials'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const isReady = ref(false)
  let initialization: Promise<void> | null = null

  const isPanelMember = computed(() => session.value?.user.app_metadata.panel_member === true)

  async function restoreSession(): Promise<void> {
    const supabase = useSupabase()
    const { data } = await supabase.auth.getSession()
    session.value = data.session

    supabase.auth.onAuthStateChange((_event, currentSession) => {
      session.value = currentSession
    })

    isReady.value = true
  }

  function initialize(): Promise<void> {
    initialization ??= restoreSession()
    return initialization
  }

  async function signIn(email: string, password: string): Promise<void> {
    const { error } = await useSupabase().auth.signInWithPassword({ email: email.trim(), password })
    if (!error) return

    throw new Error(
      error.code === invalidCredentialsCode
        ? 'E-mail ou senha incorretos.'
        : 'Não foi possível entrar agora. Tente de novo em instantes.',
    )
  }

  async function signOut(): Promise<void> {
    await useSupabase().auth.signOut()
  }

  return { session, isReady, isPanelMember, initialize, signIn, signOut }
})
