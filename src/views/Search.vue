<template>
  <div class="search-page">
    <h1 class="page-title">Search</h1>

    <!-- Search Bar -->
    <div class="search-bar card">
      <div class="search-input-wrap">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="query"
          class="form-input search-field"
          placeholder="Search people, posts, events, marketplace..."
          @input="onInput"
          ref="searchInput"
        />
        <button v-if="query" class="clear-btn" @click="clearSearch">✕</button>
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="tabs">
      <button v-for="tab in tabs" :key="tab.key" class="tab" :class="{ active: activeTab === tab.key }" @click="switchTab(tab.key)">
        {{ tab.label }}
        <span v-if="getCounts(tab.key) > 0" class="tab-count">{{ getCounts(tab.key) }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <p>Searching...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!query.trim()" class="empty-state card">
      <p>Start typing to search across susty</p>
    </div>

    <div v-else-if="noResults" class="empty-state card">
      <p>No results found for "{{ query }}"</p>
    </div>

    <!-- Results -->
    <div v-else class="results">

      <!-- People -->
      <template v-if="showSection('people')">
        <h2 v-if="activeTab === 'all'" class="section-title">People</h2>
        <div class="results-grid">
          <router-link v-for="user in results.users" :key="user.id" :to="`/user/${user.id}`" class="result-card card">
            <div class="avatar">{{ user.name?.charAt(0).toUpperCase() }}</div>
            <div class="result-info">
              <strong>{{ user.name }}</strong>
              <p v-if="user.username" class="result-handle">@{{ user.username }}</p>
              <p v-if="user.bio" class="result-sub">{{ user.bio }}</p>
            </div>
          </router-link>
        </div>
      </template>

      <!-- Posts -->
      <template v-if="showSection('posts')">
        <h2 v-if="activeTab === 'all'" class="section-title">Posts</h2>
        <div class="results-list">
          <div v-for="post in results.posts" :key="post.id" class="result-card card" @click="$router.push('/')">
            <div class="result-meta">
              <router-link v-if="post.author" :to="`/user/${post.author.id}`" class="author-link" @click.stop>
                <div class="avatar avatar-sm">{{ post.author.name?.charAt(0).toUpperCase() }}</div>
                <span>{{ post.author.name }}</span>
              </router-link>
              <span class="result-time">{{ timeAgo(post.createdAt) }}</span>
            </div>
            <p class="result-content">{{ post.content }}</p>
            <div class="result-stats">
              <span>♥ {{ post.likes }}</span>
              <span>💬 {{ post.replies?.length || 0 }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Events -->
      <template v-if="showSection('events')">
        <h2 v-if="activeTab === 'all'" class="section-title">Events</h2>
        <div class="results-list">
          <div v-for="event in results.events" :key="event.id" class="result-card card" @click="$router.push('/events')">
            <div class="event-header">
              <span class="event-category badge badge-green">{{ event.category }}</span>
              <span class="result-time">{{ formatDate(event.date) }}</span>
            </div>
            <strong class="result-title">{{ event.title }}</strong>
            <p class="result-content">{{ event.description }}</p>
            <p class="result-location" v-if="event.location">📍 {{ event.location }}</p>
          </div>
        </div>
      </template>

      <!-- Marketplace -->
      <template v-if="showSection('marketplace')">
        <h2 v-if="activeTab === 'all'" class="section-title">Marketplace</h2>
        <div class="results-grid">
          <div v-for="listing in results.listings" :key="listing.id" class="result-card card" @click="$router.push('/marketplace')">
            <div class="listing-top">
              <strong>{{ listing.name }}</strong>
              <span class="listing-price">€{{ listing.price }}</span>
            </div>
            <p class="result-content">{{ listing.description }}</p>
            <div class="result-meta">
              <span class="badge badge-green">{{ listing.category }}</span>
              <span class="badge">{{ listing.condition }}</span>
              <span v-if="listing.carbonSaved > 0" class="carbon-badge">🌿 {{ listing.carbonSaved }}kg CO₂</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Community -->
      <template v-if="showSection('community')">
        <h2 v-if="activeTab === 'all'" class="section-title">Community</h2>
        <div class="results-list">
          <div v-for="cp in results.community" :key="cp.id" class="result-card card" @click="$router.push('/community')">
            <div class="result-meta">
              <router-link v-if="cp.author" :to="`/user/${cp.author.id}`" class="author-link" @click.stop>
                <div class="avatar avatar-sm">{{ cp.author.name?.charAt(0).toUpperCase() }}</div>
                <span>{{ cp.author.name }}</span>
              </router-link>
            </div>
            <strong v-if="cp.title" class="result-title">{{ cp.title }}</strong>
            <p class="result-content">{{ cp.content }}</p>
          </div>
        </div>
      </template>

      <!-- Articles -->
      <template v-if="showSection('articles')">
        <h2 v-if="activeTab === 'all'" class="section-title">Knowledge</h2>
        <div class="results-list">
          <div v-for="article in results.articles" :key="article.id" class="result-card card" @click="$router.push('/knowledge')">
            <span class="badge badge-green">{{ article.category }}</span>
            <strong class="result-title">{{ article.title }}</strong>
            <p class="result-content">{{ truncate(article.content, 150) }}</p>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'SearchView',
  data() {
    return {
      query: '',
      activeTab: 'all',
      results: { users: [], posts: [], events: [], listings: [], community: [], articles: [] },
      loading: false,
      searchTimeout: null,
      tabs: [
        { key: 'all', label: 'All' },
        { key: 'people', label: 'People' },
        { key: 'posts', label: 'Posts' },
        { key: 'events', label: 'Events' },
        { key: 'marketplace', label: 'Marketplace' },
        { key: 'community', label: 'Community' },
        { key: 'articles', label: 'Knowledge' }
      ]
    }
  },
  computed: {
    noResults() {
      if (!this.query.trim()) return false
      const r = this.results
      return !r.users.length && !r.posts.length && !r.events.length && !r.listings.length && !r.community.length && !r.articles.length
    }
  },
  mounted() {
    this.$refs.searchInput?.focus()
  },
  methods: {
    onInput() {
      clearTimeout(this.searchTimeout)
      if (!this.query.trim() || this.query.trim().length < 2) {
        this.results = { users: [], posts: [], events: [], listings: [], community: [], articles: [] }
        return
      }
      this.searchTimeout = setTimeout(() => this.doSearch(), 300)
    },
    async doSearch() {
      this.loading = true
      const type = this.activeTab === 'all' ? null : this.activeTab
      const data = await api.search(this.query.trim(), type)
      if (data) this.results = data
      this.loading = false
    },
    switchTab(key) {
      this.activeTab = key
      if (this.query.trim().length >= 2) this.doSearch()
    },
    clearSearch() {
      this.query = ''
      this.results = { users: [], posts: [], events: [], listings: [], community: [], articles: [] }
      this.$refs.searchInput?.focus()
    },
    getCounts(key) {
      if (key === 'all') {
        const r = this.results
        return r.users.length + r.posts.length + r.events.length + r.listings.length + r.community.length + r.articles.length
      }
      const map = { people: 'users', posts: 'posts', events: 'events', marketplace: 'listings', community: 'community', articles: 'articles' }
      return (this.results[map[key]] || []).length
    },
    showSection(key) {
      const map = { people: 'users', posts: 'posts', events: 'events', marketplace: 'listings', community: 'community', articles: 'articles' }
      const arr = this.results[map[key]] || []
      return arr.length > 0 && (this.activeTab === 'all' || this.activeTab === key)
    },
    timeAgo(dateStr) {
      const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
      if (diff < 60) return 'now'
      if (diff < 3600) return Math.floor(diff / 60) + 'm'
      if (diff < 86400) return Math.floor(diff / 3600) + 'h'
      return Math.floor(diff / 86400) + 'd'
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    },
    truncate(str, len) {
      if (!str) return ''
      return str.length > len ? str.slice(0, len) + '...' : str
    }
  }
}
</script>

<style scoped>
.search-page { max-width: 720px; margin: 0 auto; }
.page-title { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em; margin: 0 0 1rem; }

.search-bar { margin-bottom: 0.875rem; }
.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}
.search-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--text-tertiary);
  pointer-events: none;
}
.search-field {
  padding-left: 2.5rem;
  padding-right: 2rem;
  font-size: 0.9375rem;
  border-radius: 100px;
}
.clear-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem;
}
.clear-btn:hover { color: var(--text); }

/* Tabs */
.tabs {
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 1.25rem;
  padding-bottom: 0.25rem;
}
.tab {
  padding: 0.5rem 0.875rem;
  border-radius: 100px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.tab:hover { border-color: var(--text-tertiary); }
.tab.active { background: var(--text); color: #fff; border-color: var(--text); }
.tab-count {
  background: rgba(255,255,255,0.2);
  padding: 0.05rem 0.375rem;
  border-radius: 100px;
  font-size: 0.6875rem;
}
.tab:not(.active) .tab-count { background: var(--hover); }

/* Results */
.results { display: flex; flex-direction: column; gap: 1rem; }
.results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
.results-list { display: flex; flex-direction: column; gap: 0.75rem; }

.result-card {
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  text-decoration: none;
  color: inherit;
}
.result-card:hover { border-color: var(--text-tertiary); box-shadow: var(--shadow-md); }

.result-info { flex: 1; min-width: 0; }
.result-info strong { font-size: 0.9375rem; display: block; }
.result-handle { margin: 0.125rem 0 0; font-size: 0.8125rem; color: var(--text-secondary); font-weight: 500; }
.result-sub { margin: 0.125rem 0 0; font-size: 0.75rem; color: var(--text-tertiary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.result-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.375rem;
}
.author-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  text-decoration: none;
  color: var(--text);
  font-size: 0.8125rem;
  font-weight: 600;
}
.author-link:hover { color: var(--green); }

.result-time { font-size: 0.6875rem; color: var(--text-tertiary); margin-left: auto; }
.result-title { display: block; font-size: 0.9375rem; margin-bottom: 0.25rem; }
.result-content {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.result-location { margin: 0.375rem 0 0; font-size: 0.75rem; color: var(--text-tertiary); }
.result-stats { display: flex; gap: 0.75rem; margin-top: 0.375rem; font-size: 0.75rem; color: var(--text-tertiary); }

/* People cards */
.results-grid .result-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Events */
.event-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.375rem; }
.event-category { font-size: 0.6875rem; }

/* Listings */
.listing-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.375rem;
}
.listing-price { font-weight: 700; color: var(--green); font-size: 1rem; }
.carbon-badge { font-size: 0.6875rem; color: var(--green); }

/* States */
.loading-state, .empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-tertiary);
}

@media (max-width: 768px) {
  .results-grid { grid-template-columns: 1fr; }
  .tabs { gap: 0.375rem; }
}
</style>
