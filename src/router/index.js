import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import AboutView from '../views/About.vue'
import MarketplaceView from '../views/Marketplace.vue'
import CommunityView from '../views/Community.vue'
import EventsView from '../views/Events.vue'
import ProfileView from '../views/Profile.vue'
import MessagesView from '../views/Messages.vue'
import ChallengesView from '../views/Challenges.vue'
import KnowledgeView from '../views/Knowledge.vue'
import DonationsView from '../views/Donations.vue'
import AuthView from '../views/AuthView.vue'

const routes = [
  { 
    path: '/', 
    name: 'Home', 
    component: HomeView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/about', 
    name: 'About', 
    component: AboutView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/marketplace', 
    name: 'Marketplace', 
    component: MarketplaceView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/community', 
    name: 'Community', 
    component: CommunityView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/events', 
    name: 'Events', 
    component: EventsView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/profile', 
    name: 'Profile', 
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/messages', 
    name: 'Messages', 
    component: MessagesView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/challenges', 
    name: 'Challenges', 
    component: ChallengesView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/knowledge', 
    name: 'Knowledge', 
    component: KnowledgeView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/donations', 
    name: 'Donations', 
    component: DonationsView,
    meta: { requiresAuth: true }
  },
  { 
    path: '/auth', 
    name: 'Auth', 
    component: AuthView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('susty_token')
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    next({ name: 'Auth' })
  } else {
    next()
  }
})

export default router