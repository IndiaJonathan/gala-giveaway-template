import { createRouter, createWebHistory } from 'vue-router'
import TelegramCallback from '@/views/TelegramCallback.vue'
import AvailableGiveaways from '@/views/AvailableGiveaways.vue'
import Profile from '../views/Profile.vue'
import GiveawayWizard from '@/views/GiveawayWizard.vue'
import WonGiveaways from '@/views/WonGiveaways.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/profile',
      name: 'profile',
      component: Profile
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
    },
    {
      path: '/create-giveaway',
      name: 'CreateGiveaway',
      component: GiveawayWizard
    },
    {
      path: '/won',
      name: 'WonGiveaways',
      component: WonGiveaways
    }
  ]
})

export default router
