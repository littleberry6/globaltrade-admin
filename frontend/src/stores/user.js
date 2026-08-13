import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/api/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => userInfo.value?.role || '')

  async function login(credentials) {
    const res = await request.post('/auth/login', credentials)
    if (res.code === 200) {
      token.value = res.data.token
      userInfo.value = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userInfo', JSON.stringify(res.data.user))
    }
    return res
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  async function fetchProfile() {
    const res = await request.get('/auth/profile')
    if (res.code === 200) {
      userInfo.value = { ...userInfo.value, ...res.data }
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
    return res
  }

  return { token, userInfo, isLoggedIn, role, login, logout, fetchProfile }
})