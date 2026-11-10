<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { storeConfig } from '@/config/store'
import { formatCurrency } from '@/composables/useCurrency'
import CartLineItem from '@/components/CartLineItem.vue'

const route = useRoute()
const cartStore = useCartStore()
const { items, itemCount, subtotal, isDrawerOpen } = storeToRefs(cartStore)

const closeButton = ref<HTMLButtonElement | null>(null)
let previouslyFocusedElement: HTMLElement | null = null

const pixSubtotal = computed(() => subtotal.value * (1 - storeConfig.pixDiscountPercent / 100))

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') cartStore.closeDrawer()
}

function lockPage(isLocked: boolean): void {
  document.documentElement.style.overflow = isLocked ? 'hidden' : ''
}

watch(isDrawerOpen, async (isOpen) => {
  lockPage(isOpen)

  if (isOpen) {
    previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    window.addEventListener('keydown', handleKeydown)
    await nextTick()
    closeButton.value?.focus()
    return
  }

  window.removeEventListener('keydown', handleKeydown)
  previouslyFocusedElement?.focus()
  previouslyFocusedElement = null
})

watch(() => route.fullPath, cartStore.closeDrawer)

onBeforeUnmount(() => {
  lockPage(false)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="#teleports">
    <Transition name="drawer-backdrop">
      <div v-if="isDrawerOpen" class="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px]" aria-hidden="true" @click="cartStore.closeDrawer"></div>
    </Transition>

    <Transition name="drawer-panel">
      <aside
        v-if="isDrawerOpen"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-cream shadow-[-30px_0_60px_-30px_rgba(31,38,32,0.35)]"
      >
        <header class="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 id="cart-drawer-title" class="text-xl font-semibold tracking-tight text-forest">
            Seu carrinho
            <span v-if="itemCount" class="ml-1 text-base font-normal text-ink-muted">({{ itemCount }})</span>
          </h2>
          <button
            ref="closeButton"
            type="button"
            aria-label="Fechar carrinho"
            class="flex size-10 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/5"
            @click="cartStore.closeDrawer"
          >
            <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div v-if="items.length === 0" class="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p class="text-lg font-semibold tracking-tight text-ink">Seu carrinho está vazio.</p>
          <p class="mt-2 text-ink-muted">Que tal escolher uma capa que combine com você?</p>
          <RouterLink :to="{ name: 'home', hash: '#cadernos' }" class="button-primary mt-8">Ver cadernos</RouterLink>
        </div>

        <template v-else>
          <ul class="flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-6">
            <CartLineItem v-for="item in items" :key="item.id" :item="item" />
          </ul>

          <footer class="border-t border-line px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div class="flex justify-between text-lg font-semibold">
              <span class="text-ink">Subtotal</span>
              <span class="text-ink">{{ formatCurrency(subtotal) }}</span>
            </div>
            <p class="mt-1 text-right text-sm text-terracotta">{{ formatCurrency(pixSubtotal) }} no Pix</p>
            <p class="mt-3 text-sm text-ink-muted">O frete é calculado na próxima etapa.</p>

            <RouterLink :to="{ name: 'cart' }" class="button-primary mt-5 h-13 w-full text-base" @click="cartStore.closeDrawer">Finalizar pedido</RouterLink>
            <button type="button" class="button-secondary mt-3 w-full" @click="cartStore.closeDrawer">Continuar comprando</button>
          </footer>
        </template>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-backdrop-enter-active,
.drawer-backdrop-leave-active {
  transition: opacity 0.35s var(--ease-apple);
}

.drawer-backdrop-enter-from,
.drawer-backdrop-leave-to {
  opacity: 0;
}

.drawer-panel-enter-active,
.drawer-panel-leave-active {
  transition: transform 0.45s var(--ease-apple);
}

.drawer-panel-enter-from,
.drawer-panel-leave-to {
  transform: translateX(100%);
}
</style>
