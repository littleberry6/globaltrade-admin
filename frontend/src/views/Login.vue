<template>
  <div class="login-page">
    <div class="bg-animation">
      <div class="circle c1"></div>
      <div class="circle c2"></div>
      <div class="circle c3"></div>
      <div class="grid-bg"></div>
    </div>

    <div class="login-container">
      <div class="brand-section">
        <div class="brand-logo">
          <span class="logo-icon">G</span>
        </div>
        <h1 class="brand-title">{{ $t('login.title') }}</h1>
        <p class="brand-subtitle">{{ $t('login.subtitle') }}</p>
        <div class="brand-features">
          <div class="feature-item">
            <el-icon><DataAnalysis /></el-icon>
            <span>实时数据</span>
          </div>
          <div class="feature-item">
            <el-icon><Connection /></el-icon>
            <span>全链路追踪</span>
          </div>
          <div class="feature-item">
            <el-icon><Promotion /></el-icon>
            <span>多渠道聚合</span>
          </div>
        </div>
      </div>

      <div class="login-form-container">
        <div class="login-header">
          <h2>{{ $t('login.welcome') }}</h2>
          <p>请登录您的账号</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              :placeholder="$t('login.username')"
              size="large"
              clearable
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              :placeholder="$t('login.password')"
              size="large"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            {{ $t('login.login') }}
          </el-button>
        </el-form>

        <div class="login-footer">
          <span>{{ $t('login.footer') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: 'admin123'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  try {
    await formRef.value.validate()
    loading.value = true
    const res = await userStore.login(form)
    if (res.code === 200) {
      ElMessage.success('登录成功')
      router.push({ name: 'Dashboard' })
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  width: 100%;
  height: 100vh;
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-animation {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 20s infinite ease-in-out;
}

.c1 {
  width: 400px;
  height: 400px;
  background: var(--accent-cyan);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.c2 {
  width: 300px;
  height: 300px;
  background: var(--accent-purple);
  bottom: -50px;
  right: -50px;
  animation-delay: 5s;
}

.c3 {
  width: 250px;
  height: 250px;
  background: var(--accent-blue);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(50px, -30px) scale(1.1); }
  66% { transform: translate(-30px, 50px) scale(0.9); }
}

.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

.login-container {
  display: flex;
  align-items: center;
  gap: 80px;
  z-index: 1;
}

.brand-section {
  text-align: center;
  color: var(--text-primary);
}

.brand-logo {
  margin-bottom: 24px;
}

.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  font-size: 42px;
  font-weight: 800;
  color: #fff;
  background: var(--gradient-primary);
  border-radius: 16px;
  box-shadow: 0 0 40px rgba(0, 212, 255, 0.4);
}

.brand-title {
  font-size: 36px;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.brand-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 40px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  margin: 0 auto;
  width: fit-content;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(0, 212, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
}

.feature-item .el-icon {
  color: var(--accent-cyan);
  font-size: 18px;
}

.login-form-container {
  width: 420px;
  padding: 40px;
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-card), var(--shadow-glow);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  font-size: 24px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.login-header p {
  color: var(--text-secondary);
  font-size: 14px;
}

.login-form :deep(.el-input__wrapper) {
  padding: 4px 12px;
}

.login-form :deep(.el-input__inner) {
  height: 44px;
  color: var(--text-primary);
}

.login-form :deep(.el-input__prefix-inner) {
  color: var(--text-muted);
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  margin-top: 8px;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  color: var(--text-muted);
}
</style>