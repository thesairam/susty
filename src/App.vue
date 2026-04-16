<template>
  <div id="app">
    <template v-if="isAuthenticated">
      <!-- Top Navigation -->
      <nav class="topnav">
        <div class="topnav-inner">
          <router-link to="/" class="topnav-logo">
            <span class="logo-icon">🌍</span>
            <span class="logo-text">susty</span>
          </router-link>

          <div class="topnav-links hide-mobile">
            <router-link to="/" class="nav-link" title="Feed">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </router-link>
            <router-link to="/marketplace" class="nav-link" title="Marketplace">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
            </router-link>
            <router-link to="/events" class="nav-link" title="Events">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </router-link>
            <router-link to="/community" class="nav-link" title="Community">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            </router-link>
            <router-link to="/challenges" class="nav-link" title="Challenges">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </router-link>
            <router-link to="/knowledge" class="nav-link" title="Knowledge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            </router-link>
            <router-link to="/donations" class="nav-link" title="Donations">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            </router-link>
          </div>

          <div class="topnav-actions">
            <router-link to="/messages" class="nav-link" title="Messages">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </router-link>
            <router-link to="/profile" class="nav-link hide-mobile" title="Profile">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </router-link>
            <button class="nav-link logout-btn hide-mobile" @click="logout" title="Sign Out">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <router-view :key="$route.fullPath" />
      </main>

      <!-- Bottom Navigation (Mobile) -->
      <nav class="bottomnav hide-desktop">
        <router-link to="/" class="bottomnav-link" exact-active-class="active">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </router-link>
        <router-link to="/marketplace" class="bottomnav-link">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
        </router-link>
        <router-link to="/community" class="bottomnav-link">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        </router-link>
        <router-link to="/events" class="bottomnav-link">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </router-link>
        <router-link to="/profile" class="bottomnav-link">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </router-link>
      </nav>
    </template>

    <template v-else>
      <AuthView @login-success="onLoginSuccess" />
    </template>
  </div>
</template>

<script>
import AuthView from './views/AuthView.vue'

export default {
  name: 'App',
  components: { AuthView },
  data() {
    return {
      isAuthenticated: false
    }
  },
  created() {
    this.checkAuthentication()
  },
  methods: {
    checkAuthentication() {
      const token = localStorage.getItem('susty_token')
      this.isAuthenticated = !!token
    },
    onLoginSuccess() {
      this.isAuthenticated = true
    },
    logout() {
      localStorage.removeItem('susty_token')
      localStorage.removeItem('susty_user')
      this.isAuthenticated = false
    }
  }
}
</script>

<style>
@import './assets/styles.css';

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Top Navigation ── */
.topnav {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
  background: rgba(255,255,255,0.92);
}
.topnav-inner {
  max-width: 1024px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 1.25rem;
  gap: 1rem;
}
.topnav-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  flex-shrink: 0;
}
.logo-icon { font-size: 1.5rem; }
.logo-text {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.04em;
}
.topnav-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  flex: 1;
}
.topnav-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-xs);
  color: var(--text-tertiary);
  transition: all var(--transition);
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
}
.nav-link:hover { color: var(--text); background: var(--hover); }
.nav-link.router-link-active { color: var(--text); }
.logout-btn:hover { color: var(--red); }

/* ── Main Content ── */
.main-content {
  flex: 1;
  max-width: 1024px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 2rem;
}

/* ── Bottom Navigation (Mobile) ── */
.bottomnav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border);
  display: flex;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.bottomnav-link {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 0;
  color: var(--text-tertiary);
  transition: color var(--transition);
}
.bottomnav-link:hover,
.bottomnav-link.router-link-active,
.bottomnav-link.active { color: var(--text); }

@media (max-width: 768px) {
  .main-content { padding: 1rem 1rem 5rem; }
}
</style>