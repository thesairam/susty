<template>
  <div class="challenges-page">
    <div class="page-header">
      <h1 class="page-title">Challenges</h1>
      <p class="page-desc">Join sustainability challenges, earn badges, climb the leaderboard.</p>
    </div>

    <!-- Spotlight -->
    <div v-if="activeChallenge" class="spotlight card">
      <div class="spotlight-label">This Week</div>
      <h2 class="spotlight-title">{{ activeChallenge.name }}</h2>
      <p class="spotlight-desc">{{ activeChallenge.description }}</p>
      <div class="spotlight-stats">
        <span>{{ activeChallenge.daysLeft }}d left</span>
        <span>{{ activeChallenge.participants }} joined</span>
        <span>{{ activeChallenge.co2Impact }} kg CO₂</span>
      </div>
      <div class="progress-bar spotlight-bar"><div class="progress-fill" :style="{ width: getProgress(activeChallenge.id) + '%' }"></div></div>
      <span class="spotlight-progress-text">{{ getProgress(activeChallenge.id) }}%</span>
      <div class="spotlight-action">
        <button v-if="getStatus(activeChallenge.id) === 'none'" class="btn btn-green" @click="joinChallenge(activeChallenge)">Join Challenge</button>
        <button v-else-if="getStatus(activeChallenge.id) === 'joined'" class="btn btn-green" @click="completeChallenge(activeChallenge)">Mark Complete</button>
        <span v-else class="badge badge-green">Completed</span>
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
        <div class="cc-icon">{{ challenge.icon }}</div>
        <div class="cc-body">
          <h3 class="cc-name">{{ challenge.name }}</h3>
          <p class="cc-desc">{{ challenge.description }}</p>
          <div class="cc-meta">
            <span class="badge" :class="challenge.difficulty === 'Easy' ? 'badge-green' : challenge.difficulty === 'Medium' ? 'badge-blue' : 'badge-orange'">{{ challenge.difficulty }}</span>
            <span>{{ challenge.participants }} joined</span>
            <span>{{ challenge.co2Impact }} kg CO₂</span>
          </div>
          <div class="progress-bar cc-bar" v-if="getStatus(challenge.id) !== 'none'">
            <div class="progress-fill" :style="{ width: getProgress(challenge.id) + '%' }"></div>
          </div>
          <div class="cc-action">
            <button v-if="getStatus(challenge.id) === 'none'" class="btn btn-outline btn-sm" @click="joinChallenge(challenge)">Join</button>
            <button v-else-if="getStatus(challenge.id) === 'joined'" class="btn btn-primary btn-sm" @click="completeChallenge(challenge)">Complete</button>
            <span v-else class="badge badge-green">Done</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Leaderboard -->
    <div v-if="tab === 'leaderboard'" class="leaderboard card">
      <div class="lb-row lb-header">
        <span class="lb-rank">#</span>
        <span class="lb-user">User</span>
        <span class="lb-stat">Done</span>
        <span class="lb-stat">CO₂</span>
        <span class="lb-stat">Pts</span>
      </div>
      <div v-for="(entry, index) in leaderboard" :key="entry.name" class="lb-row" :class="{ 'lb-you': entry.isYou }">
        <span class="lb-rank">
          <template v-if="index < 3">{{ ['🥇','🥈','🥉'][index] }}</template>
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span class="lb-user">
          <div class="avatar avatar-sm">{{ entry.name.charAt(0).toUpperCase() }}</div>
          <span>{{ entry.name }}</span>
          <span v-if="entry.isYou" class="lb-you-tag">you</span>
        </span>
        <span class="lb-stat">{{ entry.completed }}</span>
        <span class="lb-stat">{{ entry.co2 }}</span>
        <span class="lb-stat">{{ entry.points }}</span>
      </div>
    </div>

    <!-- Rewards -->
    <section class="rewards-section">
      <h2 class="section-title">Rewards</h2>
      <div class="grid-4">
        <div class="card reward-card" v-for="reward in rewards" :key="reward.id">
          <span class="reward-icon">{{ reward.icon }}</span>
          <strong class="reward-name">{{ reward.name }}</strong>
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
    currentUserName() { return this.currentUser.name || this.currentUser.email || 'User' },
    activeChallenge() { return this.challenges[0] },
    filteredChallenges() { return this.challenges.filter(c => c.type === this.tab) },
    leaderboard() {
      const completedCount = Object.values(this.progress).filter(v => v === 'completed').length
      const entries = this.leaderboardData.map(e => ({
        name: e.name,
        completed: parseInt(e.completed) || 0,
        co2: ((parseInt(e.completed) || 0) * 12).toFixed(0),
        points: (parseInt(e.completed) || 0) * 100,
        isYou: e.userId === this.currentUser.id
      }))
      if (!entries.some(e => e.isYou)) {
        entries.push({ name: this.currentUserName, completed: completedCount, co2: (completedCount * 12).toFixed(0), points: completedCount * 100, isYou: true })
      }
      return entries.sort((a, b) => b.points - a.points)
    }
  },
  created() { this.loadChallenges() },
  methods: {
    getStatus(id) { return this.progress[id] || 'none' },
    getProgress(id) {
      const s = this.progress[id]
      if (s === 'completed') return 100
      if (s === 'joined') return 40
      return 0
    },
    async joinChallenge(c) {
      await api.joinChallenge(c.id)
      this.progress[c.id] = 'joined'
      c.participants = (c.participants || 0) + 1
    },
    async completeChallenge(c) {
      await api.completeChallenge(c.id)
      this.progress[c.id] = 'completed'
    },
    async loadChallenges() {
      const [challenges, progress, leaderboard] = await Promise.all([
        api.getChallenges(),
        api.getChallengeProgress().catch(() => ({})),
        api.getLeaderboard().catch(() => [])
      ])
      if (challenges) this.challenges = challenges.map(c => ({ ...c, name: c.title || c.name, participants: 0, daysLeft: c.type === 'weekly' ? 5 : 20 }))
      if (progress) this.progress = progress
      if (leaderboard) this.leaderboardData = leaderboard
    }
  }
}
</script>

<style scoped>
.challenges-page { max-width: 960px; margin: 0 auto; }
.page-header { margin-bottom: 1.5rem; }
.page-title { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em; margin: 0; }
.page-desc { color: var(--text-secondary); font-size: 0.875rem; margin: 0.25rem 0 0; }

/* Spotlight */
.spotlight { background: var(--text); color: #fff; margin-bottom: 1.25rem; }
.spotlight-label { display: inline-block; background: rgba(255,255,255,0.15); padding: 0.2rem 0.625rem; border-radius: 100px; font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 0.75rem; }
.spotlight-title { margin: 0 0 0.375rem; font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
.spotlight-desc { opacity: 0.8; margin: 0 0 0.875rem; font-size: 0.875rem; line-height: 1.5; }
.spotlight-stats { display: flex; gap: 1.25rem; margin-bottom: 0.75rem; font-size: 0.8125rem; opacity: 0.7; }
.spotlight-bar { background: rgba(255,255,255,0.2); margin-bottom: 0.375rem; }
.spotlight-bar .progress-fill { background: var(--green); }
.spotlight-progress-text { font-size: 0.75rem; opacity: 0.6; }
.spotlight-action { margin-top: 1rem; }

/* Challenge Card */
.challenges-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 0.875rem; margin-bottom: 2rem; }
.challenge-card { display: flex; gap: 0.875rem; align-items: flex-start; }
.cc-icon { font-size: 2rem; flex-shrink: 0; line-height: 1; }
.cc-body { flex: 1; min-width: 0; }
.cc-name { margin: 0 0 0.2rem; font-size: 0.875rem; font-weight: 600; }
.cc-desc { font-size: 0.8125rem; color: var(--text-secondary); margin: 0 0 0.5rem; line-height: 1.4; }
.cc-meta { display: flex; gap: 0.625rem; align-items: center; font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 0.5rem; flex-wrap: wrap; }
.cc-bar { margin-bottom: 0.5rem; }
.cc-action { margin-top: 0.25rem; }

/* Leaderboard */
.leaderboard { padding: 0; overflow: hidden; margin-bottom: 2rem; }
.lb-row { display: grid; grid-template-columns: 44px 1fr 60px 60px 60px; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-light); font-size: 0.8125rem; }
.lb-header { font-weight: 700; background: var(--hover); font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.03em; }
.lb-you { background: var(--green-50); }
.lb-user { display: flex; align-items: center; gap: 0.5rem; }
.lb-you-tag { font-size: 0.625rem; color: var(--green); font-weight: 700; background: var(--green-light); padding: 0.1rem 0.35rem; border-radius: 4px; }
.lb-stat { text-align: center; }

/* Rewards */
.rewards-section { margin-bottom: 2rem; }
.reward-card { text-align: center; }
.reward-icon { font-size: 1.75rem; display: block; margin-bottom: 0.375rem; }
.reward-name { display: block; font-size: 0.8125rem; margin-bottom: 0.125rem; }
.reward-req { font-size: 0.6875rem; color: var(--text-tertiary); }

@media (max-width: 768px) {
  .spotlight-stats { flex-direction: column; gap: 0.25rem; }
  .challenges-grid { grid-template-columns: 1fr; }
  .lb-row { grid-template-columns: 36px 1fr 48px 48px 48px; font-size: 0.75rem; padding: 0.625rem 0.625rem; }
}
</style>
