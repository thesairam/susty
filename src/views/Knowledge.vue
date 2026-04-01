<template>
  <div class="knowledge">
    <div class="knowledge-header">
      <div>
        <h1>📚 Knowledge Hub</h1>
        <p class="knowledge-subtitle">Curated sustainability guides, tutorials, and community knowledge.</p>
      </div>
      <button class="btn btn-primary" @click="showCreateForm = !showCreateForm">
        {{ showCreateForm ? '✕ Cancel' : '+ Write a Guide' }}
      </button>
    </div>

    <!-- Create Article Form -->
    <div v-if="showCreateForm" class="card article-form">
      <h3>Write a Guide or Tutorial</h3>
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
      <input v-model="searchQuery" class="form-input" placeholder="🔍 Search guides and tutorials..." />
      <div class="filter-chips">
        <button class="chip" :class="{ active: activeCategory === '' }" @click="activeCategory = ''">All</button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="chip"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = cat.id"
        >{{ cat.icon }} {{ cat.name }}</button>
      </div>
    </div>

    <!-- Featured Guides -->
    <section v-if="!searchQuery && !activeCategory" class="featured-section">
      <h2 class="section-title">⭐ Featured Guides</h2>
      <div class="featured-grid">
        <div v-for="article in featuredArticles" :key="article.id" class="featured-card card" @click="openArticle(article)">
          <div class="featured-image" :style="{ background: getCatColor(article.category) }">
            <span>{{ getCatIcon(article.category) }}</span>
          </div>
          <div class="featured-info">
            <span class="badge badge-green">{{ getCatName(article.category) }}</span>
            <h3>{{ article.title }}</h3>
            <div class="article-meta">
              <span>By {{ authorName(article.author) }}</span>
              <span>📖 {{ article.readTime }} min read</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- All Articles -->
    <section>
      <h2 class="section-title" v-if="!searchQuery && !activeCategory">📖 All Guides</h2>
      <div v-if="filteredArticles.length === 0" class="empty-state">
        <div class="empty-state-icon">📚</div>
        <p>No guides found. Be the first to write one!</p>
      </div>
      <div class="articles-list">
        <div v-for="article in filteredArticles" :key="article.id" class="article-card card" @click="openArticle(article)">
          <div class="article-icon" :style="{ background: getCatColor(article.category) }">
            {{ getCatIcon(article.category) }}
          </div>
          <div class="article-body">
            <div class="article-badges">
              <span class="badge badge-green">{{ getCatName(article.category) }}</span>
              <span class="badge" :class="article.difficulty === 'beginner' ? 'badge-green' : article.difficulty === 'intermediate' ? 'badge-blue' : 'badge-orange'">{{ article.difficulty }}</span>
            </div>
            <h3>{{ article.title }}</h3>
            <p class="article-excerpt">{{ article.content.substring(0, 150) }}...</p>
            <div class="article-footer">
              <span class="article-author">By {{ authorName(article.author) }}</span>
              <span>📖 {{ article.readTime }} min</span>
              <span>❤️ {{ article.likes }}</span>
              <span>👁️ {{ article.views }}</span>
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
        <button class="modal-close" @click="selectedArticle = null">✕</button>
        <div class="modal-header">
          <span class="badge badge-green">{{ getCatName(selectedArticle.category) }}</span>
          <span class="badge" :class="selectedArticle.difficulty === 'beginner' ? 'badge-green' : selectedArticle.difficulty === 'intermediate' ? 'badge-blue' : 'badge-orange'">{{ selectedArticle.difficulty }}</span>
        </div>
        <h2>{{ selectedArticle.title }}</h2>
        <div class="modal-meta">
          <span>By <strong>{{ authorName(selectedArticle.author) }}</strong></span>
          <span>📖 {{ selectedArticle.readTime }} min read</span>
          <span>❤️ {{ selectedArticle.likes }}</span>
        </div>
        <div class="modal-content">
          <p v-for="(para, i) in selectedArticle.content.split('\n\n')" :key="i">{{ para }}</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline btn-sm" @click="likeArticle(selectedArticle)">❤️ Like</button>
          <button class="btn btn-outline btn-sm" @click="selectedArticle = null">Close</button>
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
      newArticle: {
        title: '',
        category: '',
        difficulty: 'beginner',
        content: '',
        tags: ''
      },
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
      if (this.activeCategory) {
        result = result.filter(a => a.category === this.activeCategory)
      }
      return result
    }
  },
  created() {
    this.loadArticles()
  },
  methods: {
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
    getCatColor(id) {
      const colors = {
        composting: 'linear-gradient(135deg, #66BB6A, #43A047)',
        minimalism: 'linear-gradient(135deg, #90CAF9, #42A5F5)',
        energy: 'linear-gradient(135deg, #FFD54F, #FFC107)',
        food: 'linear-gradient(135deg, #A5D6A7, #66BB6A)',
        fashion: 'linear-gradient(135deg, #CE93D8, #AB47BC)',
        transport: 'linear-gradient(135deg, #80DEEA, #26C6DA)',
        water: 'linear-gradient(135deg, #81D4FA, #29B6F6)',
        diy: 'linear-gradient(135deg, #FFAB91, #FF7043)'
      }
      return colors[id] || 'linear-gradient(135deg, #E0E0E0, #BDBDBD)'
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
        if (this.selectedArticle && this.selectedArticle.id === article.id) {
          this.selectedArticle = updated
        }
      }
    },
    async publishArticle() {
      if (!this.canPublish) return
      const tags = this.newArticle.tags.split(',').map(t => t.trim()).filter(Boolean)
      const data = {
        title: this.newArticle.title.trim(),
        category: this.newArticle.category,
        difficulty: this.newArticle.difficulty,
        content: this.newArticle.content.trim(),
        tags
      }
      const article = await api.createArticle(data)
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
.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}
.knowledge-header h1 { margin: 0 0 0.25rem; font-size: 1.8rem; }
.knowledge-subtitle { color: var(--muted-text); margin: 0; }

.article-form { margin-bottom: 1.5rem; }
.article-form h3 { margin-top: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-actions { display: flex; justify-content: flex-end; }

.filter-bar { margin-bottom: 1.5rem; }
.filter-bar .form-input { margin-bottom: 0.75rem; }
.filter-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
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

.featured-section { margin-bottom: 2rem; }
.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}
.featured-card { padding: 0; overflow: hidden; cursor: pointer; }
.featured-card:hover { transform: translateY(-2px); }
.featured-image {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}
.featured-info { padding: 1rem 1.25rem; }
.featured-info h3 { margin: 0.5rem 0 0.35rem; font-size: 1.05rem; }

.articles-list { display: flex; flex-direction: column; gap: 1rem; }
.article-card {
  display: flex;
  gap: 1rem;
  cursor: pointer;
  transition: all var(--transition);
}
.article-card:hover { transform: translateX(4px); }
.article-icon {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}
.article-body { flex: 1; }
.article-badges { display: flex; gap: 0.35rem; margin-bottom: 0.35rem; }
.article-body h3 { margin: 0 0 0.25rem; font-size: 1rem; }
.article-excerpt { font-size: 0.85rem; color: var(--muted-text); margin: 0 0 0.5rem; line-height: 1.4; }
.article-footer { display: flex; gap: 1rem; font-size: 0.8rem; color: var(--muted-text); margin-bottom: 0.35rem; }
.article-author { font-weight: 500; }
.article-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.article-meta { font-size: 0.8rem; color: var(--muted-text); display: flex; gap: 1rem; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 2rem;
}
.modal {
  max-width: 700px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}
.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
}
.modal-close:hover { background: var(--light-bg); }
.modal-header { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
.modal h2 { margin: 0 0 0.5rem; }
.modal-meta { display: flex; gap: 1rem; font-size: 0.85rem; color: var(--muted-text); margin-bottom: 1.5rem; }
.modal-content p { line-height: 1.7; margin: 0 0 1rem; }
.modal-actions { display: flex; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }

@media (max-width: 768px) {
  .knowledge-header { flex-direction: column; gap: 1rem; }
  .form-row { grid-template-columns: 1fr; }
  .featured-grid { grid-template-columns: 1fr; }
  .article-card { flex-direction: column; }
  .article-icon { width: 100%; height: 50px; }
}
</style>
