<template>
  <div id="app">
    <template v-if="isAuthenticated">
      <header>
        <div class="header-left">
          <router-link to="/" class="logo">🌍 Susty</router-link>
        </div>
        <nav class="nav-main">
          <router-link to="/" title="Feed">🏠 Feed</router-link>
          <router-link to="/marketplace" title="Marketplace">🛒 Market</router-link>
          <router-link to="/events" title="Events">📅 Events</router-link>
          <router-link to="/community" title="Community">👥 Community</router-link>
          <router-link to="/challenges" title="Challenges">🏆 Challenges</router-link>
          <router-link to="/knowledge" title="Knowledge Hub">📚 Learn</router-link>
          <router-link to="/donations" title="Donations">🎁 Give</router-link>
        </nav>
        <div class="header-right">
          <router-link to="/messages" class="nav-icon" title="Messages">💬</router-link>
          <router-link to="/profile" class="nav-icon" title="Profile">👤</router-link>
          <router-link to="/about" class="nav-icon" title="About">ℹ️</router-link>
          <a href="#" @click.prevent="logout" class="auth-link" title="Sign Out">Sign Out</a>
        </div>
        <!-- Mobile nav toggle -->
        <button class="mobile-toggle" @click="mobileNav = !mobileNav">☰</button>
      </header>

      <!-- Mobile Navigation -->
      <div v-if="mobileNav" class="mobile-nav" @click="mobileNav = false">
        <router-link to="/">🏠 Feed</router-link>
        <router-link to="/marketplace">🛒 Marketplace</router-link>
        <router-link to="/events">📅 Events</router-link>
        <router-link to="/community">👥 Community</router-link>
        <router-link to="/challenges">🏆 Challenges</router-link>
        <router-link to="/knowledge">📚 Knowledge Hub</router-link>
        <router-link to="/donations">🎁 Donations</router-link>
        <router-link to="/messages">💬 Messages</router-link>
        <router-link to="/profile">👤 Profile</router-link>
        <router-link to="/about">ℹ️ About</router-link>
        <a href="#" @click.prevent="logout">🚪 Sign Out</a>
      </div>

      <main>
        <router-view></router-view>
      </main>

      <footer>
        <div class="footer-content">
          <p>&copy; 2026 Susty — A Better Social Media, A Better World! 🌍</p>
          <div class="footer-links">
            <router-link to="/about">About</router-link>
            <router-link to="/knowledge">Knowledge Hub</router-link>
            <router-link to="/community">Community</router-link>
          </div>
        </div>
      </footer>
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
  components: {
    AuthView
  },
  data() {
    return {
      isAuthenticated: false,
      mobileNav: false
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
      this.mobileNav = false
    }
  }
}
</script>

<style>
:root {
  --primary-green: #4CAF50;
  --secondary-green: #45a049;
  --dark-green: #2e7d32;
  --light-green: #e8f5e9;
  --primary-blue: #3498db;
  --secondary-blue: #2980b9;
  --accent-orange: #e67e22;
  --light-bg: #f5f7f5;
  --dark-text: #2c3e50;
  --muted-text: #7f8c8d;
  --border-color: #e0e0e0;
  --card-bg: #ffffff;
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --card-shadow-hover: 0 4px 16px rgba(0, 0, 0, 0.12);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --transition: 0.3s ease;
}

body {
  font-family: 'Segoe UI', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  color: var(--dark-text);
  background-color: var(--light-bg);
  margin: 0;
  padding: 0;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  background: linear-gradient(135deg, var(--dark-green), var(--primary-blue));
  color: white;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  height: 56px;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.header-left { display: flex; align-items: center; }

.logo {
  font-size: 1.4rem;
  font-weight: 800;
  color: white;
  text-decoration: none;
  margin-right: 1.5rem;
  letter-spacing: -0.5px;
}

.nav-main {
  display: flex;
  gap: 0.15rem;
  flex: 1;
}

.nav-main a {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  padding: 0.4rem 0.7rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}
.nav-main a:hover,
.nav-main a.router-link-active {
  background: rgba(255,255,255,0.15);
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.nav-icon {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  padding: 0.35rem;
  font-size: 1.1rem;
  border-radius: 6px;
  transition: all 0.2s;
}
.nav-icon:hover { background: rgba(255,255,255,0.15); color: white; }

.auth-link {
  background: rgba(255,255,255,0.15);
  color: white;
  text-decoration: none;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
}
.auth-link:hover { background: rgba(255,255,255,0.25); }

.mobile-toggle {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.4rem;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: auto;
}

.mobile-nav {
  display: none;
  flex-direction: column;
  background: var(--dark-text);
  padding: 0.5rem 0;
  position: sticky;
  top: 56px;
  z-index: 49;
}
.mobile-nav a {
  color: white;
  text-decoration: none;
  padding: 0.65rem 1.5rem;
  font-size: 0.95rem;
  transition: background 0.2s;
}
.mobile-nav a:hover { background: rgba(255,255,255,0.1); }

main {
  flex: 1;
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

footer {
  background: var(--dark-text);
  color: rgba(255,255,255,0.7);
  padding: 1.25rem 1.5rem;
  margin-top: auto;
}
.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.footer-content p { margin: 0; font-size: 0.85rem; }
.footer-links { display: flex; gap: 1rem; }
.footer-links a { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.8rem; }
.footer-links a:hover { color: white; }

@media (max-width: 900px) {
  .nav-main, .header-right { display: none; }
  .mobile-toggle { display: block; }
  .mobile-nav { display: flex; }
  main { padding: 1rem; }
  .footer-content { flex-direction: column; text-align: center; }
}
</style>