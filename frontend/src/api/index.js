import request from './request'

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  getProfile: () => request.get('/auth/profile'),
  updateProfile: (data) => request.put('/auth/profile', data),
  changePassword: (data) => request.put('/auth/password', data)
}

export const productApi = {
  list: (params) => request.get('/products', { params }),
  getById: (id) => request.get(`/products/${id}`),
  create: (data) => request.post('/products', data),
  update: (id, data) => request.put(`/products/${id}`, data),
  delete: (id) => request.delete(`/products/${id}`),
  updateStatus: (id, status) => request.put(`/products/${id}/status`, { status }),
  categories: () => request.get('/products/categories'),
  batchImport: (products) => request.post('/products/batch/import', { products })
}

export const orderApi = {
  list: (params) => request.get('/orders', { params }),
  getById: (id) => request.get(`/orders/${id}`),
  create: (data) => request.post('/orders', data),
  updateStatus: (id, status) => request.put(`/orders/${id}/status`, { status }),
  addLogistics: (id, data) => request.post(`/orders/${id}/logistics`, data),
  stats: () => request.get('/orders/stats/summary')
}

export const customerApi = {
  list: (params) => request.get('/customers', { params }),
  getById: (id) => request.get(`/customers/${id}`),
  create: (data) => request.post('/customers', data),
  update: (id, data) => request.put(`/customers/${id}`, data),
  delete: (id) => request.delete(`/customers/${id}`),
  addInquiry: (id, data) => request.post(`/customers/${id}/inquiry`, data),
  updateInquiry: (id, data) => request.put(`/customers/inquiry/${id}`, data),
  pipeline: () => request.get('/customers/pipeline/stats')
}

export const analyticsApi = {
  overview: () => request.get('/analytics/overview'),
  salesTrend: (params) => request.get('/analytics/sales-trend', { params }),
  channelComparison: () => request.get('/analytics/channel-comparison'),
  categoryPerformance: () => request.get('/analytics/category-performance'),
  funnel: () => request.get('/analytics/funnel'),
  stockAlerts: () => request.get('/analytics/stock-alerts'),
  recentActivity: () => request.get('/analytics/recent-activity'),
  pendingTasks: () => request.get('/analytics/pending-tasks')
}

export const selectionApi = {
  competitors: (params) => request.get('/selection/competitors', { params }),
  createCompetitor: (data) => request.post('/selection/competitors', data),
  updateCompetitor: (id, data) => request.put(`/selection/competitors/${id}`, data),
  deleteCompetitor: (id) => request.delete(`/selection/competitors/${id}`),
  trending: () => request.get('/selection/trending'),
  suggestions: () => request.get('/selection/suggestions')
}

export const systemApi = {
  users: (params) => request.get('/system/users', { params }),
  createUser: (data) => request.post('/system/users', data),
  updateUser: (id, data) => request.put(`/system/users/${id}`, data),
  deleteUser: (id) => request.delete(`/system/users/${id}`),
  roles: () => request.get('/system/roles'),
  createRole: (data) => request.post('/system/roles', data),
  updateRole: (id, data) => request.put(`/system/roles/${id}`, data),
  deleteRole: (id) => request.delete(`/system/roles/${id}`),
  logs: (params) => request.get('/system/logs', { params }),
  permissions: () => request.get('/system/permissions/list')
}

export default {
  authApi,
  productApi,
  orderApi,
  customerApi,
  analyticsApi,
  selectionApi,
  systemApi
}