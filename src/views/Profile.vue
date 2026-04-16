<template>
  <div class="profile-page">
    <!-- Profile Header -->
    <div class="profile-header card">
      <div class="profile-cover"></div>
      <div class="profile-info">
        <div class="avatar avatar-xl">{{ userInitial }}</div>
        <div class="profile-details">
          <h1>{{ userName }}</h1>
          <p class="profile-email">{{ userEmail }}</p>
          <p class="profile-bio">{{ bio }}</p>
          <div class="profile-badges" v-if="earnedBadges.length">
            <span class="badge badge-green" v-for="badge in earnedBadges" :key="badge.id">{{ badge.icon }} {{ badge.name }}</span>
          </div>
        </div>
        <button class="btn btn-outline" @click="editMode = !editMode">{{ editMode ? 'Cancel' : 'Edit' }}</button>
      </div>
    </div>

    <!-- Edit Profile Form -->
    <div v-if="editMode" class="card edit-form">
      <h3 class="form-heading">Edit Profile</h3>
      <div class="form-group">
        <label class="form-label">Display Name</label>
        <input v-model="editName" class="form-input" />
      </div>
      <div class="form-group">
        <label class="form-label">Bio</label>
        <textarea v-model="editBio" class="form-textarea" placeholder="Tell us about your sustainability journey..."></textarea>
      </div>
      <button class="btn btn-primary" @click="saveProfile">Save</button>
    </div>

    <!-- Impact Dashboard -->
    <section class="impact-section">
      <h2 class="section-title">Impact Dashboard</h2>
      <div class="grid-4">
        <div class="card stat-card">
          <div class="stat-value">{{ impact.co2Saved }}</div>
          <div class="stat-label">kg CO₂ Saved</div>
          <div class="progress-bar"><div class="progress-fill" :style="{ width: Math.min(impact.co2Saved / 2, 100) + '%' }"></div></div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ impact.wasteReduced }}</div>
          <div class="stat-label">kg Waste Reduced</div>
          <div class="progress-bar"><div class="progress-fill pf-blue" :style="{ width: Math.min(impact.wasteReduced / 1.5, 100) + '%' }"></div></div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ impact.waterSaved }}</div>
          <div class="stat-label">L Water Conserved</div>
          <div class="progress-bar"><div class="progress-fill pf-cyan" :style="{ width: Math.min(impact.waterSaved / 5, 100) + '%' }"></div></div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ impact.treesEquiv }}</div>
          <div class="stat-label">Trees Equivalent</div>
          <div class="progress-bar"><div class="progress-fill pf-dark" :style="{ width: Math.min(impact.treesEquiv * 10, 100) + '%' }"></div></div>
        </div>
      </div>
    </section>

    <!-- Activity Summary -->
    <section class="activity-section">
      <h2 class="section-title">Activity</h2>
      <div class="grid-3">
        <div class="card stat-card"><div class="stat-value">{{ activityStats.posts }}</div><div class="stat-label">Posts</div></div>
        <div class="card stat-card"><div class="stat-value">{{ activityStats.marketplaceItems }}</div><div class="stat-label">Items Listed</div></div>
        <div class="card stat-card"><div class="stat-value">{{ activityStats.eventsAttended }}</div><div class="stat-label">Events</div></div>
        <div class="card stat-card"><div class="stat-value">{{ activityStats.challengesCompleted }}</div><div class="stat-label">Challenges</div></div>
        <div class="card stat-card"><div class="stat-value">{{ activityStats.donations }}</div><div class="stat-label">Donations</div></div>
        <div class="card stat-card"><div class="stat-value">{{ activityStats.communityPosts }}</div><div class="stat-label">Community</div></div>
      </div>
    </section>

    <!-- Badges -->
    <section class="badges-section">
      <h2 class="section-title">Badges</h2>
      <div class="badges-grid">
        <div v-for="badge in allBadges" :key="badge.id" class="badge-card card" :class="{ earned: badge.earned, locked: !badge.earned }">
          <span class="badge-icon-lg">{{ badge.icon }}</span>
          <strong class="badge-name">{{ badge.name }}</strong>
          <span class="badge-desc">{{ badge.description }}</span>
        </div>
      </div>
    </section>

    <!-- Monthly Impact -->
    <section class="history-section">
      <h2 class="section-title">Monthly Impact</h2>
      <div class="monthly-chart card">
        <div v-for="month in monthlyData" :key="month.label" class="month-col">
          <div class="month-bar-wrap">
            <div class="month-bar" :style="{ height: month.height + '%' }"></div>
          </div>
          <span class="month-label">{{ month.label }}</span>
          <span class="month-value">{{ month.value }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'ProfileView',
  data() {
    return {
      editMode: false,
      editName: '',
      editBio: '',
      bio: '',
      user: null,
      stats: null
    }
  },
  computed: {
    userName() { return this.user?.name || 'User' },
    userEmail() { return this.user?.email || '' },
    userInitial() { return this.userName.charAt(0).toUpperCase() },
    impact() {
      return this.stats?.impact || { co2Saved: '0.0', wasteReduced: '0.0', waterSaved: '0', treesEquiv: '0.0' }
    },
    activityStats() {
      return this.stats?.activity || { posts: 0, marketplaceItems: 0, eventsAttended: 0, challengesCompleted: 0, donations: 0, communityPosts: 0 }
    },
    earnedBadges() { return this.allBadges.filter(b => b.earned) },
    allBadges() {
      const s = this.activityStats
      return [
        { id: 1, icon: '🌱', name: 'Seedling', description: 'Created your first post', earned: s.posts >= 1 },
        { id: 2, icon: '🌿', name: 'Green Thumb', description: '10+ posts', earned: s.posts >= 10 },
        { id: 3, icon: '🛒', name: 'Marketplace Pioneer', description: 'Listed first item', earned: s.marketplaceItems >= 1 },
        { id: 4, icon: '♻️', name: 'Circular Champion', description: '5+ items listed', earned: s.marketplaceItems >= 5 },
        { id: 5, icon: '📅', name: 'Event Goer', description: "RSVP'd to 3+ events", earned: s.eventsAttended >= 3 },
        { id: 6, icon: '🏆', name: 'Challenge Master', description: 'Completed 3+ challenges', earned: s.challengesCompleted >= 3 },
        { id: 7, icon: '🎁', name: 'Generous Giver', description: 'Donated 5+ items', earned: s.donations >= 5 },
        { id: 8, icon: '🌍', name: 'Earth Guardian', description: 'Saved 100+ kg CO₂', earned: parseFloat(this.impact.co2Saved) >= 100 }
      ]
    },
    monthlyData() {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
      const values = [12, 25, 18, 35, 42, 28]
      const max = Math.max(...values)
      return months.map((label, i) => ({ label, value: values[i], height: max > 0 ? (values[i] / max) * 100 : 0 }))
    }
  },
  async created() {
    const [user, stats] = await Promise.all([api.me(), api.getUserStats()])
    this.user = user
    this.stats = stats
    this.bio = user?.bio || 'Sustainability enthusiast'
    this.editName = this.userName
    this.editBio = this.bio
  },
  methods: {
    async saveProfile() {
      const updated = await api.updateUser(this.user.id, { name: this.editName.trim(), bio: this.editBio.trim() })
      if (updated && !updated.error) {
        this.user = updated
        this.bio = updated.bio
        localStorage.setItem('susty_user', JSON.stringify(updated))
      }
      this.editMode = false
    }
  }
}
</script>

<style scoped>
.profile-page { max-width: 960px; margin: 0 auto; }

.profile-header { padding: 0; overflow: hidden; margin-bottom: 1.25rem; }
.profile-cover { height: 100px; background: var(--text); }
.profile-info { display: flex; align-items: flex-start; gap: 1rem; padding: 0 1.25rem 1.25rem; margin-top: -32px; flex-wrap: wrap; }
.profile-info .avatar-xl { border: 3px solid #fff; }
.profile-details { flex: 1; min-width: 200px; }
.profile-details h1 { margin: 0.375rem 0 0.1rem; font-size: 1.375rem; font-weight: 700; letter-spacing: -0.02em; }
.profile-email { color: var(--text-tertiary); margin: 0 0 0.2rem; font-size: 0.8125rem; }
.profile-bio { margin: 0 0 0.375rem; font-size: 0.875rem; color: var(--text-secondary); }
.profile-badges { display: flex; gap: 0.375rem; flex-wrap: wrap; }

.edit-form { margin-bottom: 1.25rem; }
.form-heading { margin: 0 0 0.875rem; font-size: 1rem; font-weight: 600; }

.impact-section, .activity-section, .badges-section, .history-section { margin-bottom: 1.5rem; }

.pf-blue { background: var(--blue) !important; }
.pf-cyan { background: #06b6d4 !important; }
.pf-dark { background: var(--green-dark) !important; }

/* Badges */
.badges-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; }
.badge-card { text-align: center; padding: 1rem; position: relative; transition: opacity 0.15s; }
.badge-card.locked { opacity: 0.4; filter: grayscale(0.8); }
.badge-card.earned { border-color: var(--green); }
.badge-icon-lg { font-size: 1.75rem; display: block; margin-bottom: 0.375rem; }
.badge-name { display: block; font-size: 0.8125rem; margin-bottom: 0.125rem; }
.badge-desc { font-size: 0.6875rem; color: var(--text-tertiary); }

/* Monthly chart */
.monthly-chart { display: flex; align-items: flex-end; gap: 0.75rem; height: 200px; padding: 1rem; }
.month-col { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; }
.month-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
.month-bar { width: 32px; background: var(--green); border-radius: 4px 4px 0 0; transition: height 0.6s ease; min-height: 4px; }
.month-label { font-size: 0.6875rem; color: var(--text-tertiary); margin-top: 0.375rem; }
.month-value { font-size: 0.625rem; font-weight: 600; }

@media (max-width: 768px) {
  .profile-info { flex-direction: column; align-items: center; text-align: center; }
  .monthly-chart { height: 150px; }
  .month-bar { width: 22px; }
  .badges-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
