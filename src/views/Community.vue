<template>
  <div class="community-page">
    <div class="page-header">
      <h1 class="page-title">Community</h1>
      <p class="page-desc">Connect with sustainability-minded people near you.</p>
    </div>

    <!-- Local Groups -->
    <section class="groups-section">
      <h2 class="section-title">Local Groups</h2>
      <div class="groups-grid">
        <div v-for="group in groups" :key="group.id" class="group-card card">
          <div class="group-icon" :style="{ background: group.color || 'var(--green-50)' }">{{ group.icon }}</div>
          <div class="group-info">
            <h3 class="group-name">{{ group.name }}</h3>
            <p class="group-location">{{ group.city || group.location }}</p>
            <p class="group-desc">{{ group.description }}</p>
            <div class="group-footer">
              <span class="group-members">{{ group.memberCount || group.members }} members</span>
              <button v-if="!group.joined" class="btn btn-outline btn-sm" @click="joinGroup(group)">Join</button>
              <span v-else class="badge badge-green">Joined</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Community Layout -->
    <div class="community-layout">
      <div class="community-feed">
        <h2 class="section-title">Discussion</h2>

        <div v-if="communityPosts.length === 0" class="empty-state">
          <div class="empty-state-icon">💬</div>
          <p>No posts yet. Start a discussion!</p>
        </div>

        <article v-for="post in communityPosts" :key="post.id" class="discussion-post card">
          <div class="dp-header">
            <div class="avatar avatar-sm">{{ authorName(post.author).charAt(0).toUpperCase() }}</div>
            <div class="dp-meta">
              <span class="dp-author">{{ authorName(post.author) }}</span>
              <span class="dp-time">{{ timeAgo(post.createdAt || post.date) }}</span>
            </div>
            <button v-if="authorName(post.author) === currentUserName" class="btn btn-ghost btn-sm" @click="deletePost(post.id)">✕</button>
          </div>
          <h3 class="dp-title">{{ post.title }}</h3>
          <p class="dp-content">{{ post.content }}</p>
          <div class="dp-actions">
            <button class="post-action" :class="{ liked: post.liked }" @click="toggleLike(post)">
              <svg class="heart-icon" :class="{ 'heart-pop': post.liked }" width="16" height="16" viewBox="0 0 24 24" :fill="post.liked ? '#ef4444' : 'none'" :stroke="post.liked ? '#ef4444' : 'currentColor'" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              <span>{{ post.likes || 0 }}</span>
            </button>
            <button class="post-action" @click="toggleComments(post.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <span>{{ (post.comments || []).length }}</span>
            </button>
          </div>
          <div v-if="expandedPosts.includes(post.id)" class="comments">
            <div v-for="comment in (post.comments || [])" :key="comment.id" class="comment">
              <div class="avatar avatar-sm">{{ authorName(comment.author).charAt(0).toUpperCase() }}</div>
              <div class="comment-body">
                <span class="comment-author">{{ authorName(comment.author) }}</span>
                <p class="comment-text">{{ comment.content }}</p>
              </div>
            </div>
            <div class="comment-compose">
              <input v-model="commentInputs[post.id]" class="reply-input" placeholder="Add a comment..." @keyup.enter="addComment(post)" />
              <button class="btn btn-primary btn-sm" @click="addComment(post)" :disabled="!(commentInputs[post.id] || '').trim()">Post</button>
            </div>
          </div>
        </article>
      </div>

      <!-- Sidebar -->
      <aside class="community-sidebar">
        <div class="card sidebar-card">
          <h3 class="sidebar-title">Start a Discussion</h3>
          <div class="form-group">
            <input v-model="newPost.title" class="form-input" placeholder="Title" />
          </div>
          <div class="form-group">
            <textarea v-model="newPost.content" class="form-textarea" placeholder="Share your thoughts..." rows="3"></textarea>
          </div>
          <button @click="submitPost" class="btn btn-primary btn-block" :disabled="!newPost.title.trim() || !newPost.content.trim()">Post</button>
        </div>

        <div class="card sidebar-card">
          <h3 class="sidebar-title">Trending</h3>
          <div class="trending-list">
            <span class="hashtag" v-for="topic in trendingTopics" :key="topic">#{{ topic }}</span>
          </div>
        </div>

        <div class="card sidebar-card">
          <h3 class="sidebar-title">Active Members</h3>
          <div class="members-list">
            <div v-for="member in activeMembers" :key="member" class="member-item">
              <div class="avatar avatar-sm">{{ member.charAt(0).toUpperCase() }}</div>
              <span>{{ member }}</span>
            </div>
          </div>
        </div>
      </aside>
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
    currentUserName() { return this.currentUser.name || this.currentUser.email || 'User' }
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
      const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
      if (diff < 60) return 'now'
      if (diff < 3600) return Math.floor(diff / 60) + 'm'
      if (diff < 86400) return Math.floor(diff / 3600) + 'h'
      return Math.floor(diff / 86400) + 'd'
    },
    async submitPost() {
      if (!this.newPost.title.trim() || !this.newPost.content.trim()) return
      const post = await api.createCommunityPost({ title: this.newPost.title.trim(), content: this.newPost.content.trim() })
      if (post) this.communityPosts.unshift(post)
      this.newPost = { title: '', content: '' }
    },
    async toggleLike(post) {
      const wasLiked = post.liked
      post.liked = !wasLiked
      post.likes = (post.likes || 0) + (wasLiked ? -1 : 1)
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
    deletePost(postId) { this.communityPosts = this.communityPosts.filter(p => p.id !== postId) },
    async joinGroup(group) {
      const updated = await api.joinGroup(group.id)
      if (updated) {
        const idx = this.groups.findIndex(g => g.id === group.id)
        if (idx >= 0) this.groups.splice(idx, 1, { ...this.groups[idx], ...updated, joined: true })
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
.community-page { max-width: 960px; margin: 0 auto; }
.page-header { margin-bottom: 1.5rem; }
.page-title { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em; margin: 0; }
.page-desc { color: var(--text-secondary); font-size: 0.875rem; margin: 0.25rem 0 0; }

.groups-section { margin-bottom: 2rem; }
.groups-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.875rem; }
.group-card { display: flex; gap: 0.875rem; align-items: flex-start; }
.group-icon { width: 44px; height: 44px; border-radius: var(--radius-xs); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
.group-info { flex: 1; min-width: 0; }
.group-name { margin: 0 0 0.125rem; font-size: 0.875rem; font-weight: 600; }
.group-location { font-size: 0.75rem; color: var(--text-tertiary); margin: 0 0 0.25rem; }
.group-desc { font-size: 0.8125rem; color: var(--text-secondary); margin: 0 0 0.5rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.group-footer { display: flex; justify-content: space-between; align-items: center; }
.group-members { font-size: 0.75rem; color: var(--text-tertiary); }

.community-layout { display: grid; grid-template-columns: 1fr 300px; gap: 1.25rem; align-items: start; }

/* Discussion post */
.discussion-post { margin-bottom: 0.75rem; }
.dp-header { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.625rem; }
.dp-meta { flex: 1; display: flex; align-items: center; gap: 0.5rem; }
.dp-author { font-weight: 600; font-size: 0.8125rem; }
.dp-time { font-size: 0.75rem; color: var(--text-tertiary); }
.dp-title { margin: 0 0 0.25rem; font-size: 0.9375rem; font-weight: 600; letter-spacing: -0.01em; }
.dp-content { color: var(--text-secondary); margin: 0 0 0.625rem; font-size: 0.875rem; line-height: 1.5; }
.dp-actions { display: flex; gap: 0.125rem; }

.post-action {
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.35rem 0.5rem; border: none; background: none;
  color: var(--text-tertiary); cursor: pointer; border-radius: var(--radius-full);
  font-size: 0.8125rem; font-family: var(--font); transition: all var(--transition);
}
.post-action:hover { background: var(--hover); color: var(--text); }
.post-action.liked { color: var(--red); }

.heart-icon { transition: transform 0.2s ease; }
.heart-pop { animation: heartPop 0.35s ease; }
@keyframes heartPop {
  0% { transform: scale(1); }
  30% { transform: scale(1.3); }
  60% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

/* Comments */
.comments { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-light); }
.comment { display: flex; gap: 0.5rem; margin-bottom: 0.625rem; }
.comment-body { flex: 1; }
.comment-author { font-weight: 600; font-size: 0.8125rem; }
.comment-text { margin: 0.125rem 0 0; font-size: 0.8125rem; color: var(--text-secondary); }
.comment-compose { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem; }
.reply-input {
  flex: 1;
  border: 1.5px solid var(--border);
  border-radius: 100px;
  padding: 0.45rem 0.875rem;
  font-size: 0.8125rem;
  font-family: var(--font);
  outline: none;
  background: var(--hover);
  color: var(--text);
  transition: border-color var(--transition);
}
.reply-input:focus { border-color: var(--text); background: var(--bg-card); }
.reply-input::placeholder { color: var(--text-tertiary); }

/* Sidebar */
.sidebar-card { margin-bottom: 0.875rem; }
.sidebar-title { margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 700; }
.trending-list { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.members-list { display: flex; flex-direction: column; gap: 0.5rem; }
.member-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; }

@media (max-width: 900px) {
  .community-layout { grid-template-columns: 1fr; }
  .community-sidebar { order: -1; }
  .groups-grid { grid-template-columns: 1fr; }
}
</style>