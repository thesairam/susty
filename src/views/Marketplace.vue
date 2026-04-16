<template>
  <div class="marketplace-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Marketplace</h1>
        <p class="page-desc">Buy, sell, trade — give items a second life.</p>
      </div>
      <button class="btn btn-primary" @click="showListingForm = !showListingForm">
        {{ showListingForm ? 'Cancel' : '+ List Item' }}
      </button>
    </div>

    <!-- New Listing Form -->
    <div v-if="showListingForm" class="card listing-form">
      <h3 class="form-title">Create a Listing</h3>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Item Name</label>
          <input v-model="newListing.name" class="form-input" placeholder="What are you selling?" />
        </div>
        <div class="form-group">
          <label class="form-label">Price ($)</label>
          <input v-model.number="newListing.price" type="number" min="0" step="0.01" class="form-input" placeholder="0.00" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select v-model="newListing.category" class="form-select">
            <option value="">Select category</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.icon }} {{ cat.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Condition</label>
          <select v-model="newListing.condition" class="form-select">
            <option value="new">New</option>
            <option value="like-new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Listing Type</label>
          <select v-model="newListing.type" class="form-select">
            <option value="sell">Sell</option>
            <option value="trade">Trade</option>
            <option value="free">Give Away Free</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Location</label>
          <input v-model="newListing.location" class="form-input" placeholder="City or neighborhood" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea v-model="newListing.description" class="form-textarea" placeholder="Describe the item..."></textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="createListing" :disabled="!canCreateListing">Publish</button>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="search-bar">
      <input v-model="searchQuery" class="form-input search-input" placeholder="Search marketplace..." />
    </div>
    <div class="filter-chips">
      <button class="chip" :class="{ active: activeCategory === '' }" @click="activeCategory = ''">All</button>
      <button v-for="cat in categories" :key="cat.id" class="chip" :class="{ active: activeCategory === cat.id }" @click="activeCategory = cat.id">{{ cat.icon }} {{ cat.name }}</button>
    </div>
    <div class="filter-row">
      <select v-model="sortBy" class="form-select sort-select">
        <option value="newest">Newest</option>
        <option value="price-low">Price: Low → High</option>
        <option value="price-high">Price: High → Low</option>
      </select>
      <div class="filter-chips">
        <button class="chip chip-sm" :class="{ active: typeFilter === '' }" @click="typeFilter = ''">All</button>
        <button class="chip chip-sm" :class="{ active: typeFilter === 'sell' }" @click="typeFilter = 'sell'">Buy</button>
        <button class="chip chip-sm" :class="{ active: typeFilter === 'trade' }" @click="typeFilter = 'trade'">Trade</button>
        <button class="chip chip-sm" :class="{ active: typeFilter === 'free' }" @click="typeFilter = 'free'">Free</button>
      </div>
    </div>

    <div class="results-info">{{ filteredListings.length }} item{{ filteredListings.length !== 1 ? 's' : '' }}</div>

    <!-- Listings Grid -->
    <div class="product-grid">
      <div v-if="filteredListings.length === 0" class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">🔍</div>
        <p>No items match your search.</p>
      </div>

      <div v-for="listing in filteredListings" :key="listing.id" class="listing-card card">
        <div class="listing-image" :class="'cat-' + (listing.category || 'other')">
          <span class="listing-image-icon">{{ getCategoryIcon(listing.category) }}</span>
          <div class="listing-badges">
            <span v-if="listing.type === 'free'" class="badge badge-green">FREE</span>
            <span v-else-if="listing.type === 'trade'" class="badge badge-blue">TRADE</span>
          </div>
        </div>
        <div class="listing-info">
          <div class="listing-top">
            <h3 class="listing-name">{{ listing.name }}</h3>
            <span class="listing-price" v-if="listing.type !== 'free'">${{ listing.price.toFixed(2) }}</span>
            <span class="listing-price free" v-else>Free</span>
          </div>
          <p class="listing-desc">{{ listing.description }}</p>
          <div class="listing-meta">
            <span class="badge badge-green">{{ listing.condition || 'Good' }}</span>
            <span class="meta-location" v-if="listing.location">{{ listing.location }}</span>
          </div>
          <div class="listing-seller">
            <div class="avatar avatar-sm">{{ sellerName(listing).charAt(0).toUpperCase() }}</div>
            <span class="seller-name">{{ sellerName(listing) }}</span>
          </div>
          <div class="listing-actions">
            <button class="btn btn-primary btn-sm" @click="contactSeller(listing)">
              {{ listing.type === 'trade' ? 'Trade' : listing.type === 'free' ? 'Request' : 'Buy' }}
            </button>
            <button class="btn btn-ghost btn-sm" @click="toggleFavorite(listing)">
              {{ listing.favorited ? '❤️' : '🤍' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'MarketplaceView',
  data() {
    return {
      showListingForm: false,
      searchQuery: '',
      activeCategory: '',
      typeFilter: '',
      sortBy: 'newest',
      newListing: {
        name: '',
        price: 0,
        category: '',
        condition: 'good',
        type: 'sell',
        location: '',
        description: ''
      },
      categories: [
        { id: 'furniture', name: 'Furniture', icon: '🪑' },
        { id: 'electronics', name: 'Electronics', icon: '📱' },
        { id: 'clothing', name: 'Clothing', icon: '👕' },
        { id: 'diy', name: 'DIY Materials', icon: '🔧' },
        { id: 'garden', name: 'Garden', icon: '🌱' },
        { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
        { id: 'books', name: 'Books', icon: '📚' },
        { id: 'sports', name: 'Sports', icon: '⚽' }
      ],
      listings: []
    }
  },
  computed: {
    currentUser() {
      try { return JSON.parse(localStorage.getItem('susty_user')) || {} } catch { return {} }
    },
    canCreateListing() {
      return this.newListing.name.trim() && this.newListing.category && this.newListing.description.trim()
    },
    filteredListings() {
      let result = [...this.listings]
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase()
        result = result.filter(l =>
          l.name.toLowerCase().includes(q) ||
          (l.description || '').toLowerCase().includes(q) ||
          (l.location || '').toLowerCase().includes(q)
        )
      }
      if (this.activeCategory) result = result.filter(l => l.category === this.activeCategory)
      if (this.typeFilter) result = result.filter(l => l.type === this.typeFilter)
      switch (this.sortBy) {
        case 'price-low': result.sort((a, b) => a.price - b.price); break
        case 'price-high': result.sort((a, b) => b.price - a.price); break
        default: result.sort((a, b) => b.id - a.id)
      }
      return result
    }
  },
  created() { this.loadListings() },
  methods: {
    sellerName(listing) {
      if (!listing.seller) return 'Seller'
      return typeof listing.seller === 'object' ? listing.seller.name : listing.seller
    },
    getCategoryIcon(catId) {
      const cat = this.categories.find(c => c.id === catId)
      return cat ? cat.icon : '📦'
    },
    async createListing() {
      if (!this.canCreateListing) return
      const data = {
        name: this.newListing.name.trim(),
        price: this.newListing.type === 'free' ? 0 : Number(this.newListing.price) || 0,
        category: this.newListing.category,
        condition: this.newListing.condition,
        type: this.newListing.type,
        location: this.newListing.location.trim(),
        description: this.newListing.description.trim()
      }
      const listing = await api.createListing(data)
      if (listing) this.listings.unshift(listing)
      this.showListingForm = false
      this.newListing = { name: '', price: 0, category: '', condition: 'good', type: 'sell', location: '', description: '' }
    },
    toggleFavorite(listing) { listing.favorited = !listing.favorited },
    async contactSeller(listing) {
      const sellerId = typeof listing.seller === 'object' ? listing.seller.id : null
      if (sellerId) await api.sendMessage(sellerId, `Hi! I'm interested in your listing: "${listing.name}"`)
    },
    async loadListings() {
      const data = await api.getListings()
      if (data) this.listings = data
    }
  }
}
</script>

<style scoped>
.marketplace-page { max-width: 960px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.page-title { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.03em; margin: 0; }
.page-desc { color: var(--text-secondary); font-size: 0.875rem; margin: 0.25rem 0 0; }

.listing-form { margin-bottom: 1.25rem; }
.form-title { margin: 0 0 1rem; font-size: 1rem; font-weight: 700; }
.form-actions { display: flex; justify-content: flex-end; margin-top: 0.5rem; }

.search-bar { margin-bottom: 0.75rem; }
.search-input { background: var(--hover); border-color: transparent; }
.search-input:focus { background: var(--bg-card); border-color: var(--text); }

.filter-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin: 0.75rem 0 1rem; }
.sort-select { max-width: 180px; font-size: 0.8125rem; padding: 0.4rem 0.75rem; }

.results-info { margin-bottom: 1rem; font-size: 0.8125rem; color: var(--text-tertiary); font-weight: 500; }

.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }

.listing-card { padding: 0; overflow: hidden; transition: transform var(--transition), border-color var(--transition); }
.listing-card:hover { transform: translateY(-2px); }

.listing-image {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: var(--green-50);
}
.cat-furniture { background: var(--green-50); }
.cat-electronics { background: var(--blue-light); }
.cat-clothing { background: #faf5ff; }
.cat-diy { background: var(--orange-light); }
.cat-garden { background: var(--green-50); }
.cat-kitchen { background: #fef2f2; }
.cat-books { background: #f5f3ff; }
.cat-sports { background: #ecfeff; }
.listing-image-icon { font-size: 3rem; }
.listing-badges { position: absolute; top: 0.5rem; left: 0.5rem; display: flex; gap: 0.25rem; }

.listing-info { padding: 1rem; }
.listing-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.375rem; }
.listing-name { margin: 0; font-size: 0.9375rem; font-weight: 600; flex: 1; letter-spacing: -0.01em; }
.listing-price { font-weight: 700; color: var(--green); font-size: 1rem; white-space: nowrap; margin-left: 0.5rem; }
.listing-price.free { color: var(--orange); }
.listing-desc { color: var(--text-secondary); font-size: 0.8125rem; margin: 0 0 0.625rem; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.listing-meta { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.625rem; }
.meta-location { font-size: 0.75rem; color: var(--text-tertiary); }
.listing-seller { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.625rem; font-size: 0.8125rem; }
.seller-name { font-weight: 500; color: var(--text); }
.listing-actions { display: flex; gap: 0.375rem; }

@media (max-width: 768px) {
  .page-header { flex-direction: column; gap: 0.75rem; }
  .product-grid { grid-template-columns: 1fr 1fr; }
  .filter-row { flex-direction: column; align-items: stretch; }
  .sort-select { max-width: 100%; }
}
@media (max-width: 480px) {
  .product-grid { grid-template-columns: 1fr; }
}
</style>