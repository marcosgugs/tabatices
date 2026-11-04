<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

export interface MagnifierZoom {
  image: string
  backgroundSize: string
  backgroundPosition: string
}

const props = withDefaults(
  defineProps<{
    src: string
    alt: string
    fit?: 'cover' | 'contain'
    zoom?: number
  }>(),
  { fit: 'cover', zoom: 2.5 },
)

const emit = defineEmits<{
  zoom: [zoom: MagnifierZoom | null]
}>()

interface LensFrame {
  left: number
  top: number
  width: number
  height: number
}

const hoverZoomQuery = '(min-width: 1024px) and (pointer: fine)'

const imageElement = ref<HTMLImageElement | null>(null)
const lensFrame = ref<LensFrame | null>(null)

const lensStyle = computed(() => {
  if (!lensFrame.value) return {}

  return {
    width: `${lensFrame.value.width}px`,
    height: `${lensFrame.value.height}px`,
    transform: `translate3d(${lensFrame.value.left}px, ${lensFrame.value.top}px, 0)`,
  }
})

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

function measureRenderedImage(image: HTMLImageElement) {
  const containerWidth = image.clientWidth
  const containerHeight = image.clientHeight
  const widthRatio = containerWidth / image.naturalWidth
  const heightRatio = containerHeight / image.naturalHeight
  const scale = props.fit === 'cover' ? Math.max(widthRatio, heightRatio) : Math.min(widthRatio, heightRatio)
  const renderedWidth = image.naturalWidth * scale
  const renderedHeight = image.naturalHeight * scale

  return {
    containerWidth,
    containerHeight,
    renderedWidth,
    renderedHeight,
    offsetX: (containerWidth - renderedWidth) / 2,
    offsetY: (containerHeight - renderedHeight) / 2,
  }
}

function hideZoom(): void {
  lensFrame.value = null
  emit('zoom', null)
}

function handlePointerMove(event: PointerEvent): void {
  const image = imageElement.value
  if (!image?.naturalWidth || !window.matchMedia(hoverZoomQuery).matches) return

  const bounds = image.getBoundingClientRect()
  const pointerX = event.clientX - bounds.left
  const pointerY = event.clientY - bounds.top
  const { containerWidth, containerHeight, renderedWidth, renderedHeight, offsetX, offsetY } =
    measureRenderedImage(image)

  const visibleLeft = Math.max(offsetX, 0)
  const visibleTop = Math.max(offsetY, 0)
  const visibleRight = Math.min(offsetX + renderedWidth, containerWidth)
  const visibleBottom = Math.min(offsetY + renderedHeight, containerHeight)

  const isInsideImage =
    pointerX >= visibleLeft && pointerX <= visibleRight && pointerY >= visibleTop && pointerY <= visibleBottom

  if (!isInsideImage) {
    hideZoom()
    return
  }

  const lensWidth = Math.min(containerWidth / props.zoom, visibleRight - visibleLeft)
  const lensHeight = Math.min(containerHeight / props.zoom, visibleBottom - visibleTop)
  const lensLeft = clamp(pointerX - lensWidth / 2, visibleLeft, visibleRight - lensWidth)
  const lensTop = clamp(pointerY - lensHeight / 2, visibleTop, visibleBottom - lensHeight)

  lensFrame.value = { left: lensLeft, top: lensTop, width: lensWidth, height: lensHeight }

  emit('zoom', {
    image: props.src,
    backgroundSize: `${renderedWidth * props.zoom}px ${renderedHeight * props.zoom}px`,
    backgroundPosition: `${-(lensLeft - offsetX) * props.zoom}px ${-(lensTop - offsetY) * props.zoom}px`,
  })
}

onBeforeUnmount(hideZoom)
</script>

<template>
  <div class="relative size-full lg:pointer-fine:cursor-crosshair" @pointermove="handlePointerMove" @pointerleave="hideZoom">
    <img
      ref="imageElement"
      :src="src"
      :alt="alt"
      draggable="false"
      class="size-full select-none"
      :class="fit === 'cover' ? 'object-cover' : 'object-contain'"
    />
    <div
      v-show="lensFrame"
      class="pointer-events-none absolute top-0 left-0 border border-forest/40 bg-white/35 shadow-[0_0_0_9999px_rgba(31,38,32,0.12)]"
      :style="lensStyle"
      aria-hidden="true"
    ></div>
  </div>
</template>
