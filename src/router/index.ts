import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Login.vue'
import TelegramCallback from '@/views/TelegramCallback.vue'
import CreateGiveaway from '@/views/CreateGiveaway.vue'
import GrantAllowance from '@/views/GrantAllowance.vue'
import GiveawayWizard from '@/views/GiveawayWizard.vue'
import AvailableGiveaways from '@/views/AvailableGiveaways.vue'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/profile',
      name: 'profile',
      component: Login
    },
    {
      path: '/',
      name: 'Giveaways',
      component: AvailableGiveaways
    },
    {
      path: '/create-giveaway/:tokenClass',
      name: 'CreateGiveaway',
      component: CreateGiveaway,
    },
    {
      path: '/giveaway',
      name: 'GiveawayWizard',
      component: GiveawayWizard,
    },
    {
      path: '/grant-allowance',
      name: 'GrantAllowance',
      component: GrantAllowance,
    },
    // {
    //   path: '/view-admin-balances',
    //   name: 'ViewAdminBalances',
    //   component: ViewAdminBalances,
    // },
    {
      path: '/telegram-callback',
      name: 'TelegramCallback',
      component: TelegramCallback,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router
