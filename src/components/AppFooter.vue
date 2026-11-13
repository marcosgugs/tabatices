<script setup lang="ts">
import { storeConfig } from '@/config/store'
import { buildWhatsappUrl } from '@/composables/useWhatsappCheckout'
import IconWhatsapp from '@/components/IconWhatsapp.vue'
import { socialLinks } from '@/data/socialLinks'

const currentYear = new Date().getFullYear()
const contactUrl = buildWhatsappUrl(`Olá! Vim pelo site da ${storeConfig.name} e tenho uma dúvida.`)
</script>

<template>
  <footer class="mt-24 bg-forest text-cream/80">
    <div class="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3 sm:px-8">
      <div>
        <p class="text-lg font-semibold tracking-tight text-cream">{{ storeConfig.name }}</p>
        <p class="mt-2 max-w-xs text-sm leading-relaxed">
          Cadernos com capas ilustradas à mão, feitos um a um sob encomenda.
        </p>
      </div>

      <div class="text-sm">
        <p class="font-medium text-cream">Fale com a gente</p>
        <ul class="mt-3 space-y-2">
          <li>
            <a :href="contactUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-2 transition-colors hover:text-cream">
              <IconWhatsapp class="size-4" />
              WhatsApp
            </a>
          </li>
          <li v-for="socialLink in socialLinks" :key="socialLink.name">
            <a
              :href="socialLink.url"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-2 transition-colors hover:text-cream"
            >
              <component :is="socialLink.icon" class="size-4" />
              {{ socialLink.name }}
            </a>
          </li>
        </ul>
      </div>

      <div class="text-sm">
        <p class="font-medium text-cream">Bom saber</p>
        <ul class="mt-3 space-y-2 leading-relaxed">
          <li>Produção começa após a confirmação do pagamento.</li>
          <li>Peças feitas sob encomenda: troca apenas em caso de defeito.</li>
          <li>{{ storeConfig.pixDiscountPercent }}% de desconto no Pix.</li>
        </ul>
      </div>
    </div>

    <div class="border-t border-cream/10">
      <p class="mx-auto max-w-6xl px-5 py-6 text-xs text-cream/50 sm:px-8">
        © {{ currentYear }} {{ storeConfig.name }}. Feito à mão, com carinho.
      </p>
    </div>
  </footer>
</template>
