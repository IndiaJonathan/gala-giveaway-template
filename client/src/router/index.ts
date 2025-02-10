import { createRouter, createWebHistory } from 'vue-router'
import TelegramCallback from '@/views/TelegramCallback.vue'
import GiveawayWizard from '@/views/GiveawayWizard.vue'
import AvailableGiveaways from '@/views/AvailableGiveaways.vue'
import Profile from '../views/Profile.vue'
import GiveawayWizardV2 from '@/views/GiveawayWizardV2.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/profile',
      name: 'profile',
      component: Profile
    },

    {
      path: '/test',
      name: 'GiveawayWizard2',
      component: GiveawayWizard
    },
    {
      path: '/giveaway2',
      name: 'GiveawayWizard',
      component: GiveawayWizardV2
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
