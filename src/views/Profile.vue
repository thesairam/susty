<template>
  <div class="profile">
    <!-- Profile Header -->
    <div class="profile-header card">
      <div class="profile-cover" :style="{ background: coverGradient }"></div>
      <div class="profile-info">
        <div class="avatar avatar-xl">{{ userInitial }}</div>
        <div class="profile-details">
          <h1>{{ userName }}</h1>
          <p class="profile-email">{{ userEmail }}</p>
          <p class="profile-bio">{{ bio }}</p>
          <div class="profile-badges">
            <span class="badge badge-green" v-for="badge in earnedBadges" :key="badge.id">{{ badge.icon }} {{ badge.name }}</span>
          </div>
        </div>
        <button class="btn btn-outline" @click="editMode = !editMode">{{ editMode ? 'Cancel' : '✏️ Edit Profile' }}</button>
      </div>
    </div>

    <!-- Edit Profile Form -->
    <div v-if="editMode" class="card edit-form">
      <h3>Edit Profile</h3>
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
      <h2 class="section-title">🌍 Your Impact Dashboard</h2>
      <div class="grid-4">
        <div class="card stat-card">
          <div class="stat-icon">🌿</div>
          <div class="stat-value">{{ impact.co2Saved }}</div>
          <div class="stat-label">kg CO₂ Saved</div>
          <div class="stat-bar"><div class="stat-fill" :style="{ width: Math.min(impact.co2Saved / 2, 100) + '%' }"></div></div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon">♻️</div>
          <div class="stat-value">{{ impact.wasteReduced }}</div>
          <div class="stat-label">kg Waste Reduced</div>
          <div class="stat-bar"><div class="stat-fill blue" :style="{ width: Math.min(impact.wasteReduced / 1.5, 100) + '%' }"></div></div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon">💧</div>
          <div class="stat-value">{{ impact.waterSaved }}</div>
          <div class="stat-label">L Water Conserved</div>
          <div class="stat-bar"><div class="stat-fill cyan" :style="{ width: Math.min(impact.waterSaved / 5, 100) + '%' }"></div></div>
        </div>
        <div class="card stat-card">
          <div class="stat-icon">🌳</div>
          <div class="stat-value">{{ impact.treesEquiv }}</div>
          <div class="stat-label">Trees Equivalent</div>
          <div class="stat-bar"><div class="stat-fill green" :style="{ width: Math.min(impact.treesEquiv * 10, 100) + '%' }"></div></div>
        </div>
      </div>
    </section>

    <!-- Activity Summary -->
    <section class="activity-section">
      <h2 class="section-title">📊 Activity Summary</h2>
      <div class="grid-3">
        <div class="card stat-card">
          <div class="stat-value">{{ activityStats.posts }}</div>
          <div class="stat-label">Posts Created</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ activityStats.marketplaceItems }}</div>
          <div class="stat-label">Items Listed</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ activityStats.eventsAttended }}</div>
          <div class="stat-label">Events RSVP'd</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ activityStats.challengesCompleted }}</div>
          <div class="stat-label">Challenges Done</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ activityStats.donations }}</div>
          <div class="stat-label">Items Donated</div>
        </div>
        <div class="card stat-card">
          <div class="stat-value">{{ activityStats.communityPosts }}</div>
          <div class="stat-label">Community Posts</div>
        </div>
      </div>
    </section>

    <!-- Badges & Achievements -->
    <section class="badges-section">
      <h2 class="section-title">🏅 Badges & Achievements</h2>
      <div class="badges-grid">
        <div
          v-for="badge in allBadges"
          :key="badge.id"
          class="badge-card card"
          :class="{ earned: badge.earned, locked: !badge.earned }"
        >
          <span class="badge-icon">{{ badge.icon }}</span>
          <strong class="badge-name">{{ badge.name }}</strong>
          <span class="badge-desc">{{ badge.description }}</span>
          <span v-if="!badge.earned" class="badge-lock">🔒</span>
        </div>
      </div>
    </section>

    <!-- Impact History / Monthly Breakdown -->
    <section class="history-section">
      <h2 class="section-title">📈 Monthly Impact</h2>
      <div class="monthly-chart">
        <div v-for="month in monthlyData" :key="month.label" class="month-bar-group">
          <div class="month-bar-container">
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
    userName() {
      return this.user?.name || 'User'
    },
    userEmail() {
      return this.user?.email || ''
    },
    userInitial() {
      return this.userName.charAt(0).toUpperCase()
    },
    coverGradient() {
      return 'linear-gradient(135deg, var(--primary-green), var(--primary-blue))'
    },
    impact() {
      return this.stats?.impact || { co2Saved: '0.0', wasteReduced: '0.0', waterSaved: '0', treesEquiv: '0.0' }
    },
    activityStats() {
      return this.stats?.activity || { posts: 0, marketplaceItems: 0, eventsAttended: 0, challengesCompleted: 0, donations: 0, communityPosts: 0 }
    },
    earnedBadges() {
      return this.allBadges.filter(b => b.earned)
    },
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
      return months.map((label, i) => ({
        label,
        value: values[i],
        height: max > 0 ? (values[i] / max) * 100 : 0
      }))
    }
  },
  async created() {
    const [user, stats] = await Promise.all([api.me(), api.getUserStats()])
    this.user = user
    this.stats = stats
    this.bio = user?.bio || 'Sustainability enthusiast 🌍'
    this.editName = this.userName
    this.editBio = this.bio
  },
  methods: {
    async saveProfile() {
      const updated = await api.updateUser(this.user.id, {
        name: this.editName.trim(),
        bio: this.editBio.trim()
      })
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
.profile-header { padding: 0; overflow: hidden; margin-bottom: 2rem; }
.profile-cover { height: 120px; }
.profile-info { display: flex; align-items: flex-start; gap: 1.25rem; padding: 0 1.5rem 1.5rem; margin-top: -40px; flex-wrap: wrap; }
.profile-info .avatar-xl { border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
.profile-details { flex: 1; min-width: 200px; }
.profile-details h1 { margin: 0.5rem 0 0.1rem; font-size: 1.5rem; }
.profile-email { color: var(--muted-text); margin: 0 0 0.25rem; font-size: 0.85rem; }
.profile-bio { margin: 0 0 0.5rem; }
.profile-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.edit-form { margin-bottom: 2rem; }
.edit-form h3 { margin-top: 0; }

.impact-section, .activity-section, .badges-section, .history-section { margin-bottom: 2rem; }

.stat-icon { font-size: 1.5rem; margin-bottom: 0.25rem; }
.stat-bar { height: 6px; background: var(--border-color); border-radius: 3px; margin-top: 0.5rem; overflow: hidden; }
.stat-fill { height: 100%; border-radius: 3px; background: var(--primary-green); transition: width 0.8s ease; }
.stat-fill.blue { background: var(--primary-blue); }
.stat-fill.cyan { background: #00bcd4; }
.stat-fill.green { background: var(--dark-green); }

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}
.badge-card {
  text-align: center;
  padding: 1.25rem;
  position: relative;
  transition: all var(--transition);
}
.badge-card.locked { opacity: 0.5; filter: grayscale(0.8); }
.badge-card.earned { border: 2px solid var(--primary-green); }
.badge-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
.badge-name { display: block; margin-bottom: 0.25rem; font-size: 0.9rem; }
.badge-desc { font-size: 0.75rem; color: var(--muted-text); }
.badge-lock { position: absolute; top: 0.5rem; right: 0.5rem; }

.monthly-chart {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  height: 200px;
  padding: 1rem;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--card-shadow);
}
.month-bar-group { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; }
.month-bar-container { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
.month-bar { width: 40px; background: linear-gradient(to top, var(--primary-green), var(--primary-blue)); border-radius: 4px 4px 0 0; transition: height 0.8s ease; min-height: 4px; }
.month-label { font-size: 0.75rem; color: var(--muted-text); margin-top: 0.5rem; }
.month-value { font-size: 0.7rem; font-weight: 600; color: var(--dark-text); }

@media (max-width: 768px) {
  .profile-info { flex-direction: column; align-items: center; text-align: center; }
  .monthly-chart { height: 150px; }
  .month-bar { width: 24px; }
  .badges-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
