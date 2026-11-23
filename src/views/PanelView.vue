<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { useCustomersStore } from '@/stores/customers'
import { usePanelOrdersStore } from '@/stores/panelOrders'
import { publicAsset } from '@/composables/usePublicAsset'

interface PanelSection {
  id: 'orders' | 'customers'
  label: string
  routeName: string
}

const sections: PanelSection[] = [
  { id: 'orders', label: 'Pedidos', routeName: 'panel-orders' },
  { id: 'customers', label: 'Clientes', routeName: 'panel-customers' },
]

const route = useRoute()
const authStore = useAuthStore()
const { session, isReady, isPanelMember } = storeToRefs(authStore)
const customersStore = useCustomersStore()
const panelOrdersStore = usePanelOrdersStore()

const email = ref('')
const password = ref('')
const isSigningIn = ref(false)
const signInErrorMessage = ref('')
const connectionErrorMessage = ref('')
const isDataLoaded = ref(false)
const loadErrorMessage = ref('')

const activeSectionId = computed<PanelSection['id']>(() =>
  String(route.name).startsWith('panel-customer') ? 'customers' : 'orders',
)

async function loadPanelData(): Promise<void> {
  isDataLoaded.value = false
  loadErrorMessage.value = ''

  try {
    await Promise.all([customersStore.load(), panelOrdersStore.load()])
    isDataLoaded.value = true
  } catch (error) {
    loadErrorMessage.value = (error as Error).message
  }
}

async function submitSignIn(): Promise<void> {
  signInErrorMessage.value = ''
  isSigningIn.value = true

  try {
    await authStore.signIn(email.value, password.value)
    password.value = ''
  } catch (error) {
    signInErrorMessage.value = (error as Error).message
  } finally {
    isSigningIn.value = false
  }
}

watch(
  isPanelMember,
  (isMember) => {
    if (isMember) loadPanelData()
  },
  { immediate: true },
)

onMounted(() => {
  authStore.initialize().catch(() => {
    connectionErrorMessage.value = 'Não foi possível conectar ao painel. Confira a configuração do Supabase.'
  })
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 pt-8 pb-20 sm:px-8 lg:pt-12">
    <p v-if="connectionErrorMessage" class="mt-16 text-center text-terracotta" role="alert">{{ connectionErrorMessage }}</p>

    <p v-else-if="!isReady" class="mt-16 text-center text-ink-muted" role="status">Carregando…</p>

    <div v-else-if="!session" class="mx-auto mt-8 max-w-sm">
      <img :src="publicAsset('images/logo.webp')" alt="Tabatices" class="mx-auto h-12 w-auto" width="900" height="286" />
      <form class="mt-8 rounded-[32px] bg-white/70 p-6 sm:p-8" @submit.prevent="submitSignIn">
        <p class="eyebrow">Painel</p>
        <h1 class="mt-2 text-2xl font-semibold tracking-tight text-forest">Entrar</h1>

        <label for="panel-email" class="mt-6 block text-[15px] font-semibold text-ink">E-mail</label>
        <input id="panel-email" v-model="email" type="email" autocomplete="email" required class="field mt-2" />

        <label for="panel-password" class="mt-4 block text-[15px] font-semibold text-ink">Senha</label>
        <input id="panel-password" v-model="password" type="password" autocomplete="current-password" required class="field mt-2" />

        <p v-if="signInErrorMessage" class="mt-3 text-sm text-terracotta" role="alert">{{ signInErrorMessage }}</p>

        <button type="submit" class="button-primary mt-6 w-full" :disabled="isSigningIn">
          {{ isSigningIn ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>
    </div>

    <div v-else-if="!isPanelMember" class="mt-16 flex flex-col items-center rounded-[32px] bg-white/60 px-6 py-20 text-center" role="alert">
      <p class="text-xl font-semibold tracking-tight text-ink">Esta conta não tem acesso ao painel.</p>
      <p class="mt-2 max-w-md text-ink-muted">Libere o acesso dela no Supabase e entre de novo.</p>
      <button type="button" class="button-secondary mt-8" @click="authStore.signOut">Sair</button>
    </div>

    <template v-else>
      <header class="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div class="flex items-center gap-5">
          <RouterLink :to="{ name: 'panel-orders' }" aria-label="Painel Tabatices — pedidos" class="-ml-1 block">
            <img :src="publicAsset('images/logo.webp')" alt="Tabatices" class="h-9 w-auto" width="900" height="286" />
          </RouterLink>
          <nav aria-label="Seções do painel" class="inline-flex rounded-full bg-forest/[0.06] p-1">
            <RouterLink
              v-for="section in sections"
              :key="section.id"
              :to="{ name: section.routeName }"
              :aria-current="activeSectionId === section.id ? 'page' : undefined"
              class="rounded-full px-4 py-2 text-[14px] font-medium transition duration-300 ease-apple"
              :class="activeSectionId === section.id ? 'bg-white text-ink shadow-[0_1px_4px_rgba(46,58,47,0.12)]' : 'text-ink-muted hover:text-ink'"
            >
              {{ section.label }}
            </RouterLink>
          </nav>
        </div>
        <button type="button" class="text-sm text-ink-muted transition-colors hover:text-terracotta" @click="authStore.signOut">Sair</button>
      </header>

      <div v-if="loadErrorMessage" class="mt-10 flex flex-col items-center rounded-[32px] bg-white/60 px-6 py-16 text-center" role="alert">
        <p class="text-lg font-semibold tracking-tight text-ink">{{ loadErrorMessage }}</p>
        <button type="button" class="button-secondary mt-6" @click="loadPanelData">Tentar de novo</button>
      </div>

      <p v-else-if="!isDataLoaded" class="mt-10 text-ink-muted" role="status">Carregando pedidos…</p>

      <div v-else class="mt-10">
        <RouterView :key="route.fullPath" />
      </div>
    </template>
  </div>
</template>
