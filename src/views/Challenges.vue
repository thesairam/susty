<template>
  <div class="challenges">
    <div class="challenges-header">
      <div>
        <h1>🏆 Community Challenges</h1>
        <p class="challenges-subtitle">Join weekly and monthly sustainability challenges. Earn badges and climb the leaderboard!</p>
      </div>
    </div>

    <!-- Active Challenge Spotlight -->
    <div class="spotlight card">
      <div class="spotlight-badge">🔥 THIS WEEK</div>
      <h2>{{ activeChallenge.name }}</h2>
      <p>{{ activeChallenge.description }}</p>
      <div class="spotlight-meta">
        <span>⏳ {{ activeChallenge.daysLeft }} days left</span>
        <span>👥 {{ activeChallenge.participants }} participants</span>
        <span>🌿 {{ activeChallenge.co2Impact }} kg CO₂ impact</span>
      </div>
      <div class="spotlight-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: getProgress(activeChallenge.id) + '%' }"></div>
        </div>
        <span class="progress-text">{{ getProgress(activeChallenge.id) }}% complete</span>
      </div>
      <div class="spotlight-actions">
        <button
          v-if="getStatus(activeChallenge.id) === 'none'"
          class="btn btn-primary btn-lg"
          @click="joinChallenge(activeChallenge)"
        >Join Challenge</button>
        <button
          v-else-if="getStatus(activeChallenge.id) === 'joined'"
          class="btn btn-primary btn-lg"
          @click="completeChallenge(activeChallenge)"
        >✅ Mark Complete</button>
        <span v-else class="completed-badge">🎉 Completed!</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'weekly' }" @click="tab = 'weekly'">Weekly</button>
      <button class="tab" :class="{ active: tab === 'monthly' }" @click="tab = 'monthly'">Monthly</button>
      <button class="tab" :class="{ active: tab === 'leaderboard' }" @click="tab = 'leaderboard'">Leaderboard</button>
    </div>

    <!-- Challenge Cards -->
    <div v-if="tab !== 'leaderboard'" class="challenges-grid">
      <div v-for="challenge in filteredChallenges" :key="challenge.id" class="challenge-card card">
        <div class="challenge-icon">{{ challenge.icon }}</div>
        <div class="challenge-info">
          <h3>{{ challenge.name }}</h3>
          <p class="challenge-desc">{{ challenge.description }}</p>
          <div class="challenge-meta">
            <span class="badge" :class="challenge.difficulty === 'Easy' ? 'badge-green' : challenge.difficulty === 'Medium' ? 'badge-blue' : 'badge-orange'">
              {{ challenge.difficulty }}
            </span>
            <span>👥 {{ challenge.participants }}</span>
            <span>🌿 {{ challenge.co2Impact }} kg CO₂</span>
          </div>
          <div class="challenge-progress" v-if="getStatus(challenge.id) !== 'none'">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: getProgress(challenge.id) + '%' }"></div>
            </div>
          </div>
          <div class="challenge-actions">
            <button
              v-if="getStatus(challenge.id) === 'none'"
              class="btn btn-outline btn-sm"
              @click="joinChallenge(challenge)"
            >Join</button>
            <button
              v-else-if="getStatus(challenge.id) === 'joined'"
              class="btn btn-primary btn-sm"
              @click="completeChallenge(challenge)"
            >Complete</button>
            <span v-else class="completed-text">✅ Done</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Leaderboard -->
    <div v-if="tab === 'leaderboard'" class="leaderboard card">
      <div class="leaderboard-row header">
        <span class="lb-rank">#</span>
        <span class="lb-user">User</span>
        <span class="lb-challenges">Challenges</span>
        <span class="lb-co2">CO₂ Saved</span>
        <span class="lb-points">Points</span>
      </div>
      <div v-for="(entry, index) in leaderboard" :key="entry.name" class="leaderboard-row" :class="{ 'is-you': entry.isYou }">
        <span class="lb-rank">
          <span v-if="index === 0">🥇</span>
          <span v-else-if="index === 1">🥈</span>
          <span v-else-if="index === 2">🥉</span>
          <span v-else>{{ index + 1 }}</span>
        </span>
        <span class="lb-user">
          <div class="avatar avatar-sm">{{ entry.name.charAt(0).toUpperCase() }}</div>
          {{ entry.name }} <span v-if="entry.isYou" class="you-tag">(You)</span>
        </span>
        <span class="lb-challenges">{{ entry.completed }}</span>
        <span class="lb-co2">{{ entry.co2 }} kg</span>
        <span class="lb-points">{{ entry.points }}</span>
      </div>
    </div>

    <!-- Rewards Section -->
    <section class="rewards-section">
      <h2 class="section-title">🎖️ Challenge Rewards</h2>
      <div class="grid-4">
        <div class="card reward-card" v-for="reward in rewards" :key="reward.id">
          <span class="reward-icon">{{ reward.icon }}</span>
          <strong>{{ reward.name }}</strong>
          <span class="reward-req">{{ reward.requirement }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'ChallengesView',
  data() {
    return {
      tab: 'weekly',
      progress: {},
      challenges: [],
      leaderboardData: [],
      rewards: [
        { id: 1, icon: '🌱', name: 'Green Starter', requirement: 'Complete 1 challenge' },
        { id: 2, icon: '🌿', name: 'Eco Warrior', requirement: 'Complete 5 challenges' },
        { id: 3, icon: '🌍', name: 'Planet Protector', requirement: 'Complete 10 challenges' },
        { id: 4, icon: '♾️', name: 'Sustainability Legend', requirement: 'Complete 25 challenges' }
      ]
    }
  },
  computed: {
    currentUser() {
      try { return JSON.parse(localStorage.getItem('susty_user')) || {} } catch { return {} }
    },
    currentUserName() {
      return this.currentUser.name || this.currentUser.email || 'User'
    },
    activeChallenge() {
      return this.challenges[0]
    },
    filteredChallenges() {
      return this.challenges.filter(c => c.type === this.tab)
    },
    leaderboard() {
      const completedCount = Object.values(this.progress).filter(v => v === 'completed').length
      const entries = this.leaderboardData.map(e => ({
        name: e.name,
        completed: parseInt(e.completed) || 0,
        co2: ((parseInt(e.completed) || 0) * 12).toFixed(0),
        points: (parseInt(e.completed) || 0) * 100,
        isYou: e.userId === this.currentUser.id
      }))
      const hasYou = entries.some(e => e.isYou)
      if (!hasYou) {
        entries.push({
          name: this.currentUserName,
          completed: completedCount,
          co2: (completedCount * 12).toFixed(0),
          points: completedCount * 100,
          isYou: true
        })
      }
      return entries.sort((a, b) => b.points - a.points)
    }
  },
  created() {
    this.loadChallenges()
  },
  methods: {
    challengeName(c) {
      return c.title || c.name
    },
    getStatus(challengeId) {
      return this.progress[challengeId] || 'none'
    },
    getProgress(challengeId) {
      const status = this.progress[challengeId]
      if (status === 'completed') return 100
      if (status === 'joined') return 40
      return 0
    },
    async joinChallenge(challenge) {
      await api.joinChallenge(challenge.id)
      this.progress[challenge.id] = 'joined'
      challenge.participants = (challenge.participants || 0) + 1
    },
    async completeChallenge(challenge) {
      await api.completeChallenge(challenge.id)
      this.progress[challenge.id] = 'completed'
    },
    async loadChallenges() {
      const [challenges, progress, leaderboard] = await Promise.all([
        api.getChallenges(),
        api.getChallengeProgress().catch(() => ({})),
        api.getLeaderboard().catch(() => [])
      ])
      if (challenges) {
        this.challenges = challenges.map(c => ({
          ...c,
          name: c.title || c.name,
          participants: 0,
          daysLeft: c.type === 'weekly' ? 5 : 20
        }))
      }
      if (progress) this.progress = progress
      if (leaderboard) this.leaderboardData = leaderboard
    }
  }
}
</script>

<style scoped>
.challenges-header { margin-bottom: 1.5rem; }
.challenges-header h1 { margin: 0 0 0.25rem; font-size: 1.8rem; }
.challenges-subtitle { color: var(--muted-text); margin: 0; }

.spotlight {
  background: linear-gradient(135deg, var(--primary-green), var(--primary-blue));
  color: white;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
}
.spotlight-badge {
  display: inline-block;
  background: rgba(255,255,255,0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}
.spotlight h2 { margin: 0 0 0.5rem; font-size: 1.5rem; }
.spotlight p { opacity: 0.9; margin: 0 0 1rem; }
.spotlight-meta { display: flex; gap: 1.5rem; margin-bottom: 1rem; font-size: 0.9rem; opacity: 0.85; }
.spotlight-progress { margin-bottom: 1rem; }
.progress-bar { height: 8px; background: rgba(255,255,255,0.3); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: white; border-radius: 4px; transition: width 0.6s ease; }
.progress-text { font-size: 0.8rem; opacity: 0.8; }
.spotlight-actions { display: flex; align-items: center; gap: 1rem; }
.spotlight .btn-primary { background: white; color: var(--primary-green); }
.spotlight .btn-primary:hover { background: rgba(255,255,255,0.9); }
.completed-badge { font-size: 1.2rem; font-weight: 700; }

.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}
.challenge-card {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}
.challenge-icon { font-size: 2.5rem; flex-shrink: 0; }
.challenge-info { flex: 1; }
.challenge-info h3 { margin: 0 0 0.25rem; font-size: 1rem; }
.challenge-desc { font-size: 0.85rem; color: var(--muted-text); margin: 0 0 0.5rem; line-height: 1.4; }
.challenge-meta { display: flex; gap: 0.75rem; align-items: center; font-size: 0.8rem; color: var(--muted-text); margin-bottom: 0.5rem; flex-wrap: wrap; }
.challenge-progress { margin-bottom: 0.5rem; }
.challenge-progress .progress-bar { background: var(--border-color); }
.challenge-progress .progress-fill { background: var(--primary-green); }
.challenge-actions { margin-top: 0.25rem; }
.completed-text { color: var(--primary-green); font-weight: 600; font-size: 0.85rem; }

.leaderboard { padding: 0; overflow: hidden; margin-bottom: 2rem; }
.leaderboard-row {
  display: grid;
  grid-template-columns: 50px 1fr 100px 100px 80px;
  align-items: center;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.9rem;
}
.leaderboard-row.header { font-weight: 700; background: var(--light-bg); font-size: 0.8rem; color: var(--muted-text); text-transform: uppercase; }
.leaderboard-row.is-you { background: var(--light-green); }
.lb-user { display: flex; align-items: center; gap: 0.5rem; }
.you-tag { font-size: 0.75rem; color: var(--primary-green); }

.rewards-section { margin-bottom: 2rem; }
.reward-card { text-align: center; }
.reward-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
.reward-req { font-size: 0.8rem; color: var(--muted-text); display: block; margin-top: 0.25rem; }

@media (max-width: 768px) {
  .spotlight-meta { flex-direction: column; gap: 0.5rem; }
  .challenges-grid { grid-template-columns: 1fr; }
  .leaderboard-row { grid-template-columns: 40px 1fr 60px 70px 60px; font-size: 0.8rem; padding: 0.65rem 0.75rem; }
}
</style>
