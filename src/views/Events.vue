<template>
  <div class="events">
    <!-- Header -->
    <div class="events-header">
      <div>
        <h1>📅 Sustainability Events</h1>
        <p class="events-subtitle">Discover and join events making a real-world impact.</p>
      </div>
      <button class="btn btn-primary btn-lg" @click="showCreateForm = !showCreateForm">
        {{ showCreateForm ? '✕ Cancel' : '+ Create Event' }}
      </button>
    </div>

    <!-- Create Event Form -->
    <div v-if="showCreateForm" class="card event-form">
      <h3>Create a New Event</h3>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Event Name</label>
          <input v-model="newEvent.name" class="form-input" placeholder="Give your event a name" />
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select v-model="newEvent.category" class="form-select">
            <option value="">Select category</option>
            <option v-for="cat in eventCategories" :key="cat.id" :value="cat.id">{{ cat.icon }} {{ cat.name }}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Date</label>
          <input v-model="newEvent.date" type="date" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Time</label>
          <input v-model="newEvent.time" type="time" class="form-input" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Location</label>
          <input v-model="newEvent.location" class="form-input" placeholder="Where will it take place?" />
        </div>
        <div class="form-group">
          <label class="form-label">Ticket Type</label>
          <select v-model="newEvent.ticketType" class="form-select">
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>
      <div class="form-group" v-if="newEvent.ticketType === 'paid'">
        <label class="form-label">Ticket Price ($)</label>
        <input v-model.number="newEvent.price" type="number" min="0" step="0.01" class="form-input" />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea v-model="newEvent.description" class="form-textarea" placeholder="What's this event about? What should attendees expect?"></textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="createEvent" :disabled="!canCreate">Create Event</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="tabs">
      <button class="tab" :class="{ active: viewMode === 'upcoming' }" @click="viewMode = 'upcoming'">Upcoming</button>
      <button class="tab" :class="{ active: viewMode === 'past' }" @click="viewMode = 'past'">Past</button>
      <button class="tab" :class="{ active: viewMode === 'my' }" @click="viewMode = 'my'">My Events</button>
    </div>

    <div class="filter-chips">
      <button class="chip" :class="{ active: catFilter === '' }" @click="catFilter = ''">All</button>
      <button
        v-for="cat in eventCategories"
        :key="cat.id"
        class="chip"
        :class="{ active: catFilter === cat.id }"
        @click="catFilter = cat.id"
      >{{ cat.icon }} {{ cat.name }}</button>
    </div>

    <!-- Events Grid -->
    <div class="events-grid">
      <div v-if="filteredEvents.length === 0" class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">📅</div>
        <p>No events found. Be the first to create one!</p>
      </div>

      <div v-for="event in filteredEvents" :key="event.id" class="event-card card">
        <div class="event-date-badge" :style="{ background: getCatColor(event.category) }">
          <span class="edb-month">{{ formatMonth(event.date) }}</span>
          <span class="edb-day">{{ formatDay(event.date) }}</span>
        </div>
        <div class="event-body">
          <div class="event-cat-badge">
            <span class="badge badge-green">{{ getCatIcon(event.category) }} {{ getCatName(event.category) }}</span>
            <span v-if="event.ticketType === 'free'" class="badge badge-blue">Free</span>
            <span v-else class="badge badge-orange">${{ event.price }}</span>
          </div>
          <h3 class="event-name">{{ event.name }}</h3>
          <p class="event-desc">{{ event.description }}</p>
          <div class="event-meta">
            <span>📍 {{ event.location }}</span>
            <span>🕐 {{ event.time }}</span>
          </div>
          <div class="event-footer">
            <div class="event-attendees">
              <span>👥 {{ event.rsvps || 0 }} attending</span>
            </div>
            <button
              v-if="!event.rsvped"
              class="btn btn-primary btn-sm"
              @click="rsvp(event)"
            >RSVP</button>
            <button
              v-else
              class="btn btn-outline btn-sm"
              @click="cancelRsvp(event)"
            >✓ Going</button>
          </div>
          <div class="event-organizer">
            <span class="organizer-label">Organized by</span>
            <strong>{{ event.organizer }}</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'EventsView',
  data() {
    return {
      showCreateForm: false,
      viewMode: 'upcoming',
      catFilter: '',
      events: [],
      newEvent: {
        name: '',
        category: '',
        date: '',
        time: '',
        location: '',
        ticketType: 'free',
        price: 0,
        description: ''
      },
      eventCategories: [
        { id: 'cleanup', name: 'Cleanups', icon: '🧹' },
        { id: 'march', name: 'Climate Marches', icon: '✊' },
        { id: 'workshop', name: 'Workshops', icon: '🛠️' },
        { id: 'repair', name: 'Repair Cafés', icon: '🔧' },
        { id: 'planting', name: 'Tree Planting', icon: '🌳' },
        { id: 'market', name: 'Eco Markets', icon: '🏪' },
        { id: 'talk', name: 'Talks & Panels', icon: '🎤' }
      ]
    }
  },
  computed: {
    currentUser() {
      try { return JSON.parse(localStorage.getItem('susty_user')) || {} } catch { return {} }
    },
    canCreate() {
      return this.newEvent.name.trim() && this.newEvent.category && this.newEvent.date && this.newEvent.location.trim()
    },
    filteredEvents() {
      let result = [...this.events]
      if (this.viewMode === 'my') {
        result = result.filter(e => e._isCreator || e._rsvped)
      }
      if (this.catFilter) {
        result = result.filter(e => e.category === this.catFilter)
      }
      result.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      return result
    }
  },
  created() {
    this.loadEvents()
  },
  methods: {
    normalizeEvent(e) {
      const userId = this.currentUser.id
      const rsvpArr = Array.isArray(e.rsvps) ? e.rsvps : []
      return {
        ...e,
        name: e.title || e.name,
        organizer: e.creator ? (typeof e.creator === 'object' ? e.creator.name : e.creator) : (e.organizer || 'Anonymous'),
        rsvps: rsvpArr.length,
        _rsvpArr: rsvpArr,
        rsvped: rsvpArr.some(r => r.userId === userId || (r.user && r.user.id === userId)),
        _isCreator: e.creatorId === userId || (e.creator && e.creator.id === userId)
      }
    },
    getCatIcon(id) {
      const cat = this.eventCategories.find(c => c.id === id)
      return cat ? cat.icon : '📅'
    },
    getCatName(id) {
      const cat = this.eventCategories.find(c => c.id === id)
      return cat ? cat.name : 'Event'
    },
    getCatColor(id) {
      const colors = {
        cleanup: 'linear-gradient(135deg, #4CAF50, #66BB6A)',
        march: 'linear-gradient(135deg, #e53935, #ef5350)',
        workshop: 'linear-gradient(135deg, #FF9800, #FFB74D)',
        repair: 'linear-gradient(135deg, #795548, #a1887f)',
        planting: 'linear-gradient(135deg, #2E7D32, #43A047)',
        market: 'linear-gradient(135deg, #7B1FA2, #AB47BC)',
        talk: 'linear-gradient(135deg, #1565C0, #42A5F5)'
      }
      return colors[id] || 'linear-gradient(135deg, #607D8B, #90A4AE)'
    },
    formatMonth(dateStr) {
      if (!dateStr) return ''
      const d = new Date(dateStr + 'T00:00:00')
      return d.toLocaleString('en', { month: 'short' }).toUpperCase()
    },
    formatDay(dateStr) {
      if (!dateStr) return ''
      const d = new Date(dateStr + 'T00:00:00')
      return d.getDate()
    },
    async createEvent() {
      if (!this.canCreate) return
      const data = {
        title: this.newEvent.name.trim(),
        category: this.newEvent.category,
        date: this.newEvent.date,
        time: this.newEvent.time || '10:00',
        location: this.newEvent.location.trim(),
        ticketType: this.newEvent.ticketType,
        description: this.newEvent.description.trim()
      }
      const event = await api.createEvent(data)
      if (event) this.events.push(this.normalizeEvent(event))
      this.showCreateForm = false
      this.newEvent = { name: '', category: '', date: '', time: '', location: '', ticketType: 'free', price: 0, description: '' }
    },
    async rsvp(event) {
      const result = await api.rsvpEvent(event.id)
      if (result) {
        const idx = this.events.findIndex(e => e.id === event.id)
        if (idx >= 0) this.events.splice(idx, 1, this.normalizeEvent(result))
      }
    },
    async cancelRsvp(event) {
      const result = await api.cancelRsvp(event.id)
      if (result) {
        const idx = this.events.findIndex(e => e.id === event.id)
        if (idx >= 0) this.events.splice(idx, 1, this.normalizeEvent(result))
      }
    },
    async loadEvents() {
      const view = this.viewMode === 'my' ? 'all' : this.viewMode
      const data = await api.getEvents({ view })
      if (data) this.events = data.map(e => this.normalizeEvent(e))
    }
  },
  watch: {
    viewMode() {
      this.loadEvents()
    }
  }
}
</script>

<style scoped>
.events-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}
.events-header h1 { margin: 0 0 0.25rem; font-size: 1.8rem; }
.events-subtitle { color: var(--muted-text); margin: 0; }

.event-form { margin-bottom: 1.5rem; }
.event-form h3 { margin-top: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-actions { display: flex; justify-content: flex-end; margin-top: 0.5rem; }

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.chip {
  padding: 0.35rem 0.85rem;
  border: 2px solid var(--border-color);
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all var(--transition);
  white-space: nowrap;
}
.chip:hover { border-color: var(--primary-green); color: var(--primary-green); }
.chip.active { background: var(--primary-green); color: white; border-color: var(--primary-green); }

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.25rem;
}

.event-card {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: row;
}
.event-date-badge {
  width: 80px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.edb-month { font-size: 0.75rem; font-weight: 600; letter-spacing: 1px; }
.edb-day { font-size: 1.8rem; font-weight: 800; line-height: 1; }

.event-body { padding: 1rem 1.25rem; flex: 1; }
.event-cat-badge { display: flex; gap: 0.35rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
.event-name { margin: 0 0 0.35rem; font-size: 1.05rem; }
.event-desc {
  color: var(--muted-text);
  font-size: 0.85rem;
  margin: 0 0 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.event-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--muted-text);
  margin-bottom: 0.75rem;
}
.event-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.event-attendees { font-size: 0.85rem; color: var(--muted-text); }
.event-organizer { font-size: 0.8rem; color: var(--muted-text); }
.organizer-label { margin-right: 0.25rem; }

@media (max-width: 768px) {
  .events-header { flex-direction: column; gap: 1rem; }
  .form-row { grid-template-columns: 1fr; }
  .events-grid { grid-template-columns: 1fr; }
  .event-card { flex-direction: column; }
  .event-date-badge { width: 100%; min-height: auto; flex-direction: row; gap: 0.5rem; padding: 0.75rem; }
}
</style>
