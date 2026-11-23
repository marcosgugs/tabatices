<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import CartDrawer from '@/components/CartDrawer.vue'

const route = useRoute()
const isPanelRoute = computed(() => route.meta.isPanel === true)
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader v-if="!isPanelRoute" />
    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <template v-if="!isPanelRoute">
      <AppFooter />
      <CartDrawer />
    </template>
  </div>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.35s var(--ease-apple),
    transform 0.35s var(--ease-apple);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
}
</style>
