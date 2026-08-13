import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: 'dashboard' }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/products/ProductList.vue'),
        meta: { title: 'productList' }
      },
      {
        path: 'products/new',
        name: 'ProductNew',
        component: () => import('@/views/products/ProductForm.vue'),
        meta: { title: 'productsNew' }
      },
      {
        path: 'products/:id/edit',
        name: 'ProductEdit',
        component: () => import('@/views/products/ProductForm.vue'),
        meta: { title: 'productsNew' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrderList.vue'),
        meta: { title: 'orderList' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetail.vue'),
        meta: { title: 'detail' }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/analytics/Analytics.vue'),
        meta: { title: 'analytics' }
      },
      {
        path: 'selection/competitors',
        name: 'Competitors',
        component: () => import('@/views/selection/Competitors.vue'),
        meta: { title: 'competitors' }
      },
      {
        path: 'selection/trending',
        name: 'Trending',
        component: () => import('@/views/selection/Trending.vue'),
        meta: { title: 'trending' }
      },
      {
        path: 'selection/suggestions',
        name: 'Suggestions',
        component: () => import('@/views/selection/Suggestions.vue'),
        meta: { title: 'suggestions' }
      },
      {
        path: 'customers',
        name: 'Customers',
        component: () => import('@/views/customers/CustomerList.vue'),
        meta: { title: 'customerList' }
      },
      {
        path: 'customers/:id',
        name: 'CustomerDetail',
        component: () => import('@/views/customers/CustomerDetail.vue'),
        meta: { title: 'customerDetail' }
      },
      {
        path: 'system/users',
        name: 'SystemUsers',
        component: () => import('@/views/system/Users.vue'),
        meta: { title: 'userManagement' }
      },
      {
        path: 'system/roles',
        name: 'SystemRoles',
        component: () => import('@/views/system/Roles.vue'),
        meta: { title: 'roleManagement' }
      },
      {
        path: 'system/logs',
        name: 'SystemLogs',
        component: () => import('@/views/system/Logs.vue'),
        meta: { title: 'operationLogs' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (!to.meta.public && !userStore.token) {
    next({ name: 'Login' })
  } else if (to.name === 'Login' && userStore.token) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router