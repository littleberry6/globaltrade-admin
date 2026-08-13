<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <div class="logo-area" @click="$router.push('/dashboard')">
        <div class="logo-icon">
          <span class="logo-g">G</span>
        </div>
        <transition name="fade">
          <span v-show="!isCollapse" class="logo-text">GlobalTrade</span>
        </transition>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="transparent"
        text-color="#8FA3BE"
        active-text-color="#00D4FF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <template #title>{{ $t('nav.dashboard') }}</template>
        </el-menu-item>

        <el-sub-menu index="products-menu">
          <template #title>
            <el-icon><Goods /></el-icon>
            <span>{{ $t('nav.products') }}</span>
          </template>
          <el-menu-item index="/products">{{ $t('nav.productList') }}</el-menu-item>
          <el-menu-item index="/products/new">{{ $t('nav.productsNew') }}</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/orders">
          <el-icon><List /></el-icon>
          <template #title>{{ $t('nav.orderList') }}</template>
        </el-menu-item>

        <el-menu-item index="/analytics">
          <el-icon><TrendCharts /></el-icon>
          <template #title>{{ $t('nav.analytics') }}</template>
        </el-menu-item>

        <el-sub-menu index="selection-menu">
          <template #title>
            <el-icon><Search /></el-icon>
            <span>{{ $t('nav.selection') }}</span>
          </template>
          <el-menu-item index="/selection/competitors">{{ $t('nav.competitors') }}</el-menu-item>
          <el-menu-item index="/selection/trending">{{ $t('nav.trending') }}</el-menu-item>
          <el-menu-item index="/selection/suggestions">{{ $t('nav.suggestions') }}</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/customers">
          <el-icon><User /></el-icon>
          <template #title>{{ $t('nav.customerList') }}</template>
        </el-menu-item>

        <el-sub-menu v-if="userStore.role === 'admin'" index="system-menu">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>{{ $t('nav.system') }}</span>
          </template>
          <el-menu-item index="/system/users">{{ $t('nav.userManagement') }}</el-menu-item>
          <el-menu-item index="/system/roles">{{ $t('nav.roleManagement') }}</el-menu-item>
          <el-menu-item index="/system/logs">{{ $t('nav.operationLogs') }}</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" :size="20" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">{{ $t('nav.dashboard') }}</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.meta.title">{{ $t('nav.' + $route.meta.title) }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="lang-switch">
              <el-icon><Location /></el-icon>
              <span>{{ currentLang === 'zh' ? '中文' : 'EN' }}</span>
            </div>
          </el-dropdown>
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" :style="{ background: 'linear-gradient(135deg, #00D4FF, #3B82F6)' }">
                {{ userStore.userInfo?.nickname?.[0]?.toUpperCase() || 'U' }}
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { locale } = useI18n()

const isCollapse = ref(false)
const currentLang = ref(localale.value)

const activeMenu = computed(() => route.path)

function handleCommand(cmd) {
  if (cmd === 'zh') {
    locale.value = 'zh'
    localStorage.setItem('lang', 'zh')
  } else if (cmd === 'en') {
    locale.value = 'en'
    localStorage.setItem('lang', 'en')
  }
  currentLang.value = locale.value
}

function handleUserCommand(cmd) {
  if (cmd === 'logout') {
    ElMessageBox.confirm('确认退出登录？', '提示', {
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push({ name: 'Login' })
    }).catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  background: var(--bg-primary);
}

.layout-aside {
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  transition: width 0.3s;
  overflow: hidden;
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--gradient-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.logo-g {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.layout-aside :deep(.el-menu) {
  border-right: none;
  padding: 12px 0;
}

.layout-aside :deep(.el-menu-item),
.layout-aside :deep(.el-sub-menu__title) {
  height: 44px;
  line-height: 44px;
  margin: 4px 8px;
  border-radius: 8px;
}

.layout-aside :deep(.el-menu-item.is-active) {
  border-right: none;
}

.layout-aside :deep(.el-menu-item .el-icon),
.layout-aside :deep(.el-sub-menu__title .el-icon) {
  font-size: 18px;
}

.layout-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: var(--accent-cyan);
}

.header-left :deep(.el-breadcrumb) {
  font-size: 14px;
}

.header-left :deep(.el-breadcrumb__inner) {
  color: var(--text-secondary);
}

.header-left :deep(.el-breadcrumb__inner.is-link) {
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.lang-switch {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background 0.2s;
  color: var(--text-secondary);
}

.lang-switch:hover {
  background: var(--bg-tertiary);
  color: var(--accent-cyan);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background 0.2s;
}

.user-info:hover {
  background: var(--bg-tertiary);
}

.username {
  color: var(--text-primary);
  font-size: 14px;
}

.layout-main {
  background: var(--bg-primary);
  padding: 0;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>