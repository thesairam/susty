<template>
  <div class="marketplace">
    <!-- Marketplace Header -->
    <div class="mp-header">
      <div>
        <h1>🛒 Sustainability Marketplace</h1>
        <p class="mp-subtitle">Buy, sell, trade — give items a second life and reduce waste.</p>
      </div>
      <button class="btn btn-primary btn-lg" @click="showListingForm = !showListingForm">
        {{ showListingForm ? '✕ Cancel' : '+ List an Item' }}
      </button>
    </div>

    <!-- New Listing Form -->
    <div v-if="showListingForm" class="card listing-form">
      <h3>Create a Listing</h3>
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
        <textarea v-model="newListing.description" class="form-textarea" placeholder="Describe the item, its condition, and why you're listing it..."></textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="createListing" :disabled="!canCreateListing">Publish Listing</button>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="filter-bar card">
      <input v-model="searchQuery" class="form-input search-input" placeholder="🔍 Search marketplace..." />
      <div class="filter-chips">
        <button
          class="chip"
          :class="{ active: activeCategory === '' }"
          @click="activeCategory = ''"
        >All</button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="chip"
          :class="{ active: activeCategory === cat.id }"
          @click="activeCategory = cat.id"
        >{{ cat.icon }} {{ cat.name }}</button>
      </div>
      <div class="filter-row">
        <select v-model="sortBy" class="form-select sort-select">
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
        <div class="filter-chips-sm">
          <button class="chip chip-sm" :class="{ active: typeFilter === '' }" @click="typeFilter = ''">All Types</button>
          <button class="chip chip-sm" :class="{ active: typeFilter === 'sell' }" @click="typeFilter = 'sell'">Buy</button>
          <button class="chip chip-sm" :class="{ active: typeFilter === 'trade' }" @click="typeFilter = 'trade'">Trade</button>
          <button class="chip chip-sm" :class="{ active: typeFilter === 'free' }" @click="typeFilter = 'free'">Free</button>
        </div>
      </div>
    </div>

    <!-- Results Count -->
    <div class="results-info">
      <span>{{ filteredListings.length }} item{{ filteredListings.length !== 1 ? 's' : '' }} found</span>
    </div>

    <!-- Listings Grid -->
    <div class="product-grid">
      <div v-if="filteredListings.length === 0" class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">🔍</div>
        <p>No items match your search. Try different filters or list something!</p>
      </div>

      <div v-for="listing in filteredListings" :key="listing.id" class="listing-card card">
        <!-- Image Placeholder -->
        <div class="listing-image" :style="{ background: getCategoryColor(listing.category) }">
          <span class="listing-image-icon">{{ getCategoryIcon(listing.category) }}</span>
          <div class="listing-badges">
            <span v-if="listing.type === 'free'" class="badge badge-green">FREE</span>
            <span v-else-if="listing.type === 'trade'" class="badge badge-blue">TRADE</span>
            <span v-if="listing.carbonSaved" class="badge badge-green">🌿 -{{ listing.carbonSaved }}kg CO₂</span>
          </div>
        </div>

        <!-- Listing Info -->
        <div class="listing-info">
          <div class="listing-top">
            <h3 class="listing-name">{{ listing.name }}</h3>
            <span class="listing-price" v-if="listing.type !== 'free'">${{ listing.price.toFixed(2) }}</span>
            <span class="listing-price free" v-else>Free</span>
          </div>
          <p class="listing-desc">{{ listing.description }}</p>
          <div class="listing-meta">
            <span class="badge badge-green">{{ listing.conditionLabel }}</span>
            <span class="listing-location" v-if="listing.location">📍 {{ listing.location }}</span>
          </div>
          <div class="listing-seller">
            <div class="avatar avatar-sm">{{ sellerName(listing).charAt(0).toUpperCase() }}</div>
            <span class="seller-name">{{ sellerName(listing) }}</span>
            <span class="seller-rating" v-if="listing.rating">⭐ {{ listing.rating.toFixed(1) }}</span>
          </div>
          <div class="listing-actions">
            <button class="btn btn-primary btn-sm" @click="contactSeller(listing)">
              {{ listing.type === 'trade' ? 'Propose Trade' : listing.type === 'free' ? 'Request' : 'Buy Now' }}
            </button>
            <button class="btn btn-outline btn-sm" @click="toggleFavorite(listing)">
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
      if (this.activeCategory) {
        result = result.filter(l => l.category === this.activeCategory)
      }
      if (this.typeFilter) {
        result = result.filter(l => l.type === this.typeFilter)
      }
      switch (this.sortBy) {
        case 'price-low': result.sort((a, b) => a.price - b.price); break
        case 'price-high': result.sort((a, b) => b.price - a.price); break
        case 'rating': result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break
        default: result.sort((a, b) => b.id - a.id)
      }
      return result
    }
  },
  created() {
    this.loadListings()
  },
  methods: {
    sellerName(listing) {
      if (!listing.seller) return 'Seller'
      return typeof listing.seller === 'object' ? listing.seller.name : listing.seller
    },
    getCategoryIcon(catId) {
      const cat = this.categories.find(c => c.id === catId)
      return cat ? cat.icon : '📦'
    },
    getCategoryColor(catId) {
      const colors = {
        furniture: 'linear-gradient(135deg, #a8d8a8, #6bb86b)',
        electronics: 'linear-gradient(135deg, #90caf9, #42a5f5)',
        clothing: 'linear-gradient(135deg, #ce93d8, #ab47bc)',
        diy: 'linear-gradient(135deg, #ffcc80, #ffa726)',
        garden: 'linear-gradient(135deg, #a5d6a7, #66bb6a)',
        kitchen: 'linear-gradient(135deg, #ef9a9a, #ef5350)',
        books: 'linear-gradient(135deg, #b39ddb, #7e57c2)',
        sports: 'linear-gradient(135deg, #80deea, #26c6da)'
      }
      return colors[catId] || 'linear-gradient(135deg, #e0e0e0, #bdbdbd)'
    },
    conditionLabel(cond) {
      const labels = { 'new': 'New', 'like-new': 'Like New', 'good': 'Good', 'fair': 'Fair' }
      return labels[cond] || cond
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
    toggleFavorite(listing) {
      listing.favorited = !listing.favorited
    },
    async contactSeller(listing) {
      const sellerId = typeof listing.seller === 'object' ? listing.seller.id : null
      if (sellerId) {
        await api.sendMessage(sellerId, `Hi! I'm interested in your listing: "${listing.name}"`)
      }
    },
    async loadListings() {
      const data = await api.getListings()
      if (data) this.listings = data
    }
  }
}
</script>

<style scoped>
.mp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}
.mp-header h1 { margin: 0 0 0.25rem; font-size: 1.8rem; }
.mp-subtitle { color: var(--muted-text); margin: 0; }

.listing-form { margin-bottom: 1.5rem; }
.listing-form h3 { margin-top: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-actions { display: flex; justify-content: flex-end; margin-top: 0.5rem; }

.filter-bar { margin-bottom: 1rem; }
.search-input { margin-bottom: 0.75rem; }
.filter-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
.filter-row { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
.sort-select { max-width: 200px; }
.filter-chips-sm { display: flex; gap: 0.35rem; flex-wrap: wrap; }

.chip {
  padding: 0.35rem 0.85rem;
  border: 2px solid var(--border-color);
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all var(--transition);
  white-space: nowrap;
}
.chip:hover { border-color: var(--primary-green); color: var(--primary-green); }
.chip.active { background: var(--primary-green); color: white; border-color: var(--primary-green); }
.chip-sm { padding: 0.25rem 0.6rem; font-size: 0.8rem; }

.results-info { margin-bottom: 1rem; font-size: 0.9rem; color: var(--muted-text); }

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

.listing-card { padding: 0; overflow: hidden; }

.listing-image {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.listing-image-icon { font-size: 3.5rem; }
.listing-badges {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  display: flex;
  gap: 0.35rem;
}

.listing-info { padding: 1rem 1.25rem; }
.listing-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
.listing-name { margin: 0; font-size: 1.05rem; flex: 1; }
.listing-price { font-weight: 700; color: var(--primary-green); font-size: 1.1rem; white-space: nowrap; margin-left: 0.75rem; }
.listing-price.free { color: var(--accent-orange); }
.listing-desc { color: var(--muted-text); font-size: 0.85rem; margin: 0 0 0.75rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.listing-meta { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem; }
.listing-location { font-size: 0.8rem; color: var(--muted-text); }
.listing-seller { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.85rem; }
.seller-name { font-weight: 500; }
.seller-rating { color: var(--accent-orange); margin-left: auto; }
.listing-actions { display: flex; gap: 0.5rem; }

@media (max-width: 768px) {
  .mp-header { flex-direction: column; gap: 1rem; }
  .form-row { grid-template-columns: 1fr; }
  .product-grid { grid-template-columns: 1fr; }
  .filter-row { flex-direction: column; }
  .sort-select { max-width: 100%; }
}
</style>