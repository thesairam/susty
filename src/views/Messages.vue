<template>
  <div class="messages">
    <h1>💬 Messages</h1>

    <div class="messages-layout">
      <!-- Conversations List -->
      <div class="conversations card">
        <div class="conversations-header">
          <input v-model="searchQuery" class="form-input" placeholder="🔍 Search conversations..." />
        </div>
        <div class="conversations-list">
          <div v-if="filteredConversations.length === 0" class="empty-state">
            <p>No conversations yet. Start one from the Marketplace!</p>
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
          <div class="empty-state-icon">💬</div>
          <p>Select a conversation to start chatting</p>
        </div>

        <template v-else>
          <div class="chat-header">
            <div class="avatar">{{ activeConversation.charAt(0).toUpperCase() }}</div>
            <strong>{{ activeConversation }}</strong>
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
            <button class="btn btn-primary" @click="sendMessage" :disabled="!newMessage.trim()">Send</button>
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
      searchQuery: '',
      activeConversation: null,
      activeConversationName: '',
      activeConversationUserId: null,
      newMessage: ''
    }
  },
  computed: {
    currentUser() {
      try { return JSON.parse(localStorage.getItem('susty_user')) || {} } catch { return {} }
    },
    currentUserName() {
      return this.currentUser.name || this.currentUser.email || 'User'
    },
    currentUserId() {
      return this.currentUser.id
    },
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
          convos[key] = {
            participant: otherName,
            participantId: otherId,
            lastMessage: msg.text || msg.content || '',
            lastDate: msgDate
          }
        }
      })
      return Object.values(convos).sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate))
    },
    filteredConversations() {
      if (!this.searchQuery.trim()) return this.conversations
      const q = this.searchQuery.toLowerCase()
      return this.conversations.filter(c =>
        c.participant.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      )
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
  },
  methods: {
    async selectConversation(participant, participantId) {
      this.activeConversation = participant
      this.activeConversationName = participant
      this.activeConversationUserId = participantId
      if (participantId) {
        const msgs = await api.getConversation(participantId)
        if (msgs) {
          // merge into rawMessages replacing existing ones for this conversation
          const otherIds = new Set(msgs.map(m => m.id))
          this.rawMessages = this.rawMessages.filter(m => !otherIds.has(m.id)).concat(msgs)
        }
      }
      this.$nextTick(() => this.scrollToBottom())
    },
    async sendMessage() {
      if (!this.newMessage.trim() || !this.activeConversationUserId) return
      const msg = await api.sendMessage(this.activeConversationUserId, this.newMessage.trim())
      if (msg) this.rawMessages.push(msg)
      this.newMessage = ''
      this.$nextTick(() => this.scrollToBottom())
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
    }
  }
}
</script>

<style scoped>
h1 { margin: 0 0 1.5rem; font-size: 1.8rem; }

.messages-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.25rem;
  height: calc(100vh - 220px);
  min-height: 500px;
}

.conversations {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.conversations-header { padding-bottom: 0.75rem; }
.conversations-list { flex: 1; overflow-y: auto; margin: 0 -1.5rem; padding: 0; }

.convo-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.5rem;
  cursor: pointer;
  transition: background var(--transition);
  position: relative;
}
.convo-item:hover { background: var(--light-bg); }
.convo-item.active { background: var(--light-green); }
.convo-info { flex: 1; min-width: 0; }
.convo-top { display: flex; justify-content: space-between; align-items: center; }
.convo-time { font-size: 0.75rem; color: var(--muted-text); }
.convo-preview {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: var(--muted-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.unread-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary-green);
  flex-shrink: 0;
}

.chat-area {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 0.75rem;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message { display: flex; }
.message.sent { justify-content: flex-end; }
.message.received { justify-content: flex-start; }
.message-bubble {
  max-width: 70%;
  padding: 0.65rem 0.95rem;
  border-radius: 16px;
  font-size: 0.9rem;
  line-height: 1.4;
}
.message-bubble p { margin: 0; }
.message.sent .message-bubble {
  background: var(--primary-green);
  color: white;
  border-bottom-right-radius: 4px;
}
.message.received .message-bubble {
  background: #f0f0f0;
  color: var(--dark-text);
  border-bottom-left-radius: 4px;
}
.message-time {
  display: block;
  font-size: 0.65rem;
  opacity: 0.7;
  margin-top: 0.25rem;
  text-align: right;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
  margin-top: 0.75rem;
}
.chat-input .form-input { flex: 1; }

@media (max-width: 768px) {
  .messages-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
  .conversations { max-height: 300px; }
}
</style>
