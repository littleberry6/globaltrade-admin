import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.request.use(config => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 401) {
      const userStore = useUserStore()
      userStore.logout()
      router.push({ name: 'Login' })
      ElMessage.error('登录已过期，请重新登录')
      return Promise.reject(res)
    }
    if (res.code === 403) {
      ElMessage.error('权限不足')
      return Promise.reject(res)
    }
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(res)
    }
    return res
  },
  error => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      router.push({ name: 'Login' })
    }
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request