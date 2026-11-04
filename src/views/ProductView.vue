<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { findProductBySlug, products } from '@/data/products'
import { formatCurrency } from '@/composables/useCurrency'
import { storeConfig } from '@/config/store'
import { useCartStore } from '@/stores/cart'
import SegmentedControl from '@/components/SegmentedControl.vue'
import QuantityStepper from '@/components/QuantityStepper.vue'
import ProductCard from '@/components/ProductCard.vue'
import ImageMagnifier, { type MagnifierZoom } from '@/components/ImageMagnifier.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const product = computed(() => findProductBySlug(String(route.params.slug)))
const otherProducts = computed(() => products.filter((item) => item.slug !== product.value?.slug).slice(0, 2))

type GalleryView = 'cover' | 'paper'

interface GalleryItem {
  view: GalleryView
  label: string
  image: string
  imageAlt: string
}

const selectedPaper = ref('')
const quantity = ref(1)
const activeView = ref<GalleryView>('cover')
const magnifierZoom = ref<MagnifierZoom | null>(null)

const paperLabels = computed(() => product.value?.paperOptions.map((option) => option.label) ?? [])
const selectedPaperOption = computed(() =>
  product.value?.paperOptions.find((option) => option.label === selectedPaper.value),
)

const galleryItems = computed<GalleryItem[]>(() => {
  if (!product.value) return []

  const items: GalleryItem[] = [
    { view: 'cover', label: 'Capa', image: product.value.image, imageAlt: product.value.imageAlt },
  ]

  if (selectedPaperOption.value) {
    items.push({
      view: 'paper',
      label: `Miolo ${selectedPaperOption.value.label.toLowerCase()}`,
      image: selectedPaperOption.value.image,
      imageAlt: selectedPaperOption.value.imageAlt,
    })
  }

  return items
})

const activeGalleryItem = computed(
  () => galleryItems.value.find((item) => item.view === activeView.value) ?? galleryItems.value[0],
)

const unitPrice = computed(() => {
  if (!product.value) return 0
  return product.value.price + (selectedPaperOption.value?.priceDelta ?? 0)
})

const pixPrice = computed(() => unitPrice.value * (1 - storeConfig.pixDiscountPercent / 100))

watch(
  product,
  (currentProduct) => {
    if (!currentProduct) {
      router.replace({ name: 'home' })
      return
    }

    selectedPaper.value = currentProduct.paperOptions[0]?.label ?? ''
    quantity.value = 1
    activeView.value = 'cover'
  },
  { immediate: true },
)

function showPaper(): void {
  activeView.value = 'paper'
}

function addToCart(): void {
  if (!product.value) return

  cartStore.addItem({
    slug: product.value.slug,
    name: product.value.name,
    image: product.value.image,
    paper: selectedPaper.value,
    unitPrice: unitPrice.value,
    quantity: quantity.value,
  })

  cartStore.openDrawer()
}
</script>

<template>
  <div v-if="product">
    <div class="mx-auto grid max-w-6xl gap-10 px-5 pt-8 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-14">
      <div class="relative lg:sticky lg:top-24 lg:z-20 lg:self-start">
        <div class="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-white shadow-[0_30px_60px_-35px_rgba(46,58,47,0.5)]">
          <Transition name="gallery">
            <div v-if="activeGalleryItem" :key="activeGalleryItem.image" class="absolute inset-0">
              <ImageMagnifier
                :src="activeGalleryItem.image"
                :alt="activeGalleryItem.imageAlt"
                :fit="activeGalleryItem.view === 'cover' ? 'cover' : 'contain'"
                @zoom="magnifierZoom = $event"
              />
            </div>
          </Transition>
        </div>

        <Transition name="zoom-pane">
          <div
            v-if="magnifierZoom"
            class="pointer-events-none absolute top-0 left-[calc(100%+2.5rem)] z-30 hidden aspect-[4/5] w-full rounded-[32px] bg-white bg-no-repeat shadow-[0_30px_80px_-20px_rgba(31,38,32,0.45)] ring-1 ring-line lg:block"
            :style="{
              backgroundImage: `url(&quot;${magnifierZoom.image}&quot;)`,
              backgroundSize: magnifierZoom.backgroundSize,
              backgroundPosition: magnifierZoom.backgroundPosition,
            }"
            aria-hidden="true"
          ></div>
        </Transition>

        <p class="mt-3 hidden items-center gap-1.5 text-xs text-ink-muted lg:pointer-fine:flex">
          <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" stroke-linecap="round" />
          </svg>
          Passe o mouse sobre a foto para ampliar
        </p>

        <div class="mt-4 flex gap-3" role="tablist" aria-label="Fotos do caderno">
          <button
            v-for="galleryItem in galleryItems"
            :key="galleryItem.view"
            type="button"
            role="tab"
            :aria-selected="activeView === galleryItem.view"
            :aria-label="galleryItem.label"
            class="group flex flex-col items-center gap-2"
            @click="activeView = galleryItem.view"
          >
            <span
              class="block size-18 overflow-hidden rounded-2xl bg-white ring-2 ring-offset-2 ring-offset-cream transition duration-300 ease-apple"
              :class="activeView === galleryItem.view ? 'ring-forest' : 'ring-transparent group-hover:ring-forest/20'"
            >
              <img :src="galleryItem.image" alt="" class="size-full object-cover" loading="lazy" />
            </span>
            <span class="text-xs" :class="activeView === galleryItem.view ? 'text-ink' : 'text-ink-muted'">
              {{ galleryItem.label }}
            </span>
          </button>
        </div>
      </div>

      <div class="lg:py-6">
        <RouterLink :to="{ name: 'home', hash: '#cadernos' }" class="link-accent text-sm">‹ Todos os cadernos</RouterLink>

        <h1 class="mt-4 text-4xl font-semibold tracking-[-0.025em] text-forest sm:text-5xl">{{ product.name }}</h1>
        <p class="mt-3 text-lg text-ink-muted">{{ product.tagline }}</p>

        <div class="mt-6">
          <p class="text-2xl font-semibold tracking-tight text-ink">{{ formatCurrency(unitPrice) }}</p>
          <p class="mt-1 text-sm text-ink-muted">
            ou <span class="font-medium text-terracotta">{{ formatCurrency(pixPrice) }}</span> no Pix
          </p>
        </div>

        <div class="mt-8 space-y-4 text-[17px] leading-relaxed text-ink/85">
          <p>{{ product.description }}</p>
          <p>Cada peça é produzida manualmente, por isso podem ocorrer pequenas variações em relação à foto.</p>
          <p v-if="product.isInspiredByReference" class="text-[15px] text-ink-muted">
            Ilustração feita à mão, inspirada em uma referência encontrada na internet. Não é uma criação autoral.
          </p>
        </div>

        <form class="mt-10 space-y-8" @submit.prevent="addToCart">
          <fieldset>
            <legend class="text-[15px] font-semibold text-ink">Miolo</legend>
            <SegmentedControl
              v-model="selectedPaper"
              :options="paperLabels"
              label="Tipo de miolo"
              class="mt-3"
              @update:model-value="showPaper"
            />
          </fieldset>

          <div class="flex flex-wrap items-center gap-3">
            <QuantityStepper v-model="quantity" />
            <button type="submit" class="button-primary h-12 flex-1 sm:flex-none sm:px-10">Adicionar ao carrinho</button>
          </div>
        </form>

        <div class="mt-12 border-t border-line pt-8">
          <h2 class="text-[15px] font-semibold text-ink">Detalhes</h2>
          <ul class="mt-4 space-y-3 text-[15px] text-ink-muted">
            <li v-for="detail in product.details" :key="detail" class="flex gap-3">
              <span class="mt-2 size-1.5 shrink-0 rounded-full bg-kraft" aria-hidden="true"></span>
              {{ detail }}
            </li>
            <li class="flex gap-3">
              <span class="mt-2 size-1.5 shrink-0 rounded-full bg-kraft" aria-hidden="true"></span>
              Produção em até {{ product.productionDays }} dias úteis após o pagamento, mais o prazo de entrega
            </li>
          </ul>
        </div>
      </div>
    </div>

    <section class="mx-auto mt-28 max-w-6xl px-5 sm:px-8">
      <h2 class="text-3xl font-semibold tracking-[-0.02em] text-forest">Você também pode gostar.</h2>
      <div class="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2">
        <ProductCard v-for="otherProduct in otherProducts" :key="otherProduct.slug" :product="otherProduct" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.zoom-pane-enter-active,
.zoom-pane-leave-active {
  transition: opacity 0.2s var(--ease-apple);
}

.zoom-pane-enter-from,
.zoom-pane-leave-to {
  opacity: 0;
}

.gallery-enter-active,
.gallery-leave-active {
  transition: opacity 0.4s var(--ease-apple);
}

.gallery-enter-from,
.gallery-leave-to {
  opacity: 0;
}
</style>
