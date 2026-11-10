<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { publicAsset } from '@/composables/usePublicAsset'

const cartStore = useCartStore()
const { itemCount } = storeToRefs(cartStore)
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-line/60 bg-cream/75 backdrop-blur-xl backdrop-saturate-150">
    <nav class="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
      <RouterLink :to="{ name: 'home' }" aria-label="Tabatices — página inicial" class="-ml-1 block">
        <img :src="publicAsset('images/logo.webp')" alt="Tabatices" class="h-9 w-auto sm:h-10" width="900" height="286" />
      </RouterLink>

      <div class="flex items-center gap-6 text-[13px] text-ink/80">
        <RouterLink :to="{ name: 'home', hash: '#cadernos' }" class="hidden transition-colors hover:text-ink sm:block">
          Cadernos
        </RouterLink>
        <RouterLink :to="{ name: 'home', hash: '#sobre' }" class="hidden transition-colors hover:text-ink sm:block">
          Sobre
        </RouterLink>
        <RouterLink :to="{ name: 'home', hash: '#como-funciona' }" class="hidden transition-colors hover:text-ink sm:block">
          Como funciona
        </RouterLink>
        <button
          type="button"
          class="relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-forest/5"
          :aria-label="`Carrinho com ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`"
          aria-haspopup="dialog"
          data-allow-mismatch
          @click="cartStore.openDrawer"
        >
          <svg viewBox="0 0 24 24" class="size-[22px] text-forest" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path d="M3 4h2.2l2.3 11.1a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="9.5" cy="20" r="1.3" />
            <circle cx="17" cy="20" r="1.3" />
          </svg>
          <Transition name="badge">
            <span
              v-if="itemCount > 0"
              class="absolute top-1 right-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-terracotta px-1 text-[10px] leading-[18px] font-semibold text-white"
            >
              {{ itemCount }}
            </span>
          </Transition>
        </button>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.badge-enter-active,
.badge-leave-active {
  transition: transform 0.3s var(--ease-apple), opacity 0.3s var(--ease-apple);
}

.badge-enter-from,
.badge-leave-to {
  opacity: 0;
  transform: scale(0.4);
}
</style>
