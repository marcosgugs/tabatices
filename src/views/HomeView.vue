<script setup lang="ts">
import { products } from '@/data/products'
import { storeConfig } from '@/config/store'
import ProductCard from '@/components/ProductCard.vue'
import { publicAsset } from '@/composables/usePublicAsset'

const orderSteps = [
  {
    title: 'Escolha sua capa',
    description: 'Selecione a ilustração e o tipo de miolo: pautado, pontilhado ou liso.',
  },
  {
    title: 'Finalize o pedido',
    description: 'Revise seu carrinho, informe o endereço e envie. A gente confirma tudo com você.',
  },
  {
    title: 'Pague com tranquilidade',
    description: `Pix com ${storeConfig.pixDiscountPercent}% de desconto ou cartão por link de pagamento.`,
  },
  {
    title: 'Receba em casa',
    description: `Entrega local em ${storeConfig.localDelivery.city}, retirada ou envio pelos Correios.`,
  },
]

function calculateAge(birthDate: { year: number; month: number; day: number }): number {
  const today = new Date()
  const hasHadBirthdayThisYear =
    today.getMonth() + 1 > birthDate.month ||
    (today.getMonth() + 1 === birthDate.month && today.getDate() >= birthDate.day)

  return today.getFullYear() - birthDate.year - (hasHadBirthdayThisYear ? 0 : 1)
}

const aboutParagraphs = [
  `Tenho ${calculateAge(storeConfig.ownerBirthDate)} anos e moro em ${storeConfig.localDelivery.city} com meu marido, meu filho e nossos dois gatos. Sou programadora, mas desenho desde que me entendo por gente. Desenhar sempre foi meu hobby, aquele momento só meu, feito por puro prazer.`,
  'Há pouco tempo, comecei a usar cadernos para organizar o meu dia. Quando vi, já estava desenhando as capas, e cada caderno novo virou uma desculpa para um desenho novo.',
  'Daí nasceu a Tabatices, algo como "coisas da Tabata": cadernos com a minha cara, feitos à mão, traço por traço, para fazer parte da sua rotina também.',
]

const highlights = [
  'Feito à mão',
  `${storeConfig.pixDiscountPercent}% off no Pix`,
  'Envio para todo o Brasil',
]
</script>

<template>
  <div>
    <section class="mx-auto max-w-6xl px-5 pt-16 pb-20 text-center sm:px-8 sm:pt-24">
      <p class="eyebrow">Feito à mão, um a um</p>
      <h1 class="mx-auto mt-4 max-w-3xl text-[44px] leading-[1.05] font-semibold tracking-[-0.03em] text-forest sm:text-7xl">
        Cadernos que contam histórias.
      </h1>
      <p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-muted sm:text-xl">
        Cada capa é desenhada à mão, traço por traço. Um caderno com personalidade para guardar suas ideias.
      </p>

      <div class="relative mx-auto mt-16 max-w-4xl">
        <div class="absolute inset-x-10 -bottom-6 top-16 -z-10 rounded-[40px] bg-rose/50 blur-3xl" aria-hidden="true"></div>
        <img
          :src="publicAsset('images/hero.webp')"
          alt="Três cadernos kraft ilustrados à mão, com farol, tentáculo e água-viva, sobre tecido claro com flores secas"
          width="1672"
          height="941"
          fetchpriority="high"
          class="mx-auto aspect-[1672/941] w-full rounded-[36px] object-cover shadow-[0_30px_60px_-30px_rgba(46,58,47,0.45)]"
        />
      </div>

      <ul class="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink-muted">
        <li v-for="highlight in highlights" :key="highlight" class="flex items-center gap-2">
          <span class="size-1.5 rounded-full bg-mustard" aria-hidden="true"></span>
          {{ highlight }}
        </li>
      </ul>
    </section>

    <section id="cadernos" class="scroll-mt-20 bg-white/50 py-24">
      <div class="mx-auto max-w-6xl px-5 sm:px-8">
        <div class="max-w-2xl">
          <p class="eyebrow">Coleção</p>
          <h2 class="mt-3 text-4xl font-semibold tracking-[-0.02em] text-forest sm:text-5xl">Escolha sua capa.</h2>
          <p class="mt-4 text-lg text-ink-muted">Escolha a ilustração. O seu exemplar será desenhado à mão, só para você.</p>
        </div>

        <div class="mt-14 grid gap-x-8 gap-y-16 sm:grid-cols-2">
          <ProductCard v-for="product in products" :key="product.slug" :product="product" />
        </div>
      </div>
    </section>

    <section id="sobre" class="mx-auto max-w-6xl scroll-mt-20 px-5 pt-24 sm:px-8">
      <div class="grid items-center gap-12 lg:grid-cols-[5fr_7fr] lg:gap-20">
        <div class="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div class="absolute -inset-4 -z-10 rounded-[44px] bg-rose/50 blur-2xl" aria-hidden="true"></div>
          <img
            :src="publicAsset('images/tabata.webp')"
            alt="Tabata sorrindo em frente a uma árvore de primavera florida"
            width="900"
            height="1200"
            loading="lazy"
            class="aspect-[4/5] w-full rounded-[36px] object-cover object-top shadow-[0_30px_60px_-30px_rgba(46,58,47,0.45)]"
          />
        </div>

        <div class="max-w-xl">
          <p class="eyebrow">Sobre</p>
          <h2 class="mt-3 text-4xl font-semibold tracking-[-0.02em] text-forest sm:text-5xl">Prazer, Tabata.</h2>
          <div class="mt-6 space-y-4 text-lg leading-relaxed text-ink-muted">
            <p v-for="paragraph in aboutParagraphs" :key="paragraph">{{ paragraph }}</p>
          </div>
          <a
            :href="`https://instagram.com/${storeConfig.instagramHandle}`"
            target="_blank"
            rel="noopener noreferrer"
            class="link-accent mt-8 inline-block"
          >
            Acompanhe no Instagram @{{ storeConfig.instagramHandle }}
          </a>
        </div>
      </div>
    </section>

    <section id="como-funciona" class="mx-auto max-w-6xl scroll-mt-20 px-5 pt-24 sm:px-8">
      <div class="max-w-2xl">
        <p class="eyebrow">Como funciona</p>
        <h2 class="mt-3 text-4xl font-semibold tracking-[-0.02em] text-forest sm:text-5xl">Simples assim.</h2>
      </div>

      <ol class="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="(step, stepIndex) in orderSteps" :key="step.title" class="rounded-[28px] bg-white/70 p-7">
          <span class="flex size-9 items-center justify-center rounded-full bg-rose/60 text-sm font-semibold text-forest">
            {{ stepIndex + 1 }}
          </span>
          <h3 class="mt-6 text-lg font-semibold tracking-tight text-ink">{{ step.title }}</h3>
          <p class="mt-2 text-[15px] leading-relaxed text-ink-muted">{{ step.description }}</p>
        </li>
      </ol>
    </section>
  </div>
</template>
