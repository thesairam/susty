<template>
  <div class="feed-page">
    <!-- Compose -->
    <div class="compose">
      <div class="compose-row">
        <div class="avatar">{{ currentUserInitial }}</div>
        <div class="compose-body">
          <textarea
            v-model="newPost.content"
            :placeholder="'What\'s on your mind, ' + currentUserName + '?'"
            class="compose-textarea"
            rows="1"
            @input="autoResize"
            @keydown.enter.meta="createPost"
            @keydown.enter.ctrl="createPost"
            ref="composeInput"
          ></textarea>
        </div>
      </div>
      <div v-if="newPost.content && extractHashtags(newPost.content).length" class="compose-tags">
        <span class="badge badge-green" v-for="tag in extractHashtags(newPost.content)" :key="tag">{{ tag }}</span>
      </div>
      <div v-if="newPost.mediaType" class="compose-media">
        <input v-model="newPost.mediaUrl" :placeholder="'Paste ' + newPost.mediaType + ' URL...'" class="form-input" />
        <button class="btn btn-ghost btn-sm" @click="newPost.mediaType = ''; newPost.mediaUrl = ''">✕</button>
      </div>
      <div class="compose-footer">
        <div class="compose-tools">
          <button class="compose-tool" :class="{ active: newPost.mediaType === 'image' }" @click="toggleMediaType('image')" title="Photo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <button class="compose-tool" :class="{ active: newPost.mediaType === 'video' }" @click="toggleMediaType('video')" title="Video">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </button>
          <button class="compose-tool" :class="{ active: newPost.mediaType === 'link' }" @click="toggleMediaType('link')" title="Link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          </button>
        </div>
        <button class="btn btn-primary btn-sm" @click="createPost" :disabled="!canPost">Post</button>
      </div>
    </div>

    <!-- Feed Tabs -->
    <div class="tabs">
      <button class="tab" :class="{ active: feedTab === 'latest' }" @click="feedTab = 'latest'; loadPosts()">Latest</button>
      <button class="tab" :class="{ active: feedTab === 'trending' }" @click="feedTab = 'trending'; loadPosts()">Trending</button>
    </div>

    <!-- Active filter tag -->
    <div v-if="filterTag" class="filter-active">
      <span class="badge badge-dark">#{{ filterTag }}</span>
      <button class="btn btn-ghost btn-sm" @click="filterTag = ''">✕ Clear</button>
    </div>

    <!-- Posts Feed -->
    <div class="feed">
      <div v-if="filteredPosts.length === 0" class="empty-state">
        <div class="empty-state-icon">🌱</div>
        <p>No posts yet. Be the first to share!</p>
      </div>

      <article v-for="post in filteredPosts" :key="post.id" class="post">
        <div class="post-thread-line" v-if="expandedPosts.includes(post.id) && (post.replies || []).length"></div>
        <div class="post-avatar">
          <div class="avatar">{{ getInitial(postAuthorName(post)) }}</div>
        </div>
        <div class="post-body">
          <!-- Header -->
          <div class="post-head">
            <span class="post-author">{{ postAuthorName(post) }}</span>
            <span class="post-time">{{ timeAgo(post.createdAt) }}</span>
            <div class="post-menu-wrap">
              <button class="post-menu-btn" @click.stop="togglePostMenu(post.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </button>
              <div v-if="openMenu === post.id" class="post-dropdown">
                <button @click="deletePost(post.id)">Delete</button>
                <button @click="openMenu = null">Report</button>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="post-text" v-html="renderContent(post.content)"></div>

          <!-- Media -->
          <div v-if="post.mediaUrl" class="post-media" :class="'media-' + post.mediaType">
            <template v-if="post.mediaType === 'image'">🖼️</template>
            <template v-else-if="post.mediaType === 'video'">🎬</template>
            <template v-else>🔗</template>
            <span>{{ post.mediaUrl }}</span>
          </div>

          <!-- Tags -->
          <div v-if="post.hashtags && post.hashtags.length && post.hashtags[0]" class="post-tags">
            <span class="hashtag" v-for="tag in post.hashtags" :key="tag" @click="filterByTag(tag)">#{{ tag }}</span>
          </div>

          <!-- Actions -->
          <div class="post-actions">
            <button class="post-action" :class="{ liked: post.liked }" @click="toggleLike(post)">
              <svg width="18" height="18" viewBox="0 0 24 24" :fill="post.liked ? '#ef4444' : 'none'" :stroke="post.liked ? '#ef4444' : 'currentColor'" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              <span v-if="post.likes">{{ post.likes }}</span>
            </button>
            <button class="post-action" @click="toggleReplies(post.id)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <span v-if="(post.replies || []).length">{{ (post.replies || []).length }}</span>
            </button>
            <button class="post-action" @click="repost(post)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
              <span v-if="post.reposts">{{ post.reposts }}</span>
            </button>
            <button class="post-action" @click="sharePost(post)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
          </div>

          <!-- Replies -->
          <div v-if="expandedPosts.includes(post.id)" class="replies">
            <div v-for="reply in (post.replies || [])" :key="reply.id" class="reply">
              <div class="avatar avatar-sm">{{ getInitial(reply.author ? reply.author.name || reply.author : '?') }}</div>
              <div class="reply-body">
                <div class="reply-head">
                  <span class="post-author">{{ reply.author ? reply.author.name || reply.author : 'Unknown' }}</span>
                  <span class="post-time">{{ timeAgo(reply.createdAt) }}</span>
                </div>
                <p class="reply-text" v-html="renderContent(reply.content)"></p>
              </div>
            </div>
            <div class="reply-compose">
              <div class="avatar avatar-sm">{{ currentUserInitial }}</div>
              <input
                v-model="replyInputs[post.id]"
                placeholder="Reply..."
                class="reply-input"
                @keyup.enter="addReply(post)"
              />
              <button class="btn btn-primary btn-sm" @click="addReply(post)" :disabled="!(replyInputs[post.id] || '').trim()">Reply</button>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script>
import api from '../services/api'

export default {
  name: 'HomeView',
  data() {
    return {
      posts: [],
      newPost: { content: '', mediaType: '', mediaUrl: '' },
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
    currentUserName() { return this.currentUser.name || 'User' },
    currentUserInitial() { return this.getInitial(this.currentUserName) },
    canPost() { return this.newPost.content.trim().length > 0 },
    filteredPosts() {
      let result = [...this.posts]
      if (this.filterTag) result = result.filter(p => p.hashtags && p.hashtags.includes(this.filterTag))
      if (this.feedTab === 'trending') result.sort((a, b) => (b.likes || 0) - (a.likes || 0))
      return result
    }
  },
  created() {
    this.loadPosts()
    document.addEventListener('click', this.closeMenus)
  },
  beforeUnmount() { document.removeEventListener('click', this.closeMenus) },
  methods: {
    postAuthorName(post) {
      if (post.author && typeof post.author === 'object') return post.author.name
      return post.author || 'Unknown'
    },
    extractHashtags(text) { return text.match(/#\w+/g) || [] },
    renderContent(text) {
      if (!text) return ''
      return text.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
    },
    getInitial(name) { return name ? name.charAt(0).toUpperCase() : '?' },
    timeAgo(dateStr) {
      const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
      if (diff < 60) return 'now'
      if (diff < 3600) return Math.floor(diff / 60) + 'm'
      if (diff < 86400) return Math.floor(diff / 3600) + 'h'
      if (diff < 604800) return Math.floor(diff / 86400) + 'd'
      return new Date(dateStr).toLocaleDateString()
    },
    autoResize(e) {
      const t = e.target
      t.style.height = 'auto'
      t.style.height = t.scrollHeight + 'px'
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
      if (this.$refs.composeInput) this.$refs.composeInput.style.height = 'auto'
    },
    async toggleLike(post) {
      const res = await api.likePost(post.id)
      if (res) Object.assign(post, res)
    },
    async repost(post) {
      await api.repostPost(post.id)
      await this.loadPosts()
    },
    sharePost(post) { navigator.clipboard?.writeText(post.content) },
    toggleReplies(postId) {
      const idx = this.expandedPosts.indexOf(postId)
      if (idx >= 0) this.expandedPosts.splice(idx, 1)
      else this.expandedPosts.push(postId)
    },
    async addReply(post) {
      const text = (this.replyInputs[post.id] || '').trim()
      if (!text) return
      const res = await api.addReply(post.id, text)
      if (res) Object.assign(post, res)
      this.replyInputs[post.id] = ''
    },
    togglePostMenu(postId) { this.openMenu = this.openMenu === postId ? null : postId },
    closeMenus() { this.openMenu = null },
    async deletePost(postId) {
      await api.deletePost(postId)
      this.posts = this.posts.filter(p => p.id !== postId)
      this.openMenu = null
    },
    filterByTag(tag) { this.filterTag = this.filterTag === tag ? '' : tag },
    async loadPosts() {
      const sort = this.feedTab === 'trending' ? 'trending' : 'latest'
      const res = await api.getPosts(sort)
      if (res) this.posts = res
    }
  }
}
</script>

<style scoped>
.feed-page { max-width: 640px; margin: 0 auto; }

/* ── Compose ── */
.compose {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 1rem 1.25rem;
  margin-bottom: 0.5rem;
}
.compose-row { display: flex; gap: 0.75rem; align-items: flex-start; }
.compose-body { flex: 1; }
.compose-textarea {
  width: 100%;
  border: none;
  font-size: 0.9375rem;
  font-family: var(--font);
  color: var(--text);
  resize: none;
  outline: none;
  line-height: 1.5;
  min-height: 24px;
  background: transparent;
}
.compose-textarea::placeholder { color: var(--text-tertiary); }
.compose-tags { display: flex; gap: 0.375rem; margin-top: 0.5rem; flex-wrap: wrap; padding-left: 52px; }
.compose-media { display: flex; gap: 0.5rem; margin-top: 0.625rem; padding-left: 52px; }
.compose-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-light);
}
.compose-tools { display: flex; gap: 0.125rem; }
.compose-tool {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  border-radius: var(--radius-full);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition);
}
.compose-tool:hover { color: var(--green); background: var(--green-50); }
.compose-tool.active { color: var(--green); }

/* ── Filter Active ── */
.filter-active {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

/* ── Post ── */
.post {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border-light);
  position: relative;
}
.post:last-child { border-bottom: none; }
.post-avatar { flex-shrink: 0; position: relative; z-index: 1; }
.post-thread-line {
  position: absolute;
  left: 19px;
  top: 52px;
  bottom: 0;
  width: 2px;
  background: var(--border);
  z-index: 0;
}
.post-body { flex: 1; min-width: 0; }
.post-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
.post-author {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text);
  letter-spacing: -0.01em;
}
.post-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}
.post-menu-wrap {
  margin-left: auto;
  position: relative;
}
.post-menu-btn {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-full);
  display: flex;
  transition: all var(--transition);
}
.post-menu-btn:hover { background: var(--hover); color: var(--text); }
.post-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  box-shadow: var(--shadow-lg);
  z-index: 20;
  min-width: 120px;
  overflow: hidden;
}
.post-dropdown button {
  display: block;
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.8125rem;
  font-family: var(--font);
  color: var(--text);
}
.post-dropdown button:hover { background: var(--hover); }
.post-dropdown button:first-child { color: var(--red); }

.post-text {
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--text);
  word-wrap: break-word;
  margin-bottom: 0.375rem;
}

.post-media {
  margin: 0.5rem 0;
  padding: 1rem;
  border-radius: var(--radius-xs);
  font-size: 0.8125rem;
  color: var(--text-secondary);
  word-break: break-all;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.media-image { background: var(--green-50); }
.media-video { background: var(--blue-light); }
.media-link { background: var(--orange-light); }

.post-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.375rem;
}

.post-actions {
  display: flex;
  gap: 0.125rem;
  margin-top: 0.375rem;
}
.post-action {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.375rem 0.625rem;
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-family: var(--font);
  transition: all var(--transition);
}
.post-action:hover { background: var(--hover); color: var(--text); }
.post-action.liked { color: var(--red); }

/* ── Replies ── */
.replies { margin-top: 0.75rem; }
.reply {
  display: flex;
  gap: 0.625rem;
  padding: 0.625rem 0;
}
.reply-body { flex: 1; min-width: 0; }
.reply-head { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.125rem; }
.reply-text { font-size: 0.875rem; line-height: 1.5; color: var(--text); margin: 0; }
.reply-compose {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
}
.reply-input {
  flex: 1;
  border: 1.5px solid var(--border);
  border-radius: 100px;
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  font-family: var(--font);
  outline: none;
  transition: border-color var(--transition);
  background: var(--hover);
  color: var(--text);
}
.reply-input:focus { border-color: var(--text); background: var(--bg-card); }
.reply-input::placeholder { color: var(--text-tertiary); }

@media (max-width: 768px) {
  .feed-page { padding: 0; }
  .compose { border-radius: 0; border-left: none; border-right: none; }
  .post { padding: 1rem 0.25rem; }
}
</style>