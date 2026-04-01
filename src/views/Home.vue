<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <h1>Welcome to Susty</h1>
      <p class="tagline">A Better Social Media, A Better World!</p>
      <p class="hero-sub">Share ideas, take action, and build a sustainable future together.</p>
      <div class="hero-stats">
        <div class="hero-stat"><strong>{{ totalPosts }}</strong> Posts</div>
        <div class="hero-stat"><strong>{{ activeUsers }}</strong> Active</div>
        <div class="hero-stat"><strong>{{ co2Saved }}</strong> kg CO₂ Saved</div>
      </div>
    </section>

    <!-- Quick Features -->
    <section class="quick-features">
      <router-link to="/marketplace" class="qf-card">
        <span class="qf-icon">🛒</span>
        <span>Marketplace</span>
      </router-link>
      <router-link to="/events" class="qf-card">
        <span class="qf-icon">📅</span>
        <span>Events</span>
      </router-link>
      <router-link to="/challenges" class="qf-card">
        <span class="qf-icon">🏆</span>
        <span>Challenges</span>
      </router-link>
      <router-link to="/knowledge" class="qf-card">
        <span class="qf-icon">📚</span>
        <span>Knowledge</span>
      </router-link>
      <router-link to="/donations" class="qf-card">
        <span class="qf-icon">🎁</span>
        <span>Donations</span>
      </router-link>
    </section>

    <!-- Compose Post -->
    <section class="compose card">
      <div class="compose-header">
        <div class="avatar">{{ currentUserInitial }}</div>
        <div class="compose-body">
          <input
            v-model="newPost.content"
            :placeholder="'What\'s on your mind about sustainability, ' + currentUserName + '?'"
            class="compose-input"
            @keyup.enter="createPost"
          />
        </div>
      </div>
      <div class="compose-actions">
        <div class="compose-tools">
          <button class="tool-btn" title="Add image" @click="toggleMediaType('image')">🖼️ Photo</button>
          <button class="tool-btn" title="Add video" @click="toggleMediaType('video')">🎬 Video</button>
          <button class="tool-btn" title="Add link" @click="toggleMediaType('link')">🔗 Link</button>
        </div>
        <button class="btn btn-primary" @click="createPost" :disabled="!canPost">Post</button>
      </div>
      <div v-if="newPost.mediaType" class="compose-media-input">
        <input
          v-model="newPost.mediaUrl"
          :placeholder="'Paste ' + newPost.mediaType + ' URL...'"
          class="form-input"
        />
        <button class="btn btn-sm btn-outline" @click="newPost.mediaType = ''; newPost.mediaUrl = ''">✕</button>
      </div>
      <div v-if="newPost.content && extractHashtags(newPost.content).length" class="compose-tags">
        <span class="badge badge-green" v-for="tag in extractHashtags(newPost.content)" :key="tag">{{ tag }}</span>
      </div>
    </section>

    <!-- Feed Tabs -->
    <div class="tabs">
      <button class="tab" :class="{ active: feedTab === 'latest' }" @click="feedTab = 'latest'">Latest</button>
      <button class="tab" :class="{ active: feedTab === 'trending' }" @click="feedTab = 'trending'">Trending</button>
      <button class="tab" :class="{ active: feedTab === 'following' }" @click="feedTab = 'following'">Following</button>
    </div>

    <!-- Posts Feed -->
    <section class="feed">
      <div v-if="filteredPosts.length === 0" class="empty-state">
        <div class="empty-state-icon">🌱</div>
        <p>No posts yet. Be the first to share something sustainable!</p>
      </div>

      <div v-for="post in filteredPosts" :key="post.id" class="post-card card">
        <!-- Post Header -->
        <div class="post-header">
          <div class="avatar" :style="{ background: post.avatarColor || '' }">{{ getInitial(postAuthorName(post)) }}</div>
          <div class="post-meta">
            <strong class="post-author">{{ postAuthorName(post) }}</strong>
            <span class="post-time">{{ timeAgo(post.createdAt || post.date) }}</span>
          </div>
          <div class="post-menu">
            <button class="icon-btn" @click="togglePostMenu(post.id)">⋯</button>
            <div v-if="openMenu === post.id" class="post-dropdown">
              <button @click="deletePost(post.id)">🗑️ Delete</button>
              <button @click="reportPost(post.id)">🚩 Report</button>
            </div>
          </div>
        </div>

        <!-- Post Content -->
        <div class="post-content">
          <p v-html="renderContent(post.content)"></p>
          <div v-if="post.mediaUrl" class="post-media">
            <div v-if="post.mediaType === 'image'" class="media-placeholder media-image">🖼️ {{ post.mediaUrl }}</div>
            <div v-else-if="post.mediaType === 'video'" class="media-placeholder media-video">🎬 {{ post.mediaUrl }}</div>
            <div v-else-if="post.mediaType === 'link'" class="media-placeholder media-link">🔗 {{ post.mediaUrl }}</div>
          </div>
        </div>

        <!-- Post Tags -->
        <div v-if="post.hashtags && post.hashtags.length" class="post-tags">
          <span class="hashtag" v-for="tag in post.hashtags" :key="tag" @click="filterByTag(tag)">{{ tag }}</span>
        </div>

        <!-- Carbon Impact -->
        <div v-if="post.carbonImpact" class="carbon-badge">
          <span class="badge badge-green">🌿 {{ post.carbonImpact }}</span>
        </div>

        <!-- Post Actions -->
        <div class="post-actions">
          <button class="action-btn" :class="{ liked: post.liked }" @click="toggleLike(post)">
            {{ post.liked ? '❤️' : '🤍' }} {{ post.likes || 0 }}
          </button>
          <button class="action-btn" @click="toggleReplies(post.id)">
            💬 {{ (post.replies || []).length }}
          </button>
          <button class="action-btn" @click="repost(post)">
            🔄 {{ post.reposts || 0 }}
          </button>
          <button class="action-btn" @click="sharePost(post)">
            📤 Share
          </button>
        </div>

        <!-- Replies Section -->
        <div v-if="expandedPosts.includes(post.id)" class="replies-section">
          <div v-for="reply in (post.replies || [])" :key="reply.id" class="reply">
            <div class="reply-header">
              <div class="avatar avatar-sm">{{ getInitial(reply.author ? reply.author.name || reply.author : '?') }}</div>
              <strong>{{ reply.author ? reply.author.name || reply.author : 'Unknown' }}</strong>
              <span class="post-time">{{ timeAgo(reply.createdAt || reply.date) }}</span>
            </div>
            <p class="reply-content" v-html="renderContent(reply.content)"></p>
            <button class="action-btn action-btn-sm" :class="{ liked: reply.liked }" @click="toggleReplyLike(post, reply)">
              {{ reply.liked ? '❤️' : '🤍' }} {{ reply.likes || 0 }}
            </button>
          </div>
          <div class="reply-compose">
            <input
              v-model="replyInputs[post.id]"
              placeholder="Write a reply..."
              class="form-input"
              @keyup.enter="addReply(post)"
            />
            <button class="btn btn-sm btn-primary" @click="addReply(post)">Reply</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import api from '../services/api'

export default {
  name: 'HomeView',
  data() {
    return {
      posts: [],
      newPost: {
        content: '',
        mediaType: '',
        mediaUrl: ''
      },
      feedTab: 'latest',
      expandedPosts: [],
      replyInputs: {},
      openMenu: null,
      filterTag: ''
    }
  },
  computed: {
    currentUser() {
      try { return JSON.parse(localStorage.getItem('susty_user')) || {} } catch { return {} }
    },
    currentUserName() {
      return this.currentUser.name || this.currentUser.email || 'User'
    },
    currentUserInitial() {
      return this.getInitial(this.currentUserName)
    },
    canPost() {
      return this.newPost.content.trim().length > 0
    },
    totalPosts() {
      return this.posts.length
    },
    activeUsers() {
      const users = new Set(this.posts.map(p => p.author ? p.author.name : 'Unknown'))
      return Math.max(users.size, 1)
    },
    co2Saved() {
      return (this.posts.length * 0.3).toFixed(1)
    },
    filteredPosts() {
      let result = [...this.posts]
      if (this.filterTag) {
        result = result.filter(p => p.hashtags && p.hashtags.includes(this.filterTag))
      }
      if (this.feedTab === 'trending') {
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0))
      }
      return result
    }
  },
  created() {
    this.loadPosts()
    document.addEventListener('click', this.closeMenus)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeMenus)
  },
  methods: {
    postAuthorName(post) {
      if (post.author && typeof post.author === 'object') return post.author.name
      return post.author || 'Unknown'
    },
    extractHashtags(text) {
      const matches = text.match(/#\w+/g)
      return matches || []
    },
    renderContent(text) {
      if (!text) return ''
      return text.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
    },
    getInitial(name) {
      if (!name) return '?'
      return name.charAt(0).toUpperCase()
    },
    timeAgo(dateStr) {
      const date = new Date(dateStr)
      const now = new Date()
      const diff = Math.floor((now - date) / 1000)
      if (diff < 60) return 'just now'
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
      if (diff < 604800) return Math.floor(diff / 86400) + 'd ago'
      return date.toLocaleDateString()
    },
    toggleMediaType(type) {
      this.newPost.mediaType = this.newPost.mediaType === type ? '' : type
      if (!this.newPost.mediaType) this.newPost.mediaUrl = ''
    },
    async createPost() {
      if (!this.canPost) return
      const res = await api.createPost({
        content: this.newPost.content.trim(),
        mediaType: this.newPost.mediaType || '',
        mediaUrl: this.newPost.mediaUrl || ''
      })
      if (res) this.posts.unshift(res)
      this.newPost = { content: '', mediaType: '', mediaUrl: '' }
    },
    async toggleLike(post) {
      const res = await api.likePost(post.id)
      if (res) Object.assign(post, res)
    },
    toggleReplyLike(post, reply) {
      reply.liked = !reply.liked
      reply.likes = (reply.likes || 0) + (reply.liked ? 1 : -1)
    },
    async repost(post) {
      await api.repostPost(post.id)
      await this.loadPosts()
    },
    sharePost(post) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(post.content)
      }
    },
    toggleReplies(postId) {
      const idx = this.expandedPosts.indexOf(postId)
      if (idx >= 0) {
        this.expandedPosts.splice(idx, 1)
      } else {
        this.expandedPosts.push(postId)
      }
    },
    async addReply(post) {
      const text = (this.replyInputs[post.id] || '').trim()
      if (!text) return
      const res = await api.addReply(post.id, text)
      if (res) Object.assign(post, res)
      this.replyInputs[post.id] = ''
    },
    togglePostMenu(postId) {
      this.openMenu = this.openMenu === postId ? null : postId
    },
    closeMenus() {
      this.openMenu = null
    },
    async deletePost(postId) {
      await api.deletePost(postId)
      this.posts = this.posts.filter(p => p.id !== postId)
      this.openMenu = null
    },
    reportPost() {
      this.openMenu = null
    },
    filterByTag(tag) {
      this.filterTag = this.filterTag === tag ? '' : tag
    },
    async loadPosts() {
      const sort = this.feedTab === 'trending' ? 'trending' : 'latest'
      const res = await api.getPosts(sort)
      if (res) this.posts = res
    }
  }
}
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, var(--primary-green), var(--primary-blue));
  color: white;
  text-align: center;
  padding: 3rem 2rem;
  border-radius: var(--radius-lg);
  margin-bottom: 1.5rem;
}
.hero h1 { font-size: 2.2rem; margin: 0 0 0.5rem; }
.tagline { font-size: 1.2rem; opacity: 0.95; margin: 0; }
.hero-sub { opacity: 0.85; margin: 0.5rem 0 1.5rem; }
.hero-stats { display: flex; justify-content: center; gap: 2rem; }
.hero-stat { font-size: 0.95rem; }
.hero-stat strong { font-size: 1.3rem; display: block; }

/* Quick Features */
.quick-features {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}
.qf-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.8rem 1.2rem;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--card-shadow);
  text-decoration: none;
  color: var(--dark-text);
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all var(--transition);
  flex-shrink: 0;
}
.qf-card:hover { transform: translateY(-2px); box-shadow: var(--card-shadow-hover); }
.qf-icon { font-size: 1.5rem; }

/* Compose */
.compose { margin-bottom: 1.5rem; }
.compose-header { display: flex; align-items: center; gap: 0.75rem; }
.compose-body { flex: 1; }
.compose-input {
  width: 100%;
  border: none;
  font-size: 1rem;
  padding: 0.5rem 0;
  background: transparent;
  color: var(--dark-text);
  outline: none;
}
.compose-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}
.compose-tools { display: flex; gap: 0.25rem; }
.tool-btn {
  background: none;
  border: none;
  padding: 0.4rem 0.65rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--muted-text);
  transition: all var(--transition);
}
.tool-btn:hover { background: var(--light-green); color: var(--primary-green); }
.compose-media-input {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.compose-tags { display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap; }

/* Post Card */
.post-card { margin-bottom: 1rem; }
.post-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.post-meta { flex: 1; }
.post-author { font-size: 0.95rem; }
.post-time { display: block; font-size: 0.8rem; color: var(--muted-text); }
.post-menu { position: relative; }
.icon-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  color: var(--muted-text);
}
.icon-btn:hover { background: #f0f0f0; }
.post-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 10;
  min-width: 140px;
}
.post-dropdown button {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.85rem;
}
.post-dropdown button:hover { background: var(--light-bg); }

.post-content { margin-bottom: 0.75rem; line-height: 1.5; }
.post-content p { margin: 0; }

.post-media { margin-top: 0.75rem; }
.media-placeholder {
  padding: 1.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  word-break: break-all;
}
.media-image { background: #e8f5e9; }
.media-video { background: #e3f2fd; }
.media-link { background: #fff3e0; }

.post-tags { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
.carbon-badge { margin-bottom: 0.75rem; }

/* Post Actions */
.post-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}
.action-btn {
  background: none;
  border: none;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--muted-text);
  transition: all var(--transition);
}
.action-btn:hover { background: var(--light-bg); color: var(--dark-text); }
.action-btn.liked { color: #e74c3c; }
.action-btn-sm { font-size: 0.75rem; padding: 0.2rem 0.5rem; }

/* Replies */
.replies-section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}
.reply {
  padding: 0.75rem;
  background: var(--light-bg);
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
}
.reply-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; font-size: 0.85rem; }
.reply-content { margin: 0; font-size: 0.9rem; }
.reply-compose { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.reply-compose .form-input { flex: 1; }

@media (max-width: 768px) {
  .hero { padding: 2rem 1rem; }
  .hero h1 { font-size: 1.6rem; }
  .hero-stats { flex-direction: column; gap: 0.5rem; }
  .quick-features { gap: 0.5rem; }
  .post-actions { flex-wrap: wrap; }
}
</style>