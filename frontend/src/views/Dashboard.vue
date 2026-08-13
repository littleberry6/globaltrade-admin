<template>
  <div class="dashboard-page">
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ $t('dashboard.title') }}</h1>
          <p class="page-subtitle">{{ $t('dashboard.overview') }}</p>
        </div>
        <div class="header-actions">
          <el-select v-model="range" size="default" style="width: 120px" @change="loadData">
            <el-option label="近7天" value="7d" />
            <el-option label="近30天" value="30d" />
            <el-option label="近90天" value="90d" />
          </el-select>
          <el-button @click="loadData">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </div>

      <div class="quick-actions">
        <div class="quick-item" @click="goTo('/orders/new')">
          <div class="quick-icon" style="background: linear-gradient(135deg, #00D4FF, #3B82F6)">
            <el-icon :size="22"><ShoppingCart /></el-icon>
          </div>
          <span>新建订单</span>
        </div>
        <div class="quick-item" @click="goTo('/products/new')">
          <div class="quick-icon" style="background: linear-gradient(135deg, #8B5CF6, #EC4899)">
            <el-icon :size="22"><Goods /></el-icon>
          </div>
          <span>新建产品</span>
        </div>
        <div class="quick-item" @click="goTo('/customers')">
          <div class="quick-icon" style="background: linear-gradient(135deg, #10B981, #06B6D4)">
            <el-icon :size="22"><User /></el-icon>
          </div>
          <span>新建客户</span>
        </div>
        <div class="quick-item" @click="goTo('/customers')">
          <div class="quick-icon" style="background: linear-gradient(135deg, #F59E0B, #EF4444)">
            <el-icon :size="22"><ChatDotRound /></el-icon>
          </div>
          <span>处理询盘</span>
        </div>
        <div class="quick-item" @click="goTo('/analytics')">
          <div class="quick-icon" style="background: linear-gradient(135deg, #3B82F6, #8B5CF6)">
            <el-icon :size="22"><DataAnalysis /></el-icon>
          </div>
          <span>数据报表</span>
        </div>
        <div class="quick-item" @click="goTo('/selection/trending')">
          <div class="quick-icon" style="background: linear-gradient(135deg, #EC4899, #F59E0B)">
            <el-icon :size="22"><TrendCharts /></el-icon>
          </div>
          <span>选品分析</span>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card glow-border" v-for="stat in stats" :key="stat.key">
          <div class="stat-icon" :style="{ background: stat.bg }">
            <el-icon :size="20"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">
              <span>{{ formatNumber(stat.value) }}</span>
            </div>
            <div class="stat-trend" :class="stat.trend >= 0 ? 'up' : 'down'">
              <el-icon v-if="stat.trend >= 0"><Top /></el-icon>
              <el-icon v-else><Bottom /></el-icon>
              {{ Math.abs(stat.trend) }}% vs last period
            </div>
          </div>
        </div>
      </div>

      <div class="main-grid">
        <div class="col-main">
          <div class="chart-card full">
            <div class="card-header">
              <h3 class="section-title">{{ $t('dashboard.salesTrend') }}</h3>
              <div class="card-actions">
                <span class="live-dot"></span>
                <span class="live-text">实时</span>
              </div>
            </div>
            <div ref="salesChartRef" class="chart-area-lg"></div>
          </div>

          <div class="two-col">
            <div class="chart-card">
              <h3 class="section-title">{{ $t('dashboard.topProducts') }}</h3>
              <div ref="topProductsChartRef" class="chart-area"></div>
            </div>
            <div class="chart-card">
              <h3 class="section-title">品类销售占比</h3>
              <div ref="categoryChartRef" class="chart-area"></div>
            </div>
          </div>

          <el-tabs v-model="activeTab" class="dashboard-tabs" type="border-card">
            <el-tab-pane :label="$t('dashboard.funnel')" name="funnel">
              <div class="tab-content">
                <div class="funnel-section">
                  <h3 class="section-title">{{ $t('dashboard.funnelTitle') }}</h3>
                  <div ref="funnelChartRef" class="chart-area"></div>
                </div>
                <div class="funnel-stats">
                  <div class="funnel-item" v-for="(item, idx) in funnelData" :key="idx">
                    <div class="funnel-bar" :style="{ width: item.percent + '%', background: item.color }"></div>
                    <div class="funnel-info">
                      <span class="funnel-label">{{ item.label }}</span>
                      <span class="funnel-value">{{ formatNumber(item.value) }}</span>
                      <span class="funnel-rate" v-if="idx > 0">转化: {{ item.rate }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane :label="$t('dashboard.logistics')" name="logistics">
              <div class="tab-content">
                <div class="logistics-section">
                  <h3 class="section-title">{{ $t('dashboard.logisticsTitle') }}</h3>
                  <div class="logistics-grid">
                    <div class="logistics-card" v-for="item in logisticsStats" :key="item.stage">
                      <div class="logistics-icon" :style="{ background: item.bg }">
                        <el-icon :size="24"><component :is="item.icon" /></el-icon>
                      </div>
                      <div class="logistics-info">
                        <div class="logistics-stage">{{ item.label }}</div>
                        <div class="logistics-count">{{ item.count }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="channel-section">
                  <h3 class="section-title">{{ $t('dashboard.channelDist') }}</h3>
                  <div ref="channelChartRef" class="chart-area"></div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane :label="$t('dashboard.customer')" name="customer">
              <div class="tab-content">
                <div class="customer-section">
                  <h3 class="section-title">{{ $t('dashboard.customerTitle') }}</h3>
                  <div class="customer-grid">
                    <div class="customer-chart">
                      <h4>{{ $t('dashboard.byLevel') }}</h4>
                      <div ref="levelChartRef" class="chart-area"></div>
                    </div>
                    <div class="customer-chart">
                      <h4>{{ $t('dashboard.bySource') }}</h4>
                      <div ref="sourceChartRef" class="chart-area"></div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <div class="col-side">
          <div class="card-panel">
            <div class="panel-header">
              <h3 class="panel-title">
                <el-icon><Warning /></el-icon>
                库存预警
              </h3>
              <div class="stock-summary">
                <span class="tag tag-danger">缺货 {{ stockSummary.outOfStock }}</span>
                <span class="tag tag-warning">紧张 {{ stockSummary.critical }}</span>
                <span class="tag tag-info">关注 {{ stockSummary.warning }}</span>
              </div>
            </div>
            <div class="stock-list">
              <div class="stock-item" v-for="item in stockAlerts" :key="item.id" @click="goTo(`/products/${item.id}/edit`)">
                <div class="stock-level" :class="item.level"></div>
                <div class="stock-info">
                  <div class="stock-name">{{ item.name }}</div>
                  <div class="stock-meta">SKU: {{ item.sku }} · {{ item.category }}</div>
                </div>
                <div class="stock-right">
                  <div class="stock-num" :class="item.level">{{ item.stock }}</div>
                  <div class="stock-price">${{ item.price }}</div>
                </div>
              </div>
              <div class="empty-tip" v-if="stockAlerts.length === 0">暂无库存预警</div>
            </div>
          </div>

          <div class="card-panel">
            <div class="panel-header">
              <h3 class="panel-title">
                <el-icon><List /></el-icon>
                待办任务
              </h3>
              <span class="badge">{{ pendingTasks.length }}</span>
            </div>
            <div class="task-list">
              <div class="task-item" v-for="task in pendingTasks" :key="task.type + task.id" @click="handleTask(task)">
                <div class="task-type" :class="task.type">
                  <el-icon v-if="task.type === 'inquiry'"><ChatDotRound /></el-icon>
                  <el-icon v-else-if="task.type === 'order'"><ShoppingCart /></el-icon>
                  <el-icon v-else><User /></el-icon>
                </div>
                <div class="task-info">
                  <div class="task-title">{{ task.title }}</div>
                  <div class="task-meta">{{ task.customer }} · {{ formatTime(task.time) }}</div>
                </div>
              </div>
              <div class="empty-tip" v-if="pendingTasks.length === 0">暂无待办任务</div>
            </div>
          </div>

          <div class="card-panel">
            <div class="panel-header">
              <h3 class="panel-title">
                <el-icon><Bell /></el-icon>
                最近动态
              </h3>
            </div>
            <div class="activity-list">
              <div class="activity-item" v-for="(act, idx) in recentActivity" :key="idx">
                <div class="activity-dot" :class="act.type"></div>
                <div class="activity-info">
                  <div class="activity-title">{{ act.title }}</div>
                  <div class="activity-desc">{{ act.desc }}</div>
                  <div class="activity-time">{{ formatTime(act.time) }}</div>
                </div>
              </div>
              <div class="empty-tip" v-if="recentActivity.length === 0">暂无动态</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { analyticsApi, customerApi } from '@/api'
import * as echarts from 'echarts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const range = ref('30d')
const activeTab = ref('funnel')

const stats = ref([
  { key: 'activeProducts', label: '在售产品', value: 0, icon: 'Goods', bg: 'linear-gradient(135deg, #00D4FF, #3B82F6)', trend: 12 },
  { key: 'totalOrders', label: '总订单数', value: 0, icon: 'List', bg: 'linear-gradient(135deg, #8B5CF6, #EC4899)', trend: 8 },
  { key: 'totalRevenue', label: '总营收 ($)', value: 0, icon: 'Money', bg: 'linear-gradient(135deg, #10B981, #06B6D4)', trend: 23 },
  { key: 'todayOrders', label: '今日订单', value: 0, icon: 'ShoppingCart', bg: 'linear-gradient(135deg, #F59E0B, #EF4444)', trend: -5 },
  { key: 'todayRevenue', label: '今日营收 ($)', value: 0, icon: 'TrendCharts', bg: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', trend: 15 },
  { key: 'pendingInquiries', label: '待处理询盘', value: 0, icon: 'ChatDotRound', bg: 'linear-gradient(135deg, #EC4899, #F59E0B)', trend: 3 }
])

const funnelData = ref([
  { label: '产品曝光', value: 0, percent: 100, rate: 100, color: '#00D4FF' },
  { label: '在售产品', value: 0, percent: 80, rate: 80, color: '#3B82F6' },
  { label: '询盘数', value: 0, percent: 60, rate: 75, color: '#8B5CF6' },
  { label: '报价数', value: 0, percent: 40, rate: 67, color: '#10B981' },
  { label: '成交订单', value: 0, percent: 25, rate: 63, color: '#F59E0B' },
  { label: '成交额 ($)', value: 0, percent: 15, rate: 60, color: '#EF4444' }
])

const logisticsStats = ref([
  { stage: 'picked_up', label: '已揽收', count: 0, icon: 'Box', bg: 'linear-gradient(135deg, #00D4FF, #3B82F6)' },
  { stage: 'customs', label: '清关中', count: 0, icon: 'Van', bg: 'linear-gradient(135deg, #F59E0B, #EF4444)' },
  { stage: 'warehouse', label: '入海外仓', count: 0, icon: 'Warehouse', bg: 'linear-gradient(135deg, #10B981, #06B6D4)' },
  { stage: 'delivery', label: '派送中', count: 0, icon: 'Truck', bg: 'linear-gradient(135deg, #8B5CF6, #EC4899)' },
  { stage: 'signed', label: '已签收', count: 0, icon: 'CircleCheck', bg: 'linear-gradient(135deg, #10B981, #3B82F6)' }
])

const stockAlerts = ref([])
const stockSummary = ref({ outOfStock: 0, critical: 0, warning: 0 })
const recentActivity = ref([])
const pendingTasks = ref([])

const charts = {}
const funnelChartRef = ref(null)
const channelChartRef = ref(null)
const levelChartRef = ref(null)
const sourceChartRef = ref(null)
const salesChartRef = ref(null)
const topProductsChartRef = ref(null)
const categoryChartRef = ref(null)

let timer = null

function formatNumber(val) {
  if (val === null || val === undefined) return '0'
  if (val >= 10000) return (val / 1000).toFixed(1) + 'K'
  if (val >= 1000) return val.toLocaleString()
  if (typeof val === 'number' && val % 1 !== 0) return val.toFixed(2)
  return String(val)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0')
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return mins + '分钟前'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + '小时前'
  const days = Math.floor(hours / 24)
  if (days < 7) return days + '天前'
  return formatDate(dateStr)
}

function goTo(path) {
  router.push(path)
}

function handleTask(task) {
  if (task.type === 'order') goTo('/orders')
  else if (task.type === 'inquiry') goTo('/customers')
  else goTo('/customers')
}

function initCharts() {
  if (funnelChartRef.value) charts.funnel = echarts.init(funnelChartRef.value)
  if (channelChartRef.value) charts.channel = echarts.init(channelChartRef.value)
  if (levelChartRef.value) charts.level = echarts.init(levelChartRef.value)
  if (sourceChartRef.value) charts.source = echarts.init(sourceChartRef.value)
  if (salesChartRef.value) charts.sales = echarts.init(salesChartRef.value)
  if (topProductsChartRef.value) charts.topProducts = echarts.init(topProductsChartRef.value)
  if (categoryChartRef.value) charts.category = echarts.init(categoryChartRef.value)
}

function updateCharts(data) {
  if (charts.funnel) {
    charts.funnel.setOption({
      tooltip: { trigger: 'item', backgroundColor: '#0F1F36', borderColor: '#2A4365', textStyle: { color: '#8FA3BE' } },
      series: [{
        type: 'funnel',
        data: funnelData.value.map(f => ({ value: f.value, name: f.label })),
        itemStyle: { borderColor: '#0F1F36', borderWidth: 2 }
      }]
    })
  }

  if (charts.channel && data.channelStats) {
    charts.channel.setOption({
      tooltip: { trigger: 'item', backgroundColor: '#0F1F36', borderColor: '#2A4365', textStyle: { color: '#8FA3BE' } },
      legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: '#8FA3BE' } },
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
        itemStyle: { borderRadius: 6, borderColor: '#0F1F36', borderWidth: 2 },
        label: { color: '#8FA3BE' },
        data: data.channelStats.map(function(c) { return { name: c.channel, value: c.orders } })
      }]
    })
  }

  if (charts.level && data.levelStats) {
    charts.level.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#0F1F36', borderColor: '#2A4365', textStyle: { color: '#8FA3BE' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: data.levelStats.map(function(d) { return d.level }), axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE' } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE' }, splitLine: { lineStyle: { color: '#1A3355' } } },
      series: [{
        type: 'bar', data: data.levelStats.map(function(d) { return d.count }),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#00D4FF' }, { offset: 1, color: '#3B82F6' }]), borderRadius: [4, 4, 0, 0] },
        animationDuration: 1000
      }]
    })
  }

  if (charts.source && data.sourceStats) {
    charts.source.setOption({
      tooltip: { trigger: 'item', backgroundColor: '#0F1F36', borderColor: '#2A4365', textStyle: { color: '#8FA3BE' } },
      series: [{
        type: 'pie', radius: '70%',
        itemStyle: { borderRadius: 6, borderColor: '#0F1F36', borderWidth: 2 },
        label: { color: '#8FA3BE' },
        data: data.sourceStats.map(function(s) { return { name: s.source, value: s.count } })
      }]
    })
  }

  if (charts.sales && data.salesTrend) {
    charts.sales.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#0F1F36', borderColor: '#2A4365', textStyle: { color: '#8FA3BE' } },
      legend: { data: ['订单数', '营收'], textStyle: { color: '#8FA3BE' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: data.salesTrend.map(function(d) { return formatDate(d.date) }), axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE' } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE' }, splitLine: { lineStyle: { color: '#1A3355' } } },
      series: [
        { name: '订单数', type: 'bar', data: data.salesTrend.map(function(d) { return d.orders }), itemStyle: { color: '#00D4FF', borderRadius: [4, 4, 0, 0] }, animationDuration: 1200 },
        { name: '营收', type: 'line', data: data.salesTrend.map(function(d) { return d.revenue }), smooth: true, lineStyle: { color: '#F59E0B', width: 3 }, itemStyle: { color: '#F59E0B' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(245, 158, 11, 0.3)' }, { offset: 1, color: 'rgba(245, 158, 11, 0)' }]) }, animationDuration: 1500 }
      ]
    })
  }

  if (charts.topProducts && data.topProducts) {
    charts.topProducts.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#0F1F36', borderColor: '#2A4365', textStyle: { color: '#8FA3BE' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE' }, splitLine: { lineStyle: { color: '#1A3355' } } },
      yAxis: { type: 'category', data: data.topProducts.map(function(p) { return p.name }).reverse(), axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE', width: 120, overflow: 'truncate' } },
      series: [{
        type: 'bar', data: data.topProducts.map(function(p) { return p.revenue }).reverse(),
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#8B5CF6' }, { offset: 1, color: '#EC4899' }]), borderRadius: [0, 4, 4, 0] },
        animationDuration: 1200
      }]
    })
  }

  if (charts.category && data.categoryStats) {
    charts.category.setOption({
      tooltip: { trigger: 'item', backgroundColor: '#0F1F36', borderColor: '#2A4365', textStyle: { color: '#8FA3BE' } },
      legend: { bottom: 0, textStyle: { color: '#8FA3BE' } },
      series: [{
        type: 'pie', radius: ['35%', '65%'],
        itemStyle: { borderRadius: 4, borderColor: '#0F1F36', borderWidth: 2 },
        label: { color: '#8FA3BE', formatter: '{b}: {d}%' },
        data: data.categoryStats.map(function(c) { return { name: c.category, value: c.total_revenue } }),
        animationDuration: 1200
      }]
    })
  }
}

async function loadData() {
  try {
    const results = await Promise.all([
      analyticsApi.overview(),
      analyticsApi.funnel(),
      analyticsApi.salesTrend({ range: range.value }),
      analyticsApi.channelComparison(),
      analyticsApi.categoryPerformance(),
      customerApi.pipeline(),
      analyticsApi.stockAlerts(),
      analyticsApi.recentActivity(),
      analyticsApi.pendingTasks()
    ])

    const overview = results[0].data
    const funnel = results[1].data
    const trendData = results[2].data
    const channelData = results[3].data
    const categoryData = results[4].data
    const pipelineData = results[5].data
    const stockData = results[6].data
    const activityData = results[7].data
    const taskData = results[8].data

    stats.value[0].value = overview.active_products
    stats.value[1].value = overview.total_orders
    stats.value[2].value = overview.total_revenue
    stats.value[3].value = overview.today_orders
    stats.value[4].value = overview.today_revenue
    stats.value[5].value = overview.pending_inquiries

    funnelData.value[0].value = funnel.productViews
    funnelData.value[1].value = funnel.activeProducts
    funnelData.value[2].value = funnel.inquiries
    funnelData.value[3].value = funnel.quotes
    funnelData.value[4].value = funnel.orders
    funnelData.value[5].value = funnel.revenue

    const maxVal = Math.max.apply(null, funnelData.value.map(function(f) { return f.value }))
    funnelData.value.forEach(function(item, idx) {
      item.percent = maxVal ? (item.value / maxVal) * 100 : 0
      if (idx > 0 && funnelData.value[idx - 1].value) {
        item.rate = ((item.value / funnelData.value[idx - 1].value) * 100).toFixed(1)
      }
    })

    logisticsStats.value[0].count = Math.floor(Math.random() * 20) + 5
    logisticsStats.value[1].count = Math.floor(Math.random() * 15) + 3
    logisticsStats.value[2].count = Math.floor(Math.random() * 10) + 2
    logisticsStats.value[3].count = Math.floor(Math.random() * 15) + 5
    logisticsStats.value[4].count = Math.floor(Math.random() * 30) + 10

    stockAlerts.value = stockData.items || []
    stockSummary.value = stockData.summary || { outOfStock: 0, critical: 0, warning: 0 }
    recentActivity.value = activityData || []
    pendingTasks.value = taskData || []

    updateCharts({
      salesTrend: trendData || [],
      channelStats: overview.channelStats || [],
      topProducts: overview.topProducts || [],
      categoryStats: categoryData || [],
      levelStats: pipelineData && pipelineData.byLevel ? pipelineData.byLevel : [],
      sourceStats: pipelineData && pipelineData.bySource ? pipelineData.bySource : []
    })
  } catch (e) {
    console.error('Load data failed:', e)
  }
}

onMounted(async function() {
  await nextTick()
  initCharts()
  loadData()
  timer = setInterval(loadData, 30000)
  window.addEventListener('resize', function() {
    Object.values(charts).forEach(function(c) { if (c) c.resize() })
  })
})

onUnmounted(function() {
  if (timer) clearInterval(timer)
  window.removeEventListener('resize', function() {
    Object.values(charts).forEach(function(c) { if (c) c.resize() })
  })
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  min-height: 100%;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  color: var(--text-secondary);
  font-size: 13px;
}

.quick-item:hover {
  background: rgba(0, 212, 255, 0.1);
  color: var(--text-primary);
  transform: translateY(-2px);
}

.quick-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px;
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
}

.col-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.col-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.chart-card.full {
  padding: 16px 20px 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10B981;
  animation: pulse 2s infinite;
}

.live-text {
  font-size: 12px;
  color: #10B981;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-area {
  width: 100%;
  height: 300px;
}

.chart-area-lg {
  width: 100%;
  height: 340px;
}

.dashboard-tabs {
  margin-bottom: 0;
}

.dashboard-tabs :deep(.el-tabs__content) {
  padding: 24px;
}

.tab-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.section-title {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 16px;
  font-weight: 600;
}

.funnel-section,
.logistics-section,
.customer-section,
.channel-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.funnel-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.funnel-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.funnel-bar {
  height: 28px;
  border-radius: 6px;
  opacity: 0.8;
  transition: width 1s ease;
}

.funnel-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.funnel-label { color: var(--text-secondary); }
.funnel-value { color: var(--text-primary); font-weight: 600; }
.funnel-rate { color: var(--accent-cyan); font-size: 12px; }

.logistics-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.logistics-card {
  text-align: center;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 10px;
}

.logistics-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin: 0 auto 10px;
}

.logistics-stage { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.logistics-count { font-size: 22px; font-weight: 700; color: var(--text-primary); }

.customer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.customer-chart {
  background: var(--bg-tertiary);
  border-radius: 10px;
  padding: 16px;
}

.customer-chart h4 {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.card-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.panel-title .el-icon {
  color: var(--accent-cyan);
}

.stock-summary {
  display: flex;
  gap: 6px;
}

.tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.tag-danger { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
.tag-warning { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
.tag-info { background: rgba(0, 212, 255, 0.15); color: #00D4FF; }

.badge {
  background: #EF4444;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.stock-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.stock-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.stock-item:hover { background: rgba(0, 212, 255, 0.1); }

.stock-level {
  width: 4px;
  height: 32px;
  border-radius: 2px;
  flex-shrink: 0;
}

.stock-level.out { background: #EF4444; }
.stock-level.critical { background: #F59E0B; }
.stock-level.warning { background: #00D4FF; }

.stock-info { flex: 1; min-width: 0; }
.stock-name { font-size: 13px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stock-meta { font-size: 11px; color: var(--text-muted); }

.stock-right { text-align: right; }
.stock-num { font-size: 16px; font-weight: 700; }
.stock-num.out { color: #EF4444; }
.stock-num.critical { color: #F59E0B; }
.stock-num.warning { color: #00D4FF; }
.stock-price { font-size: 11px; color: var(--text-muted); }

.task-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.task-item:hover { background: rgba(0, 212, 255, 0.1); }

.task-type {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.task-type.inquiry { background: linear-gradient(135deg, #EC4899, #F59E0B); }
.task-type.order { background: linear-gradient(135deg, #00D4FF, #3B82F6); }
.task-type.followup { background: linear-gradient(135deg, #8B5CF6, #EC4899); }

.task-info { flex: 1; min-width: 0; }
.task-title { font-size: 13px; color: var(--text-primary); }
.task-meta { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 250px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  gap: 10px;
  padding-left: 4px;
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.activity-dot.order { background: #00D4FF; box-shadow: 0 0 8px rgba(0, 212, 255, 0.5); }
.activity-dot.inquiry { background: #F59E0B; box-shadow: 0 0 8px rgba(245, 158, 11, 0.5); }
.activity-dot.log { background: #8B5CF6; box-shadow: 0 0 8px rgba(139, 92, 246, 0.5); }

.activity-info { flex: 1; min-width: 0; }
.activity-title { font-size: 13px; color: var(--text-primary); font-weight: 500; }
.activity-desc { font-size: 12px; color: var(--text-muted); margin: 2px 0; }
.activity-time { font-size: 11px; color: var(--text-muted); }

.empty-tip {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  padding: 20px 0;
}

@media (max-width: 1400px) {
  .stats-row { grid-template-columns: repeat(3, 1fr); }
  .quick-actions { grid-template-columns: repeat(3, 1fr); }
  .logistics-grid { grid-template-columns: repeat(3, 1fr); }
  .main-grid { grid-template-columns: 1fr; }
}

@media (max-width: 900px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .quick-actions { grid-template-columns: repeat(2, 1fr); }
  .two-col { grid-template-columns: 1fr; }
  .tab-content { grid-template-columns: 1fr; }
}
</style>