<template>
  <div class="user-profile-page" v-if="user">
    <!-- Profile Header -->
    <div class="profile-header card">
      <div class="profile-cover"></div>
      <div class="profile-info">
        <div class="avatar avatar-xl">{{ user.name?.charAt(0).toUpperCase() }}</div>
        <div class="profile-details">
          <h1>{{ user.name }}</h1>
          <p class="profile-handle" v-if="user.username">@{{ user.username }}</p>
          <p class="profile-bio">{{ user.bio || 'Sustainability enthusiast' }}</p>
          <div class="profile-meta">
            <span class="meta-item" v-if="stats">🌱 {{ stats.activity?.roots || 0 }} Roots</span>
            <span class="meta-item">📅 Joined {{ joinDate }}</span>
          </div>
        </div>
        <div class="profile-actions">
          <!-- Connection Button -->
          <button v-if="!isOwnProfile" class="btn" :class="connectionBtnClass" @click="handleConnection" :disabled="connectionLoading">
            {{ connectionBtnText }}
          </button>
          <!-- Message Button (only if connected) -->
          <button v-if="!isOwnProfile && connectionStatus === 'accepted'" class="btn btn-outline" @click="goToMessages">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Message
          </button>
          <button v-if="isOwnProfile" class="btn btn-outline" @click="$router.push('/profile')">Edit Profile</button>
        </div>
      </div>
    </div>

    <!-- Impact Dashboard -->
    <section v-if="stats" class="impact-section">
      <h2 class="section-title">Impact</h2>
      <div class="grid-4">
        <div class="card stat-card">
          <div class="stat-value">{{ stats.impact?.co2Saved || '0' }}</div>
          <div class="stat-label">kg CO₂ Saved</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ stats.impact?.wasteReduced || '0' }}</div>
          <div class="stat-label">kg Waste Reduced</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ stats.impact?.waterSaved || '0' }}</div>
          <div class="stat-label">L Water Conserved</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ stats.impact?.treesEquiv || '0' }}</div>
          <div class="stat-label">Trees Equivalent</div>
        </div>
      </div>
    </section>

    <!-- Activity Summary -->
    <section v-if="stats" class="activity-section">
      <h2 class="section-title">Activity</h2>
      <div class="grid-3">
        <div class="card stat-card"><div class="stat-value">{{ stats.activity?.posts || 0 }}</div><div class="stat-label">Posts</div></div>
        <div class="card stat-card"><div class="stat-value">{{ stats.activity?.marketplaceItems || 0 }}</div><div class="stat-label">Items Listed</div></div>
        <div class="card stat-card"><div class="stat-value">{{ stats.activity?.eventsAttended || 0 }}</div><div class="stat-label">Events</div></div>
        <div class="card stat-card"><div class="stat-value">{{ stats.activity?.challengesCompleted || 0 }}</div><div class="stat-label">Challenges</div></div>
        <div class="card stat-card"><div class="stat-value">{{ stats.activity?.donations || 0 }}</div><div class="stat-label">Donations</div></div>
        <div class="card stat-card"><div class="stat-value">{{ stats.activity?.communityPosts || 0 }}</div><div class="stat-label">Community</div></div>
      </div>
    </section>

    <!-- Badges -->
    <section class="badges-section" v-if="stats">
      <h2 class="section-title">Badges</h2>
      <div class="badges-grid">
        <div v-for="badge in badges" :key="badge.id" class="badge-card card" :class="{ earned: badge.earned, locked: !badge.earned }">
          <span class="badge-icon-lg">{{ badge.icon }}</span>
          <strong class="badge-name">{{ badge.name }}</strong>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="!user" class="loading-state card">
      <p>Loading profile...</p>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'UserProfileView',
  data() {
    return {
      user: null,
      stats: null,
      connectionStatus: 'none', // none | pending | accepted
      connectionId: null,
      isRequester: false,
      connectionLoading: false,
    }
  },
  computed: {
    currentUser() {
      try { return JSON.parse(localStorage.getItem('susty_user')) || {} } catch { return {} }
    },
    isOwnProfile() {
      return this.currentUser.id === this.user?.id
    },
    joinDate() {
      if (!this.user?.createdAt) return ''
      return new Date(this.user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    },
    connectionBtnClass() {
      if (this.connectionStatus === 'accepted') return 'btn-green'
      if (this.connectionStatus === 'pending') return 'btn-outline'
      return 'btn-primary'
    },
    connectionBtnText() {
      if (this.connectionStatus === 'accepted') return '🌱 Root'
      if (this.connectionStatus === 'pending' && this.isRequester) return '⏳ Pending'
      if (this.connectionStatus === 'pending' && !this.isRequester) return '✓ Accept Root'
      return '🌱 Add Root'
    },
    activityStats() {
      return this.stats?.activity || {}
    },
    badges() {
      const s = this.activityStats
      return [
        { id: 1, icon: '🌱', name: 'Seedling', earned: (s.posts || 0) >= 1 },
        { id: 2, icon: '🌿', name: 'Green Thumb', earned: (s.posts || 0) >= 10 },
        { id: 3, icon: '🛒', name: 'Market Pioneer', earned: (s.marketplaceItems || 0) >= 1 },
        { id: 4, icon: '♻️', name: 'Circular Champ', earned: (s.marketplaceItems || 0) >= 5 },
        { id: 5, icon: '📅', name: 'Event Goer', earned: (s.eventsAttended || 0) >= 3 },
        { id: 6, icon: '🏆', name: 'Challenge Master', earned: (s.challengesCompleted || 0) >= 3 },
        { id: 7, icon: '🎁', name: 'Generous Giver', earned: (s.donations || 0) >= 5 },
        { id: 8, icon: '🌍', name: 'Earth Guardian', earned: parseFloat(this.stats?.impact?.co2Saved || 0) >= 100 }
      ]
    }
  },
  watch: {
    '$route.params.id'() {
      this.loadProfile()
    }
  },
  created() {
    this.loadProfile()
  },
  methods: {
    async loadProfile() {
      const userId = this.$route.params.id
      const [user, stats] = await Promise.all([
        api.getUser(userId),
        api.getPublicStats(userId),
      ])
      this.user = user
      this.stats = stats

      if (!this.isOwnProfile) {
        const status = await api.getConnectionStatus(userId)
        if (status) {
          this.connectionStatus = status.status
          this.connectionId = status.connectionId
          this.isRequester = status.isRequester
        }
      }
    },
    async handleConnection() {
      this.connectionLoading = true
      try {
        if (this.connectionStatus === 'none') {
          const result = await api.sendRootRequest(this.user.id)
          if (result && !result.error) {
            this.connectionStatus = 'pending'
            this.connectionId = result.id
            this.isRequester = true
          }
        } else if (this.connectionStatus === 'pending' && !this.isRequester) {
          const result = await api.acceptRoot(this.connectionId)
          if (result && !result.error) {
            this.connectionStatus = 'accepted'
          }
        } else if (this.connectionStatus === 'pending' && this.isRequester) {
          await api.removeRoot(this.connectionId)
          this.connectionStatus = 'none'
          this.connectionId = null
        } else if (this.connectionStatus === 'accepted') {
          await api.removeRoot(this.connectionId)
          this.connectionStatus = 'none'
          this.connectionId = null
          if (this.stats?.activity) this.stats.activity.roots = Math.max(0, (this.stats.activity.roots || 1) - 1)
        }
      } catch (e) {
        console.error(e)
      }
      this.connectionLoading = false
    },
    goToMessages() {
      this.$router.push({ path: '/messages', query: { userId: this.user.id, userName: this.user.name } })
    }
  }
}
</script>

<style scoped>
.user-profile-page { max-width: 960px; margin: 0 auto; }

.profile-header { padding: 0; overflow: hidden; margin-bottom: 1.25rem; }
.profile-cover { height: 100px; background: var(--text); }
.profile-info { display: flex; align-items: flex-start; gap: 1rem; padding: 0 1.25rem 1.25rem; margin-top: -32px; flex-wrap: wrap; }
.profile-info .avatar-xl { border: 3px solid #fff; }
.profile-details { flex: 1; min-width: 200px; }
.profile-details h1 { margin: 0.375rem 0 0.1rem; font-size: 1.375rem; font-weight: 700; letter-spacing: -0.02em; }
.profile-handle { color: var(--text-secondary); margin: 0 0 0.2rem; font-size: 0.875rem; font-weight: 500; }
.profile-bio { margin: 0 0 0.375rem; font-size: 0.875rem; color: var(--text-secondary); }
.profile-meta { display: flex; gap: 1rem; font-size: 0.75rem; color: var(--text-tertiary); }
.meta-item { display: flex; align-items: center; gap: 0.25rem; }

.profile-actions { display: flex; gap: 0.5rem; flex-shrink: 0; align-self: center; }
.btn-green {
  background: var(--green);
  color: #fff;
  border: 1px solid var(--green);
}
.btn-green:hover { background: var(--green-dark); border-color: var(--green-dark); }
.profile-actions .btn { display: flex; align-items: center; gap: 0.375rem; }

.impact-section, .activity-section, .badges-section { margin-bottom: 1.5rem; }

.badges-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.75rem; }
.badge-card { text-align: center; padding: 0.75rem; transition: opacity 0.15s; }
.badge-card.locked { opacity: 0.35; filter: grayscale(0.8); }
.badge-card.earned { border-color: var(--green); }
.badge-icon-lg { font-size: 1.5rem; display: block; margin-bottom: 0.25rem; }
.badge-name { font-size: 0.75rem; }

.loading-state { text-align: center; padding: 3rem; color: var(--text-tertiary); }

@media (max-width: 768px) {
  .profile-info { flex-direction: column; align-items: center; text-align: center; }
  .profile-meta { justify-content: center; }
  .profile-actions { width: 100%; justify-content: center; }
  .badges-grid { grid-template-columns: repeat(4, 1fr); }
}
</style>
