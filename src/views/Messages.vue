<template>
  <div class="messages-page">
    <h1 class="page-title">Messages</h1>

    <div class="messages-layout">
      <!-- Conversations List -->
      <div class="conversations card">
        <div class="conversations-header">
          <input v-model="searchQuery" class="form-input search-input" placeholder="Search conversations..." />
          <button class="btn btn-primary new-chat-btn" @click="showRootsPicker = !showRootsPicker" title="New Chat">+</button>
        </div>

        <!-- Roots Picker -->
        <div v-if="showRootsPicker" class="roots-picker">
          <div class="roots-picker-header">
            <strong>Start a chat with a Root</strong>
            <button class="close-btn" @click="showRootsPicker = false">✕</button>
          </div>
          <div v-if="roots.length === 0" class="empty-state-mini">
            <p>No Roots yet. Connect with people to start chatting!</p>
          </div>
          <div v-for="root in roots" :key="root.user.id" class="root-item" @click="startChatWithRoot(root.user)">
            <div class="avatar avatar-sm">{{ root.user.name?.charAt(0).toUpperCase() }}</div>
            <span>{{ root.user.name }}</span>
          </div>
        </div>

        <div class="conversations-list">
          <div v-if="filteredConversations.length === 0" class="empty-state-mini">
            <p>No conversations yet</p>
          </div>
          <div
            v-for="convo in filteredConversations"
            :key="convo.participant"
            class="convo-item"
            :class="{ active: activeConversation === convo.participant }"
            @click="selectConversation(convo.participant, convo.participantId)"
          >
            <div class="avatar">{{ convo.participant.charAt(0).toUpperCase() }}</div>
            <div class="convo-info">
              <div class="convo-top">
                <strong>{{ convo.participant }}</strong>
                <span class="convo-time">{{ timeAgo(convo.lastDate) }}</span>
              </div>
              <p class="convo-preview">{{ convo.lastMessage }}</p>
            </div>
            <span v-if="convo.unread" class="unread-dot"></span>
          </div>
        </div>
      </div>

      <!-- Chat Area -->
      <div class="chat-area card">
        <div v-if="!activeConversation" class="empty-state">
          <p>Select a conversation or start a new chat with a Root</p>
        </div>

        <template v-else>
          <div class="chat-header">
            <div class="avatar avatar-sm">{{ activeConversation.charAt(0).toUpperCase() }}</div>
            <strong>{{ activeConversation }}</strong>
            <router-link v-if="activeConversationUserId" :to="`/user/${activeConversationUserId}`" class="view-profile-link">View Profile</router-link>
          </div>

          <div class="chat-messages" ref="chatMessages">
            <div
              v-for="msg in activeMessages"
              :key="msg.id"
              class="message"
              :class="{ sent: msg.from === currentUserName, received: msg.from !== currentUserName }"
            >
              <div class="message-bubble">
                <p>{{ msg.content }}</p>
                <span class="message-time">{{ formatTime(msg.date) }}</span>
              </div>
            </div>
          </div>

          <div class="chat-input">
            <input
              v-model="newMessage"
              class="form-input"
              placeholder="Type a message..."
              @keyup.enter="sendMessage"
            />
            <button class="btn btn-primary" @click="sendMessage" :disabled="!newMessage.trim()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'MessagesView',
  data() {
    return {
      rawMessages: [],
      roots: [],
      searchQuery: '',
      activeConversation: null,
      activeConversationName: '',
      activeConversationUserId: null,
      newMessage: '',
      showRootsPicker: false,
    }
  },
  computed: {
    currentUser() {
      try { return JSON.parse(localStorage.getItem('susty_user')) || {} } catch { return {} }
    },
    currentUserName() { return this.currentUser.name || this.currentUser.email || 'User' },
    currentUserId() { return this.currentUser.id },
    conversations() {
      const convos = {}
      this.rawMessages.forEach(msg => {
        const isSender = msg.senderId === this.currentUserId || (msg.sender && msg.sender.id === this.currentUserId)
        const other = isSender ? msg.receiver : msg.sender
        if (!other) return
        const otherName = typeof other === 'object' ? other.name : other
        const otherId = typeof other === 'object' ? other.id : null
        const key = otherId || otherName
        const msgDate = msg.createdAt || msg.date
        if (!convos[key] || new Date(msgDate) > new Date(convos[key].lastDate)) {
          convos[key] = { participant: otherName, participantId: otherId, lastMessage: msg.text || msg.content || '', lastDate: msgDate }
        }
      })
      return Object.values(convos).sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate))
    },
    filteredConversations() {
      if (!this.searchQuery.trim()) return this.conversations
      const q = this.searchQuery.toLowerCase()
      return this.conversations.filter(c => c.participant.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q))
    },
    activeMessages() {
      if (!this.activeConversationUserId) return []
      return this.rawMessages
        .filter(msg => {
          const sId = msg.senderId || (msg.sender && msg.sender.id)
          const rId = msg.receiverId || (msg.receiver && msg.receiver.id)
          return (sId === this.currentUserId && rId === this.activeConversationUserId) ||
                 (sId === this.activeConversationUserId && rId === this.currentUserId)
        })
        .map(msg => {
          const isSender = (msg.senderId || (msg.sender && msg.sender.id)) === this.currentUserId
          return {
            id: msg.id,
            from: isSender ? this.currentUserName : this.activeConversationName,
            content: msg.text || msg.content || '',
            date: msg.createdAt || msg.date
          }
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    }
  },
  created() {
    this.loadMessages()
    this.loadRoots()
  },
  mounted() {
    // Handle incoming deep link from UserProfile "Message" button
    const { userId, userName } = this.$route.query
    if (userId) {
      this.activeConversationUserId = Number(userId)
      this.activeConversation = userName || 'User'
      this.activeConversationName = userName || 'User'
      this.loadConversationForUser(Number(userId))
    }
  },
  methods: {
    async selectConversation(participant, participantId) {
      this.activeConversation = participant
      this.activeConversationName = participant
      this.activeConversationUserId = participantId
      this.showRootsPicker = false
      if (participantId) {
        await this.loadConversationForUser(participantId)
      }
      this.$nextTick(() => this.scrollToBottom())
    },
    async loadConversationForUser(userId) {
      const msgs = await api.getConversation(userId)
      if (msgs) {
        const otherIds = new Set(msgs.map(m => m.id))
        this.rawMessages = this.rawMessages.filter(m => !otherIds.has(m.id)).concat(msgs)
      }
    },
    startChatWithRoot(user) {
      this.activeConversation = user.name
      this.activeConversationName = user.name
      this.activeConversationUserId = user.id
      this.showRootsPicker = false
      this.loadConversationForUser(user.id)
      this.$nextTick(() => this.scrollToBottom())
    },
    async sendMessage() {
      if (!this.newMessage.trim() || !this.activeConversationUserId) return
      const msg = await api.sendMessage(this.activeConversationUserId, this.newMessage.trim())
      if (msg && !msg.error) {
        this.rawMessages.push(msg)
        this.newMessage = ''
        this.$nextTick(() => this.scrollToBottom())
      } else if (msg?.message) {
        alert(msg.message)
      }
    },
    scrollToBottom() {
      const el = this.$refs.chatMessages
      if (el) el.scrollTop = el.scrollHeight
    },
    timeAgo(dateStr) {
      const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
      if (diff < 60) return 'now'
      if (diff < 3600) return Math.floor(diff / 60) + 'm'
      if (diff < 86400) return Math.floor(diff / 3600) + 'h'
      return Math.floor(diff / 86400) + 'd'
    },
    formatTime(dateStr) {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    async loadMessages() {
      const data = await api.getMessages()
      if (data) this.rawMessages = data
    },
    async loadRoots() {
      const data = await api.getRoots()
      if (data) this.roots = data
    }
  }
}
</script>

<style scoped>
.messages-page { max-width: 960px; margin: 0 auto; }
.page-title { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em; margin: 0 0 1.25rem; }

.messages-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 0.875rem;
  height: calc(100vh - 220px);
  min-height: 500px;
}

.conversations { display: flex; flex-direction: column; overflow: hidden; }
.conversations-header { padding-bottom: 0.625rem; display: flex; gap: 0.5rem; align-items: center; }
.search-input { font-size: 0.8125rem; flex: 1; }
.new-chat-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  padding: 0;
  font-size: 1.25rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Roots Picker */
.roots-picker {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}
.roots-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.8125rem;
}
.close-btn { background: none; border: none; cursor: pointer; color: var(--text-tertiary); font-size: 0.875rem; }
.close-btn:hover { color: var(--text); }
.root-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: background 0.15s;
}
.root-item:hover { background: var(--hover); }

.conversations-list { flex: 1; overflow-y: auto; margin: 0 -1.25rem; }

.convo-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}
.convo-item:hover { background: var(--hover); }
.convo-item.active { background: var(--green-50); }
.convo-info { flex: 1; min-width: 0; }
.convo-top { display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; }
.convo-time { font-size: 0.6875rem; color: var(--text-tertiary); }
.convo-preview {
  margin: 0.1rem 0 0;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); flex-shrink: 0; }
.empty-state-mini { padding: 2rem 1rem; text-align: center; color: var(--text-tertiary); font-size: 0.8125rem; }

.chat-area { display: flex; flex-direction: column; overflow: hidden; }
.chat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.625rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 0.625rem;
  font-size: 0.9375rem;
}
.view-profile-link {
  margin-left: auto;
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  text-decoration: none;
}
.view-profile-link:hover { color: var(--green); }
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.message { display: flex; }
.message.sent { justify-content: flex-end; }
.message.received { justify-content: flex-start; }
.message-bubble {
  max-width: 70%;
  padding: 0.5rem 0.75rem;
  border-radius: 18px;
  font-size: 0.875rem;
  line-height: 1.4;
}
.message-bubble p { margin: 0; }
.message.sent .message-bubble {
  background: var(--text);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.message.received .message-bubble {
  background: var(--hover);
  color: var(--text);
  border-bottom-left-radius: 4px;
}
.message-time {
  display: block;
  font-size: 0.625rem;
  opacity: 0.5;
  margin-top: 0.2rem;
  text-align: right;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.625rem;
  border-top: 1px solid var(--border);
  margin-top: 0.625rem;
}
.chat-input .form-input { flex: 1; border-radius: 100px; padding-left: 1rem; }
.chat-input .btn { border-radius: 100px; padding: 0.5rem 0.75rem; }

@media (max-width: 768px) {
  .messages-layout { grid-template-columns: 1fr; height: auto; }
  .conversations { max-height: 280px; }
}
</style>
