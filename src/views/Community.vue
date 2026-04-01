<template>
  <div class="community">
    <div class="community-header">
      <div>
        <h1>👥 Local Communities</h1>
        <p class="community-subtitle">Connect with sustainability-minded people in your area.</p>
      </div>
    </div>

    <!-- Local Groups -->
    <section class="groups-section">
      <h2 class="section-title">📍 Local Groups</h2>
      <div class="groups-grid">
        <div v-for="group in groups" :key="group.id" class="group-card card">
          <div class="group-icon" :style="{ background: group.color }">{{ group.icon }}</div>
          <div class="group-info">
            <h3>{{ group.name }}</h3>
            <p class="group-location">📍 {{ group.city || group.location }}</p>
            <p class="group-desc">{{ group.description }}</p>
            <div class="group-footer">
              <span>👥 {{ group.memberCount || group.members }} members</span>
              <button
                v-if="!group.joined"
                class="btn btn-outline btn-sm"
                @click="joinGroup(group)"
              >Join</button>
              <span v-else class="badge badge-green">✅ Joined</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Community Feed -->
    <div class="community-layout">
      <div class="community-feed">
        <h2 class="section-title">💬 Community Discussion</h2>

        <div v-if="communityPosts.length === 0" class="empty-state">
          <div class="empty-state-icon">💬</div>
          <p>No posts yet. Start a discussion!</p>
        </div>

        <div v-for="post in communityPosts" :key="post.id" class="post-card card">
          <div class="post-header">
            <div class="avatar">{{ authorName(post.author).charAt(0).toUpperCase() }}</div>
            <div class="post-meta-info">
              <strong>{{ authorName(post.author) }}</strong>
              <span class="post-time">{{ timeAgo(post.createdAt || post.date) }}</span>
            </div>
            <button v-if="authorName(post.author) === currentUserName" class="icon-btn" @click="deletePost(post.id)">🗑️</button>
          </div>
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-content">{{ post.content }}</p>
          <div class="post-actions">
            <button class="action-btn" :class="{ liked: post.liked }" @click="toggleLike(post)">
              {{ post.liked ? '❤️' : '🤍' }} {{ post.likes || 0 }}
            </button>
            <button class="action-btn" @click="toggleComments(post.id)">
              💬 {{ (post.comments || []).length }}
            </button>
          </div>
          <div v-if="expandedPosts.includes(post.id)" class="comments-section">
            <div v-for="comment in (post.comments || [])" :key="comment.id" class="comment">
              <div class="avatar avatar-sm">{{ authorName(comment.author).charAt(0).toUpperCase() }}</div>
              <div>
                <strong>{{ authorName(comment.author) }}</strong>
                <p>{{ comment.content }}</p>
              </div>
            </div>
            <div class="comment-compose">
              <input
                v-model="commentInputs[post.id]"
                class="form-input"
                placeholder="Add a comment..."
                @keyup.enter="addComment(post)"
              />
              <button class="btn btn-sm btn-primary" @click="addComment(post)">Post</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="community-sidebar">
        <div class="card post-form-card">
          <h3>Start a Discussion</h3>
          <div class="form-group">
            <input v-model="newPost.title" class="form-input" placeholder="Discussion title" />
          </div>
          <div class="form-group">
            <textarea v-model="newPost.content" class="form-textarea" placeholder="Share your thoughts..." rows="4"></textarea>
          </div>
          <button @click="submitPost" class="btn btn-primary" style="width: 100%" :disabled="!newPost.title.trim() || !newPost.content.trim()">Post</button>
        </div>

        <!-- Trending Topics -->
        <div class="card trending-card">
          <h3>🔥 Trending Topics</h3>
          <div class="trending-list">
            <div v-for="topic in trendingTopics" :key="topic" class="trending-item">
              <span class="hashtag">#{{ topic }}</span>
            </div>
          </div>
        </div>

        <!-- Active Members -->
        <div class="card active-members-card">
          <h3>⭐ Active Members</h3>
          <div class="members-list">
            <div v-for="member in activeMembers" :key="member" class="member-item">
              <div class="avatar avatar-sm">{{ member.charAt(0).toUpperCase() }}</div>
              <span>{{ member }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'CommunityView',
  data() {
    return {
      communityPosts: [],
      expandedPosts: [],
      commentInputs: {},
      newPost: { title: '', content: '' },
      groups: [],
      trendingTopics: ['ZeroWaste', 'CircularEconomy', 'PlantBased', 'RepairCulture', 'LocalFood', 'CleanEnergy'],
      activeMembers: ['EcoWarrior', 'GreenGuru', 'SolarSteve', 'ZeroWasteZoe', 'TreeHugger']
    }
  },
  computed: {
    currentUser() {
      try { return JSON.parse(localStorage.getItem('susty_user')) || {} } catch { return {} }
    },
    currentUserName() {
      return this.currentUser.name || this.currentUser.email || 'User'
    }
  },
  created() {
    this.loadGroups()
    this.loadPosts()
  },
  methods: {
    authorName(obj) {
      if (!obj) return 'Anonymous'
      return typeof obj === 'object' ? obj.name : obj
    },
    timeAgo(dateStr) {
      const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
      if (diff < 60) return 'just now'
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago'
      return Math.floor(diff / 86400) + 'd ago'
    },
    async submitPost() {
      if (!this.newPost.title.trim() || !this.newPost.content.trim()) return
      const post = await api.createCommunityPost({
        title: this.newPost.title.trim(),
        content: this.newPost.content.trim()
      })
      if (post) this.communityPosts.unshift(post)
      this.newPost = { title: '', content: '' }
    },
    async toggleLike(post) {
      const updated = await api.likeCommunityPost(post.id)
      if (updated) {
        const idx = this.communityPosts.findIndex(p => p.id === post.id)
        if (idx >= 0) this.communityPosts.splice(idx, 1, updated)
      }
    },
    toggleComments(postId) {
      const idx = this.expandedPosts.indexOf(postId)
      if (idx >= 0) this.expandedPosts.splice(idx, 1)
      else this.expandedPosts.push(postId)
    },
    async addComment(post) {
      const text = (this.commentInputs[post.id] || '').trim()
      if (!text) return
      const updated = await api.addCommunityComment(post.id, text)
      if (updated) {
        const idx = this.communityPosts.findIndex(p => p.id === post.id)
        if (idx >= 0) this.communityPosts.splice(idx, 1, updated)
      }
      this.commentInputs[post.id] = ''
    },
    deletePost(postId) {
      this.communityPosts = this.communityPosts.filter(p => p.id !== postId)
    },
    async joinGroup(group) {
      const updated = await api.joinGroup(group.id)
      if (updated) {
        const idx = this.groups.findIndex(g => g.id === group.id)
        if (idx >= 0) {
          this.groups.splice(idx, 1, { ...this.groups[idx], ...updated, joined: true })
        }
      }
    },
    async loadGroups() {
      const data = await api.getGroups()
      if (data) this.groups = data.map(g => ({ ...g, joined: false }))
    },
    async loadPosts() {
      const data = await api.getCommunityPosts()
      if (data) this.communityPosts = data
    }
  }
}
</script>

<style scoped>
.community-header { margin-bottom: 1.5rem; }
.community-header h1 { margin: 0 0 0.25rem; font-size: 1.8rem; }
.community-subtitle { color: var(--muted-text); margin: 0; }

.groups-section { margin-bottom: 2rem; }
.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.group-card { display: flex; gap: 1rem; align-items: flex-start; }
.group-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}
.group-info { flex: 1; }
.group-info h3 { margin: 0 0 0.15rem; font-size: 0.95rem; }
.group-location { font-size: 0.8rem; color: var(--muted-text); margin: 0 0 0.25rem; }
.group-desc { font-size: 0.85rem; color: var(--muted-text); margin: 0 0 0.5rem; }
.group-footer { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--muted-text); }

.community-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  align-items: start;
}

.post-card { margin-bottom: 1rem; }
.post-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
.post-meta-info { flex: 1; }
.post-meta-info strong { display: block; font-size: 0.9rem; }
.post-time { font-size: 0.8rem; color: var(--muted-text); }
.icon-btn { background: none; border: none; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); }
.icon-btn:hover { background: #f0f0f0; }
.post-title { margin: 0 0 0.35rem; font-size: 1.05rem; }
.post-content { color: var(--dark-text); margin: 0 0 0.75rem; line-height: 1.5; }

.post-actions { display: flex; gap: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color); }
.action-btn {
  background: none; border: none; padding: 0.35rem 0.65rem; border-radius: var(--radius-sm);
  cursor: pointer; font-size: 0.85rem; color: var(--muted-text); transition: all var(--transition);
}
.action-btn:hover { background: var(--light-bg); }
.action-btn.liked { color: #e74c3c; }

.comments-section { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); }
.comment {
  display: flex; gap: 0.5rem; align-items: flex-start;
  padding: 0.5rem; background: var(--light-bg); border-radius: var(--radius-sm); margin-bottom: 0.5rem;
}
.comment p { margin: 0.15rem 0 0; font-size: 0.85rem; }
.comment strong { font-size: 0.85rem; }
.comment-compose { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.comment-compose .form-input { flex: 1; }

/* Sidebar */
.post-form-card h3, .trending-card h3, .active-members-card h3 { margin-top: 0; font-size: 1rem; }
.community-sidebar .card { margin-bottom: 1rem; }
.trending-list { display: flex; flex-direction: column; gap: 0.35rem; }
.trending-item { padding: 0.25rem 0; }
.members-list { display: flex; flex-direction: column; gap: 0.5rem; }
.member-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }

@media (max-width: 900px) {
  .community-layout { grid-template-columns: 1fr; }
  .community-sidebar { order: -1; }
  .groups-grid { grid-template-columns: 1fr; }
}
</style>