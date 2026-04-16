<template>
  <div class="about-page">
    <div class="page-header">
      <h1 class="page-title">About Susty</h1>
      <p class="page-desc">Building a community-driven platform for real-world sustainable action.</p>
    </div>

    <section class="mv-section">
      <div class="card mv-card">
        <h3>Mission</h3>
        <p>To build a vibrant community of sustainability enthusiasts who share and celebrate eco-friendly ideas, actions, events, and products, inspiring the world to embrace a greener lifestyle. To become the world's largest e-commerce platform and aggregator for sustainable products.</p>
      </div>
      <div class="card mv-card">
        <h3>Vision</h3>
        <p>To become a technology leader of sustainability-related innovative products for residential, commercial, and industrial applications leveraging artificial intelligence and analytics that contribute to a greener future.</p>
      </div>
    </section>

    <section class="team-section">
      <h2 class="section-title">Our Team</h2>
      <div class="team-grid">
        <div class="team-member card" v-for="member in team" :key="member.name">
          <img :src="member.photo" :alt="member.name" class="team-photo" />
          <h4>{{ member.name }}</h4>
          <p class="team-role">{{ member.position }}</p>
        </div>
      </div>
    </section>

    <section class="goals-section card">
      <h3>Our Goals</h3>
      <div class="goals-list">
        <div class="goal-item" v-for="(goal, i) in goals" :key="i">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          <span>{{ goal }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'AboutView',
  data() {
    return {
      team: [
        { name: 'Sairam', position: 'Chief Sorcerer', photo: require('@/assets/team-photos/sairam.jpg') },
        { name: 'Amreish', position: 'Network Magus', photo: require('@/assets/team-photos/amreish.jpg') },
        { name: 'Viggnan', position: 'Product Magician', photo: require('@/assets/team-photos/viggnan.jpeg') },
        { name: 'Mhilan', position: 'Spellmaster of Tech', photo: require('@/assets/team-photos/mhilan.jpg') },
        { name: 'Rachana', position: 'Masters of Charms', photo: require('@/assets/team-photos/rachana.jpg') }
      ],
      goals: [
        'Build a community of sustainability-minded individuals',
        'Create influencers in sustainability',
        'Focus on Education, Social, Products, Influencer, Food, Medical, Volunteering'
      ]
    }
  }
}
</script>

<style scoped>
.about-page { max-width: 960px; margin: 0 auto; }
.page-header { margin-bottom: 1.5rem; text-align: center; }
.page-title { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em; margin: 0; }
.page-desc { color: var(--text-secondary); font-size: 0.875rem; margin: 0.25rem 0 0; }

.mv-section { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; margin-bottom: 2rem; }
.mv-card h3 { margin: 0 0 0.625rem; font-size: 1rem; font-weight: 700; }
.mv-card p { margin: 0; font-size: 0.875rem; line-height: 1.6; color: var(--text-secondary); }

.team-section { margin-bottom: 2rem; }
.team-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.875rem; }
.team-member { text-align: center; padding: 1.25rem 0.875rem; }
.team-photo { width: 100px; height: 100px; object-fit: cover; border-radius: 50%; margin-bottom: 0.75rem; border: 2px solid var(--green); }
.team-member h4 { margin: 0 0 0.125rem; font-size: 0.9375rem; font-weight: 600; }
.team-role { margin: 0; font-size: 0.8125rem; color: var(--text-secondary); }

.goals-section { margin-bottom: 2rem; }
.goals-section h3 { margin: 0 0 0.875rem; font-size: 1rem; font-weight: 700; }
.goals-list { display: flex; flex-direction: column; gap: 0.5rem; }
.goal-item { display: flex; align-items: center; gap: 0.625rem; padding: 0.75rem; background: var(--green-50); border-radius: 8px; font-size: 0.875rem; }

@media (max-width: 768px) {
  .mv-section { grid-template-columns: 1fr; }
  .team-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>