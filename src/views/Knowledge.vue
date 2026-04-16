<template>
  <div class="knowledge-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Knowledge Hub</h1>
        <p class="page-desc">Curated sustainability guides, tutorials, and community knowledge.</p>
      </div>
      <button class="btn btn-primary" @click="showCreateForm = !showCreateForm">
        {{ showCreateForm ? 'Cancel' : '+ Write Guide' }}
      </button>
    </div>

    <!-- Create Article Form -->
    <div v-if="showCreateForm" class="card article-form">
      <h3 class="form-heading">Write a Guide</h3>
      <div class="form-group">
        <label class="form-label">Title</label>
        <input v-model="newArticle.title" class="form-input" placeholder="Guide title..." />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select v-model="newArticle.category" class="form-select">
            <option value="">Select category</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.icon }} {{ cat.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Difficulty</label>
          <select v-model="newArticle.difficulty" class="form-select">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Content</label>
        <textarea v-model="newArticle.content" class="form-textarea" rows="8" placeholder="Write your guide content here..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Tags (comma-separated)</label>
        <input v-model="newArticle.tags" class="form-input" placeholder="composting, zero-waste, garden" />
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="publishArticle" :disabled="!canPublish">Publish</button>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="filter-bar card">
      <input v-model="searchQuery" class="form-input search-input" placeholder="Search guides and tutorials..." />
      <div class="filter-chips">
        <button class="chip" :class="{ active: activeCategory === '' }" @click="activeCategory = ''">All</button>
        <button v-for="cat in categories" :key="cat.id" class="chip" :class="{ active: activeCategory === cat.id }" @click="activeCategory = cat.id">{{ cat.icon }} {{ cat.name }}</button>
      </div>
    </div>

    <!-- Featured Guides -->
    <section v-if="!searchQuery && !activeCategory && featuredArticles.length" class="featured-section">
      <h2 class="section-title">Featured</h2>
      <div class="featured-grid">
        <div v-for="article in featuredArticles" :key="article.id" class="featured-card card" @click="openArticle(article)">
          <div class="featured-image" :class="'fcat-' + article.category">
            <span>{{ getCatIcon(article.category) }}</span>
          </div>
          <div class="featured-info">
            <span class="badge badge-green">{{ getCatName(article.category) }}</span>
            <h3>{{ article.title }}</h3>
            <div class="article-meta">
              <span>{{ authorName(article.author) }}</span>
              <span>{{ readTime(article) }} min read</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- All Articles -->
    <section>
      <h2 class="section-title" v-if="!searchQuery && !activeCategory">All Guides</h2>
      <div v-if="filteredArticles.length === 0" class="empty-state">
        <p>No guides found. Be the first to write one!</p>
      </div>
      <div class="articles-list">
        <div v-for="article in filteredArticles" :key="article.id" class="article-card card" @click="openArticle(article)">
          <div class="article-icon" :class="'fcat-' + article.category">{{ getCatIcon(article.category) }}</div>
          <div class="article-body">
            <div class="article-badges">
              <span class="badge badge-green">{{ getCatName(article.category) }}</span>
              <span class="badge" :class="article.difficulty === 'beginner' ? 'badge-green' : article.difficulty === 'intermediate' ? 'badge-blue' : 'badge-orange'">{{ article.difficulty }}</span>
            </div>
            <h3>{{ article.title }}</h3>
            <p class="article-excerpt">{{ article.content.substring(0, 150) }}...</p>
            <div class="article-footer">
              <span class="article-author">{{ authorName(article.author) }}</span>
              <span>{{ readTime(article) }} min</span>
              <span>{{ article.likes || 0 }} likes</span>
              <span>{{ article.views || 0 }} views</span>
            </div>
            <div class="article-tags" v-if="article.tags && article.tags.length">
              <span class="hashtag" v-for="tag in article.tags" :key="tag">#{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Article Modal -->
    <div v-if="selectedArticle" class="modal-overlay" @click.self="selectedArticle = null">
      <div class="modal card">
        <button class="modal-close" @click="selectedArticle = null">&times;</button>
        <div class="modal-header">
          <span class="badge badge-green">{{ getCatName(selectedArticle.category) }}</span>
          <span class="badge" :class="selectedArticle.difficulty === 'beginner' ? 'badge-green' : selectedArticle.difficulty === 'intermediate' ? 'badge-blue' : 'badge-orange'">{{ selectedArticle.difficulty }}</span>
        </div>
        <h2>{{ selectedArticle.title }}</h2>
        <div class="modal-meta">
          <span>By <strong>{{ authorName(selectedArticle.author) }}</strong></span>
          <span>{{ readTime(selectedArticle) }} min read</span>
          <span>{{ selectedArticle.likes || 0 }} likes</span>
        </div>
        <div class="modal-content">
          <p v-for="(para, i) in selectedArticle.content.split('\n\n')" :key="i">{{ para }}</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline btn-sm" @click="likeArticle(selectedArticle)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Like
          </button>
          <button class="btn btn-ghost btn-sm" @click="selectedArticle = null">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'KnowledgeView',
  data() {
    return {
      showCreateForm: false,
      searchQuery: '',
      activeCategory: '',
      selectedArticle: null,
      newArticle: { title: '', category: '', difficulty: 'beginner', content: '', tags: '' },
      categories: [
        { id: 'composting', name: 'Composting', icon: '🌱' },
        { id: 'minimalism', name: 'Minimalism', icon: '📦' },
        { id: 'energy', name: 'Energy Saving', icon: '💡' },
        { id: 'food', name: 'Sustainable Food', icon: '🥗' },
        { id: 'fashion', name: 'Eco Fashion', icon: '👗' },
        { id: 'transport', name: 'Green Transport', icon: '🚲' },
        { id: 'water', name: 'Water Conservation', icon: '💧' },
        { id: 'diy', name: 'DIY & Repair', icon: '🔧' }
      ],
      articles: []
    }
  },
  computed: {
    currentUser() {
      try { return JSON.parse(localStorage.getItem('susty_user')) || {} } catch { return {} }
    },
    canPublish() {
      return this.newArticle.title.trim() && this.newArticle.category && this.newArticle.content.trim()
    },
    featuredArticles() {
      return [...this.articles].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 3)
    },
    filteredArticles() {
      let result = [...this.articles]
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase()
        result = result.filter(a =>
          a.title.toLowerCase().includes(q) ||
          (a.content || '').toLowerCase().includes(q) ||
          (a.tags || []).some(t => t.toLowerCase().includes(q))
        )
      }
      if (this.activeCategory) result = result.filter(a => a.category === this.activeCategory)
      return result
    }
  },
  created() { this.loadArticles() },
  methods: {
    readTime(article) {
      if (article.readTime) return article.readTime
      return Math.max(1, Math.ceil((article.content || '').length / 1000))
    },
    authorName(obj) {
      if (!obj) return 'Anonymous'
      return typeof obj === 'object' ? obj.name : obj
    },
    getCatIcon(id) {
      const cat = this.categories.find(c => c.id === id)
      return cat ? cat.icon : '📖'
    },
    getCatName(id) {
      const cat = this.categories.find(c => c.id === id)
      return cat ? cat.name : 'General'
    },
    async openArticle(article) {
      const data = await api.getArticle(article.id)
      if (data) {
        this.selectedArticle = data
        const idx = this.articles.findIndex(a => a.id === article.id)
        if (idx >= 0) this.articles.splice(idx, 1, data)
      } else {
        this.selectedArticle = article
      }
    },
    async likeArticle(article) {
      const updated = await api.likeArticle(article.id)
      if (updated) {
        const idx = this.articles.findIndex(a => a.id === article.id)
        if (idx >= 0) this.articles.splice(idx, 1, updated)
        if (this.selectedArticle && this.selectedArticle.id === article.id) this.selectedArticle = updated
      }
    },
    async publishArticle() {
      if (!this.canPublish) return
      const tags = this.newArticle.tags.split(',').map(t => t.trim()).filter(Boolean)
      const article = await api.createArticle({
        title: this.newArticle.title.trim(),
        category: this.newArticle.category,
        difficulty: this.newArticle.difficulty,
        content: this.newArticle.content.trim(),
        tags
      })
      if (article) this.articles.unshift(article)
      this.showCreateForm = false
      this.newArticle = { title: '', category: '', difficulty: 'beginner', content: '', tags: '' }
    },
    async loadArticles() {
      const data = await api.getArticles()
      if (data) this.articles = data
    }
  }
}
</script>

<style scoped>
.knowledge-page { max-width: 960px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.page-title { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em; margin: 0; }
.page-desc { color: var(--text-secondary); font-size: 0.875rem; margin: 0.25rem 0 0; }

.article-form { margin-bottom: 1.25rem; }
.form-heading { margin: 0 0 1rem; font-size: 1rem; font-weight: 600; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
.form-actions { display: flex; justify-content: flex-end; }

.filter-bar { margin-bottom: 1.25rem; }
.search-input { margin-bottom: 0.625rem; }
.filter-chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }

/* Featured */
.featured-section { margin-bottom: 1.5rem; }
.featured-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.875rem; }
.featured-card { padding: 0; overflow: hidden; cursor: pointer; transition: transform 0.15s; }
.featured-card:hover { transform: translateY(-2px); }
.featured-image { height: 100px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
.fcat-composting { background: #d1fae5; }
.fcat-minimalism { background: #e0f2fe; }
.fcat-energy { background: #fef3c7; }
.fcat-food { background: #dcfce7; }
.fcat-fashion { background: #f3e8ff; }
.fcat-transport { background: #cffafe; }
.fcat-water { background: #dbeafe; }
.fcat-diy { background: #ffedd5; }
.featured-info { padding: 0.875rem 1rem; }
.featured-info h3 { margin: 0.375rem 0 0.25rem; font-size: 0.9375rem; font-weight: 600; }
.article-meta { font-size: 0.75rem; color: var(--text-tertiary); display: flex; gap: 0.75rem; }

/* Article List */
.articles-list { display: flex; flex-direction: column; gap: 0.75rem; }
.article-card { display: flex; gap: 0.875rem; cursor: pointer; transition: background 0.15s; }
.article-card:hover { background: var(--hover); }
.article-icon { width: 52px; height: 52px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.375rem; flex-shrink: 0; }
.article-body { flex: 1; min-width: 0; }
.article-badges { display: flex; gap: 0.3rem; margin-bottom: 0.25rem; }
.article-body h3 { margin: 0 0 0.2rem; font-size: 0.9375rem; font-weight: 600; }
.article-excerpt { font-size: 0.8125rem; color: var(--text-secondary); margin: 0 0 0.375rem; line-height: 1.45; }
.article-footer { display: flex; gap: 0.875rem; font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 0.25rem; }
.article-author { font-weight: 500; color: var(--text-secondary); }
.article-tags { display: flex; gap: 0.375rem; flex-wrap: wrap; }

/* Modal overrides */
.modal-close:hover { background: var(--hover); }
.modal-meta { display: flex; gap: 0.875rem; font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 1.25rem; }
.modal-content p { line-height: 1.7; margin: 0 0 0.875rem; font-size: 0.9375rem; }
.modal-actions { display: flex; gap: 0.5rem; padding-top: 0.875rem; border-top: 1px solid var(--border); }

@media (max-width: 768px) {
  .page-header { flex-direction: column; gap: 0.75rem; }
  .form-row { grid-template-columns: 1fr; }
  .featured-grid { grid-template-columns: 1fr; }
  .article-card { flex-direction: column; }
  .article-icon { width: 100%; height: 44px; border-radius: 8px; }
}
</style>
