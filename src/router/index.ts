import { createRouter, createWebHistory } from 'vue-router'
import TelegramCallback from '@/views/TelegramCallback.vue'
import GiveawayWizard from '@/views/GiveawayWizard.vue'
import AvailableGiveaways from '@/views/AvailableGiveaways.vue'
import Profile from '../views/Profile.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/profile',
      name: 'profile',
      component: Profile
    },
    {
      path: '/',
      name: 'Giveaways',
      component: AvailableGiveaways
    },
    {
      path: '/giveaway',
      name: 'GiveawayWizard',
      component: GiveawayWizard,
    },
    {
      path: '/telegram-callback',
      name: 'TelegramCallback',
      component: TelegramCallback,
    }
  ]
})

export default router
