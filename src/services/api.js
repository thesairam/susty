const BASE = '/api';

function authHeaders() {
  const token = localStorage.getItem('susty_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem('susty_token');
    localStorage.removeItem('susty_user');
    window.location.href = '/auth';
    return null;
  }
  if (res.status === 403) {
    return { error: true, message: 'You don\'t have permission to do that' };
  }
  if (res.status === 404) {
    return { error: true, message: 'Not found' };
  }
  return res.json();
}

function get(path) { return request(path); }
function post(path, body) { return request(path, { method: 'POST', body: JSON.stringify(body) }); }
function del(path) { return request(path, { method: 'DELETE' }); }
function patch(path, body) { return request(path, { method: 'PATCH', body: JSON.stringify(body) }); }

export default {
  // Auth
  register: (email, password, name) => post('/auth/register', { email, password, name }),
  login: (email, password) => post('/auth/login', { email, password }),
  me: () => get('/auth/me'),

  // Users
  getUser: (id) => get(`/users/${id}`),
  updateUser: (id, data) => patch(`/users/${id}`, data),
  getUserStats: () => get('/users/me/stats'),
  getPublicStats: (id) => get(`/users/${id}/stats`),

  // Search
  search: (q, type) => get(`/search?q=${encodeURIComponent(q)}${type ? '&type=' + type : ''}`),

  // Connections (Roots)
  getRoots: () => get('/connections/roots'),
  getPendingRequests: () => get('/connections/pending'),
  getSentRequests: () => get('/connections/sent'),
  getConnectionStatus: (userId) => get(`/connections/status/${userId}`),
  sendRootRequest: (userId) => post(`/connections/request/${userId}`),
  acceptRoot: (id) => post(`/connections/${id}/accept`),
  removeRoot: (id) => del(`/connections/${id}`),

  // Posts
  getPosts: (sort) => get(`/posts${sort ? `?sort=${sort}` : ''}`),
  createPost: (data) => post('/posts', data),
  deletePost: (id) => del(`/posts/${id}`),
  likePost: (id) => post(`/posts/${id}/like`),
  repostPost: (id) => post(`/posts/${id}/repost`),
  addReply: (postId, content) => post(`/posts/${postId}/replies`, { content }),

  // Marketplace
  getListings: (params) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v))).toString();
    return get(`/listings${q ? `?${q}` : ''}`);
  },
  createListing: (data) => post('/listings', data),
  deleteListing: (id) => del(`/listings/${id}`),

  // Events
  getEvents: (params) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v))).toString();
    return get(`/events${q ? `?${q}` : ''}`);
  },
  createEvent: (data) => post('/events', data),
  rsvpEvent: (id) => post(`/events/${id}/rsvp`),
  cancelRsvp: (id) => del(`/events/${id}/rsvp`),

  // Messages
  getMessages: () => get('/messages'),
  getConversation: (userId) => get(`/messages/${userId}`),
  sendMessage: (receiverId, text) => post('/messages', { receiverId, text }),

  // Community
  getGroups: () => get('/community/groups'),
  joinGroup: (id) => post(`/community/groups/${id}/join`),
  getCommunityPosts: (groupId) => get(`/community/posts${groupId ? `?groupId=${groupId}` : ''}`),
  createCommunityPost: (data) => post('/community/posts', data),
  likeCommunityPost: (id) => post(`/community/posts/${id}/like`),
  addCommunityComment: (postId, content) => post(`/community/posts/${postId}/comments`, { content }),

  // Challenges
  getChallenges: () => get('/challenges'),
  getChallengeProgress: () => get('/challenges/progress'),
  getLeaderboard: () => get('/challenges/leaderboard'),
  joinChallenge: (id) => post(`/challenges/${id}/join`),
  completeChallenge: (id) => post(`/challenges/${id}/complete`),

  // Knowledge
  getArticles: (category) => get(`/articles${category ? `?category=${category}` : ''}`),
  getArticle: (id) => get(`/articles/${id}`),
  createArticle: (data) => post('/articles', data),
  likeArticle: (id) => post(`/articles/${id}/like`),

  // Donations
  getDonations: (category) => get(`/donations${category ? `?category=${category}` : ''}`),
  getDonationStats: () => get('/donations/stats'),
  createDonation: (data) => post('/donations', data),
  claimDonation: (id) => post(`/donations/${id}/claim`),
  getDonationRequests: (category) => get(`/donations/requests${category ? `?category=${category}` : ''}`),
  createDonationRequest: (data) => post('/donations/requests', data),
  fulfillRequest: (id) => post(`/donations/requests/${id}/fulfill`),
};
