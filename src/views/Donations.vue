<template>
  <div class="donations">
    <div class="donations-header">
      <div>
        <h1>🎁 Donations & Giving</h1>
        <p class="donations-subtitle">Give away items for free, request what you need, or support sustainability NGOs.</p>
      </div>
      <button class="btn btn-primary btn-lg" @click="showForm = !showForm">
        {{ showForm ? '✕ Cancel' : '+ Donate an Item' }}
      </button>
    </div>

    <!-- Create Donation Form -->
    <div v-if="showForm" class="card donation-form">
      <h3>Donate an Item</h3>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Item Name</label>
          <input v-model="newDonation.name" class="form-input" placeholder="What are you giving away?" />
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select v-model="newDonation.category" class="form-select">
            <option value="">Select category</option>
            <option value="clothing">👕 Clothing</option>
            <option value="furniture">🪑 Furniture</option>
            <option value="electronics">📱 Electronics</option>
            <option value="books">📚 Books</option>
            <option value="kitchen">🍳 Kitchen</option>
            <option value="toys">🧸 Toys</option>
            <option value="other">📦 Other</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Condition</label>
          <select v-model="newDonation.condition" class="form-select">
            <option value="new">New</option>
            <option value="like-new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Location / Pickup</label>
          <input v-model="newDonation.location" class="form-input" placeholder="Where can it be picked up?" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea v-model="newDonation.description" class="form-textarea" placeholder="Describe the item..."></textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="createDonation" :disabled="!canDonate">Publish Donation</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'available' }" @click="tab = 'available'">Available Items</button>
      <button class="tab" :class="{ active: tab === 'requests' }" @click="tab = 'requests'">Requests</button>
      <button class="tab" :class="{ active: tab === 'ngos' }" @click="tab = 'ngos'">Support NGOs</button>
    </div>

    <!-- Available Donations -->
    <div v-if="tab === 'available'" class="donations-grid">
      <div v-if="filteredDonations.length === 0" class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">🎁</div>
        <p>No items available right now. Be the first to donate!</p>
      </div>
      <div v-for="item in filteredDonations" :key="item.id" class="donation-card card">
        <div class="donation-image" :style="{ background: getCatColor(item.category) }">
          <span>{{ getCatIcon(item.category) }}</span>
        </div>
        <div class="donation-info">
          <h3>{{ item.name }}</h3>
          <p class="donation-desc">{{ item.description }}</p>
          <div class="donation-meta">
            <span class="badge badge-green">{{ item.condition }}</span>
            <span>📍 {{ item.location }}</span>
          </div>
          <div class="donation-footer">
            <div class="donation-donor">
              <div class="avatar avatar-sm">{{ donorName(item.donor).charAt(0).toUpperCase() }}</div>
              <span>{{ donorName(item.donor) }}</span>
            </div>
            <button
              v-if="!item.claimed"
              class="btn btn-primary btn-sm"
              @click="claimItem(item)"
            >Claim Item</button>
            <span v-else class="claimed-badge badge badge-blue">Claimed</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Requests -->
    <div v-if="tab === 'requests'" class="requests-section">
      <div class="card request-form-inline">
        <h3>Request an Item</h3>
        <div class="request-form-row">
          <input v-model="newRequest.name" class="form-input" placeholder="What do you need?" />
          <input v-model="newRequest.location" class="form-input" placeholder="Your location" />
          <button class="btn btn-primary" @click="createRequest" :disabled="!newRequest.name.trim()">Post Request</button>
        </div>
      </div>
      <div class="requests-list">
        <div v-if="requests.length === 0" class="empty-state">
          <div class="empty-state-icon">🙋</div>
          <p>No requests yet. Need something? Post a request above!</p>
        </div>
        <div v-for="req in requests" :key="req.id" class="request-card card">
          <div class="request-header">
            <div class="avatar avatar-sm">{{ donorName(req.requester).charAt(0).toUpperCase() }}</div>
            <div>
              <strong>{{ donorName(req.requester) }}</strong>
              <span class="request-time">{{ timeAgo(req.createdAt || req.date) }}</span>
            </div>
          </div>
          <p class="request-content">Looking for: <strong>{{ req.name }}</strong></p>
          <span class="request-location" v-if="req.location">📍 {{ req.location }}</span>
          <button
            v-if="!req.fulfilled"
            class="btn btn-outline btn-sm"
            @click="fulfillRequest(req)"
          >I Have This!</button>
          <span v-else class="badge badge-green">✅ Fulfilled</span>
        </div>
      </div>
    </div>

    <!-- NGOs -->
    <div v-if="tab === 'ngos'" class="ngos-grid">
      <div v-for="ngo in ngos" :key="ngo.id" class="ngo-card card">
        <div class="ngo-icon">{{ ngo.icon }}</div>
        <h3>{{ ngo.name }}</h3>
        <p class="ngo-desc">{{ ngo.description }}</p>
        <div class="ngo-focus">
          <span class="badge badge-green" v-for="focus in ngo.focus" :key="focus">{{ focus }}</span>
        </div>
        <div class="ngo-stats">
          <span>👥 {{ ngo.supporters }} supporters</span>
          <span>🌍 {{ ngo.impact }}</span>
        </div>
        <button class="btn btn-primary btn-sm" @click="supportNgo(ngo)">Support</button>
      </div>
    </div>

    <!-- Impact Summary -->
    <section class="donations-impact card">
      <h3>🌍 Community Donation Impact</h3>
      <div class="impact-stats">
        <div class="impact-stat">
          <span class="stat-value">{{ totalDonated }}</span>
          <span class="stat-label">Items Donated</span>
        </div>
        <div class="impact-stat">
          <span class="stat-value">{{ totalClaimed }}</span>
          <span class="stat-label">Items Claimed</span>
        </div>
        <div class="impact-stat">
          <span class="stat-value">{{ totalRequests }}</span>
          <span class="stat-label">Requests Made</span>
        </div>
        <div class="impact-stat">
          <span class="stat-value">{{ co2Saved }}</span>
          <span class="stat-label">kg CO₂ Saved</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'DonationsView',
  data() {
    return {
      showForm: false,
      tab: 'available',
      donations: [],
      requests: [],
      stats: { donations: 0, claimed: 0, requests: 0, fulfilled: 0 },
      newDonation: {
        name: '',
        category: '',
        condition: 'good',
        location: '',
        description: ''
      },
      newRequest: { name: '', location: '' },
      ngos: [
        { id: 1, name: 'Ocean Conservancy', icon: '🌊', description: 'Protecting the ocean from today\'s greatest challenges.', focus: ['Ocean', 'Wildlife'], supporters: 1240, impact: '500K lbs trash removed' },
        { id: 2, name: 'Trees for the Future', icon: '🌳', description: 'Planting trees to restore degraded lands and fight poverty.', focus: ['Reforestation', 'Agriculture'], supporters: 890, impact: '250M trees planted' },
        { id: 3, name: 'Zero Waste Alliance', icon: '♻️', description: 'Advancing zero waste strategies for communities and businesses.', focus: ['Zero Waste', 'Education'], supporters: 650, impact: '1M tons waste diverted' },
        { id: 4, name: 'Clean Air Fund', icon: '💨', description: 'Tackling air pollution through philanthropy, data, and advocacy.', focus: ['Air Quality', 'Health'], supporters: 430, impact: '50 cities improved' },
        { id: 5, name: 'Repair Café International', icon: '🔧', description: 'Growing the global network of free repair events.', focus: ['Repair', 'Community'], supporters: 780, impact: '2,500+ cafés worldwide' },
        { id: 6, name: 'Greenpeace', icon: '🌍', description: 'Campaigning for a green and peaceful future.', focus: ['Climate', 'Activism'], supporters: 3200, impact: 'Global campaigns' }
      ]
    }
  },
  computed: {
    currentUser() {
      try { return JSON.parse(localStorage.getItem('susty_user')) || {} } catch { return {} }
    },
    currentUserName() {
      return this.currentUser.name || this.currentUser.email || 'User'
    },
    canDonate() {
      return this.newDonation.name.trim() && this.newDonation.category && this.newDonation.description.trim()
    },
    filteredDonations() {
      return this.donations.filter(d => !d.claimed)
    },
    totalDonated() { return this.stats.donations || this.donations.length },
    totalClaimed() { return this.stats.claimed || this.donations.filter(d => d.claimed).length },
    totalRequests() { return this.stats.requests || this.requests.length },
    co2Saved() { return ((this.stats.donations || this.donations.length) * 5).toFixed(1) }
  },
  created() {
    this.loadDonations()
    this.loadRequests()
    this.loadStats()
  },
  methods: {
    donorName(obj) {
      if (!obj) return 'Anonymous'
      return typeof obj === 'object' ? obj.name : obj
    },
    getCatIcon(cat) {
      const icons = { clothing: '👕', furniture: '🪑', electronics: '📱', books: '📚', kitchen: '🍳', toys: '🧸', other: '📦' }
      return icons[cat] || '📦'
    },
    getCatColor(cat) {
      const colors = {
        clothing: 'linear-gradient(135deg, #CE93D8, #AB47BC)',
        furniture: 'linear-gradient(135deg, #A5D6A7, #66BB6A)',
        electronics: 'linear-gradient(135deg, #90CAF9, #42A5F5)',
        books: 'linear-gradient(135deg, #B39DDB, #7E57C2)',
        kitchen: 'linear-gradient(135deg, #EF9A9A, #EF5350)',
        toys: 'linear-gradient(135deg, #FFE082, #FFD54F)',
        other: 'linear-gradient(135deg, #E0E0E0, #BDBDBD)'
      }
      return colors[cat] || colors.other
    },
    timeAgo(dateStr) {
      const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
      if (diff < 60) return 'just now'
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
      return Math.floor(diff / 86400) + 'd ago'
    },
    async createDonation() {
      if (!this.canDonate) return
      const data = {
        name: this.newDonation.name.trim(),
        category: this.newDonation.category,
        condition: this.newDonation.condition,
        description: this.newDonation.description.trim()
      }
      const donation = await api.createDonation(data)
      if (donation) this.donations.unshift(donation)
      this.showForm = false
      this.newDonation = { name: '', category: '', condition: 'good', location: '', description: '' }
    },
    async claimItem(item) {
      const updated = await api.claimDonation(item.id)
      if (updated) {
        item.claimed = true
      }
    },
    async createRequest() {
      if (!this.newRequest.name.trim()) return
      const data = {
        name: this.newRequest.name.trim(),
        category: 'other',
        reason: this.newRequest.location.trim() || ''
      }
      const req = await api.createDonationRequest(data)
      if (req) this.requests.unshift(req)
      this.newRequest = { name: '', location: '' }
    },
    async fulfillRequest(req) {
      const updated = await api.fulfillRequest(req.id)
      if (updated) {
        req.fulfilled = true
      }
    },
    supportNgo(ngo) {
      ngo.supporters++
    },
    async loadDonations() {
      const data = await api.getDonations()
      if (data) this.donations = data
    },
    async loadRequests() {
      const data = await api.getDonationRequests()
      if (data) this.requests = data
    },
    async loadStats() {
      const data = await api.getDonationStats()
      if (data) this.stats = data
    }
  }
}
</script>

<style scoped>
.donations-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}
.donations-header h1 { margin: 0 0 0.25rem; font-size: 1.8rem; }
.donations-subtitle { color: var(--muted-text); margin: 0; }

.donation-form { margin-bottom: 1.5rem; }
.donation-form h3 { margin-top: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-actions { display: flex; justify-content: flex-end; }

.donations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}
.donation-card { padding: 0; overflow: hidden; }
.donation-image {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}
.donation-info { padding: 1rem 1.25rem; }
.donation-info h3 { margin: 0 0 0.35rem; font-size: 1rem; }
.donation-desc { font-size: 0.85rem; color: var(--muted-text); margin: 0 0 0.5rem; line-height: 1.4; }
.donation-meta { display: flex; gap: 0.75rem; align-items: center; font-size: 0.8rem; color: var(--muted-text); margin-bottom: 0.75rem; }
.donation-footer { display: flex; justify-content: space-between; align-items: center; }
.donation-donor { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
.claimed-badge { font-size: 0.8rem; }

.request-form-inline { margin-bottom: 1.5rem; }
.request-form-inline h3 { margin-top: 0; margin-bottom: 0.75rem; }
.request-form-row { display: flex; gap: 0.75rem; }
.request-form-row .form-input { flex: 1; }

.requests-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
.request-card { display: flex; flex-direction: column; gap: 0.5rem; }
.request-header { display: flex; align-items: center; gap: 0.5rem; }
.request-time { font-size: 0.75rem; color: var(--muted-text); margin-left: 0.5rem; }
.request-content { margin: 0; }
.request-location { font-size: 0.8rem; color: var(--muted-text); }

.ngos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}
.ngo-card { text-align: center; }
.ngo-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
.ngo-card h3 { margin: 0 0 0.35rem; }
.ngo-desc { font-size: 0.85rem; color: var(--muted-text); margin: 0 0 0.75rem; }
.ngo-focus { display: flex; gap: 0.35rem; justify-content: center; margin-bottom: 0.5rem; flex-wrap: wrap; }
.ngo-stats { font-size: 0.8rem; color: var(--muted-text); display: flex; gap: 1rem; justify-content: center; margin-bottom: 0.75rem; }

.donations-impact { margin-top: 2rem; }
.donations-impact h3 { margin-top: 0; }
.impact-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.impact-stat { text-align: center; }

@media (max-width: 768px) {
  .donations-header { flex-direction: column; gap: 1rem; }
  .form-row { grid-template-columns: 1fr; }
  .donations-grid { grid-template-columns: 1fr; }
  .ngos-grid { grid-template-columns: 1fr; }
  .request-form-row { flex-direction: column; }
  .impact-stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
