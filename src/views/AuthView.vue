<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <span class="auth-logo-icon">🌍</span>
        <h1 class="auth-logo-text">susty</h1>
        <p class="auth-tagline">Join the sustainability movement</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="!isLogin" class="auth-field">
          <input
            type="text"
            v-model="name"
            placeholder="Full name"
            required
            class="auth-input"
          />
        </div>
        <div class="auth-field">
          <input
            type="email"
            v-model="email"
            placeholder="Email address"
            required
            class="auth-input"
          />
        </div>
        <div class="auth-field">
          <input
            type="password"
            v-model="password"
            placeholder="Password"
            required
            class="auth-input"
          />
          <div v-if="!isLogin && password" class="password-meter">
            <div class="password-bar" :class="passwordClass" :style="{ width: passwordWidth }"></div>
          </div>
          <span v-if="!isLogin && password" class="password-hint">{{ passwordStrength }}</span>
        </div>

        <button type="submit" class="auth-submit" :disabled="!isFormValid || loading">
          {{ loading ? 'Please wait...' : (isLogin ? 'Log in' : 'Sign up') }}
        </button>

        <p v-if="error" class="auth-error">{{ error }}</p>
      </form>

      <div class="auth-divider">
        <span>or</span>
      </div>

      <div class="auth-features">
        <div class="auth-feature">🌱 Track your sustainability impact</div>
        <div class="auth-feature">🛒 Circular economy marketplace</div>
        <div class="auth-feature">👥 Join local eco-communities</div>
      </div>

      <div class="auth-switch">
        {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
        <button @click="toggleAuth" class="auth-switch-btn">
          {{ isLogin ? 'Sign up' : 'Log in' }}
        </button>
      </div>
    </div>

    <p class="auth-footer">&copy; 2026 Susty — A better social media, a better world</p>
  </div>
</template>

<script>
import api from '../services/api'

export default {
  name: 'AuthView',
  data() {
    return {
      isLogin: true,
      name: '',
      email: '',
      password: '',
      loading: false,
      error: ''
    }
  },
  computed: {
    passwordStrength() {
      const p = this.password
      if (p.length < 6) return 'Too short'
      if (p.length < 8) return 'Weak'
      const hasUpper = /[A-Z]/.test(p)
      const hasNumber = /\d/.test(p)
      const hasSpecial = /[^A-Za-z0-9]/.test(p)
      const score = [hasUpper, hasNumber, hasSpecial, p.length >= 12].filter(Boolean).length
      if (score >= 3) return 'Strong'
      if (score >= 1) return 'Medium'
      return 'Weak'
    },
    passwordClass() {
      return { weak: this.passwordStrength === 'Weak' || this.passwordStrength === 'Too short', medium: this.passwordStrength === 'Medium', strong: this.passwordStrength === 'Strong' }
    },
    passwordWidth() {
      const map = { 'Too short': '15%', Weak: '33%', Medium: '66%', Strong: '100%' }
      return map[this.passwordStrength] || '0%'
    },
    isFormValid() {
      if (this.isLogin) return this.email && this.password
      return this.name && this.email && this.password && this.passwordStrength !== 'Too short'
    }
  },
  methods: {
    handleSubmit() {
      this.isLogin ? this.loginUser() : this.signUpUser()
    },
    async loginUser() {
      this.loading = true
      this.error = ''
      try {
        const res = await api.login(this.email, this.password)
        if (res && res.access_token) {
          localStorage.setItem('susty_token', res.access_token)
          localStorage.setItem('susty_user', JSON.stringify(res.user))
          this.$emit('login-success')
          this.$router.push('/')
        } else {
          this.error = (res && res.message) || 'Invalid credentials'
        }
      } catch {
        this.error = 'Login failed. Please try again.'
      }
      this.loading = false
    },
    async signUpUser() {
      this.loading = true
      this.error = ''
      try {
        const res = await api.register(this.email, this.password, this.name)
        if (res && res.access_token) {
          localStorage.setItem('susty_token', res.access_token)
          localStorage.setItem('susty_user', JSON.stringify(res.user))
          this.$emit('login-success')
          this.$router.push('/')
        } else {
          this.error = (res && res.message) || 'Registration failed'
        }
      } catch {
        this.error = 'Registration failed. Please try again.'
      }
      this.loading = false
    },
    toggleAuth() {
      this.isLogin = !this.isLogin
      this.error = ''
    }
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 2rem 1rem;
}
.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 2.5rem 2rem 2rem;
}
.auth-logo {
  text-align: center;
  margin-bottom: 2rem;
}
.auth-logo-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 0.5rem;
}
.auth-logo-text {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--text);
  margin: 0;
}
.auth-tagline {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-top: 0.375rem;
}
.auth-form { display: flex; flex-direction: column; gap: 0.75rem; }
.auth-field { position: relative; }
.auth-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-xs);
  font-size: 0.9375rem;
  font-family: var(--font);
  background: var(--hover);
  color: var(--text);
  transition: border-color var(--transition), background var(--transition);
}
.auth-input:focus {
  outline: none;
  border-color: var(--text);
  background: var(--bg-card);
}
.auth-input::placeholder { color: var(--text-tertiary); }

.password-meter {
  height: 3px;
  background: var(--border-light);
  border-radius: 100px;
  overflow: hidden;
  margin-top: 0.5rem;
}
.password-bar {
  height: 100%;
  border-radius: 100px;
  transition: width 0.3s ease, background 0.3s ease;
}
.password-bar.weak { background: var(--red); }
.password-bar.medium { background: var(--orange); }
.password-bar.strong { background: var(--green); }
.password-hint {
  display: block;
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  margin-top: 0.25rem;
  text-align: right;
}

.auth-submit {
  width: 100%;
  padding: 0.8rem;
  background: var(--green);
  color: #fff;
  border: none;
  border-radius: var(--radius-xs);
  font-size: 0.9375rem;
  font-weight: 700;
  font-family: var(--font);
  cursor: pointer;
  transition: background var(--transition);
  margin-top: 0.25rem;
}
.auth-submit:hover:not(:disabled) { background: var(--green-dark); }
.auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.auth-error {
  background: #fef2f2;
  color: var(--red);
  padding: 0.625rem 0.875rem;
  border-radius: var(--radius-xs);
  font-size: 0.8125rem;
  text-align: center;
  border: 1px solid #fecaca;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;
  color: var(--text-tertiary);
  font-size: 0.8125rem;
}
.auth-divider::before, .auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.auth-features {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-bottom: 1.5rem;
}
.auth-feature {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  padding: 0.5rem 0.75rem;
  background: var(--hover);
  border-radius: var(--radius-xs);
}

.auth-switch {
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
}
.auth-switch-btn {
  background: none;
  border: none;
  color: var(--green);
  font-weight: 700;
  cursor: pointer;
  font-size: 0.875rem;
  font-family: var(--font);
  padding: 0;
  margin-left: 0.25rem;
}
.auth-switch-btn:hover { text-decoration: underline; }

.auth-footer {
  margin-top: 2rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}
</style>