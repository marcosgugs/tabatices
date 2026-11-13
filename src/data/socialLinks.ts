import { storeConfig } from '@/config/store'
import IconInstagram from '@/components/IconInstagram.vue'
import IconTiktok from '@/components/IconTiktok.vue'

export const socialLinks = [
  {
    name: 'Instagram',
    handle: storeConfig.instagramHandle,
    url: `https://instagram.com/${storeConfig.instagramHandle}`,
    icon: IconInstagram,
  },
  {
    name: 'TikTok',
    handle: storeConfig.tiktokHandle,
    url: `https://www.tiktok.com/@${storeConfig.tiktokHandle}`,
    icon: IconTiktok,
  },
]
