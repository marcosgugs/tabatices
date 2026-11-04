<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { publicAsset } from '@/composables/usePublicAsset'

const { itemCount } = storeToRefs(useCartStore())
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
        <RouterLink
          :to="{ name: 'cart' }"
          class="relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-forest/5"
          :aria-label="`Sacola com ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`"
        >
          <svg viewBox="0 0 24 24" class="size-[22px] text-forest" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z" stroke-linejoin="round" />
            <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke-linecap="round" />
          </svg>
          <Transition name="badge">
            <span
              v-if="itemCount > 0"
              class="absolute top-1 right-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-terracotta px-1 text-[10px] leading-[18px] font-semibold text-white"
            >
              {{ itemCount }}
            </span>
          </Transition>
        </RouterLink>
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
