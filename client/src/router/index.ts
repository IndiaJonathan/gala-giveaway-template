import { createRouter, createWebHistory } from 'vue-router'
import TelegramCallback from '@/views/TelegramCallback.vue'
import AvailableGiveaways from '@/views/AvailableGiveaways.vue'
import Profile from '../views/Profile.vue'
import GiveawayWizard from '@/views/GiveawayWizard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/profile',
      name: 'profile',
      component: Profile
    },
    {
      path: '/giveaway',
      name: 'GiveawayWizard',
      component: GiveawayWizard
    },
    {
      path: '/telegram-callback',
      name: 'TelegramCallback',
      component: TelegramCallback
    },
    {
      path: '/',
      name: 'Giveaways',
      component: AvailableGiveaways
    }
  ]
})

export default router
