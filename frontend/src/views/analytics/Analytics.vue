<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ $t('analytics.title') }}</h1>
      <el-select v-model="range" style="width: 140px" @change="loadData">
        <el-option label="近7天" value="7d" />
        <el-option label="近30天" value="30d" />
        <el-option label="近90天" value="90d" />
      </el-select>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="8" v-for="stat in stats" :key="stat.key">
        <div class="stat-card">
          <div class="stat-header">
            <div class="stat-icon" :style="{ background: stat.bg }">
              <el-icon :size="20"><component :is="stat.icon" /></el-icon>
            </div>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
          <div class="stat-value">{{ stat.value }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card class="chart-card">
          <h3>{{ $t('analytics.salesTrend') }}</h3>
          <div ref="salesChartRef" class="chart-area"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <h3>{{ $t('analytics.channelComparison') }}</h3>
          <div ref="channelChartRef" class="chart-area"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <el-card class="chart-card">
          <h3>{{ $t('analytics.categoryPerformance') }}</h3>
          <div ref="categoryChartRef" class="chart-area"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { analyticsApi } from '@/api'
import * as echarts from 'echarts'

const range = ref('30d')

const stats = ref([
  { key: 'revenue', label: 'Total Revenue', value: '$0', icon: 'Money', bg: 'linear-gradient(135deg, #00D4FF, #3B82F6)' },
  { key: 'orders', label: 'Total Orders', value: '0', icon: 'List', bg: 'linear-gradient(135deg, #8B5CF6, #EC4899)' },
  { key: 'avgOrderValue', label: 'Avg Order Value', value: '$0', icon: 'TrendCharts', bg: 'linear-gradient(135deg, #10B981, #06B6D4)' }
])

const salesChartRef = ref(null)
const channelChartRef = ref(null)
const categoryChartRef = ref(null)
const charts = {}

function initCharts() {
  if (salesChartRef.value) charts.sales = echarts.init(salesChartRef.value, 'dark')
  if (channelChartRef.value) charts.channel = echarts.init(channelChartRef.value, 'dark')
  if (categoryChartRef.value) charts.category = echarts.init(categoryChartRef.value, 'dark')
}

function updateCharts(data) {
  if (charts.sales && data.salesTrend) {
    charts.sales.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,31,54,0.9)', borderColor: '#2A4365', textStyle: { color: '#E4EAF2' } },
      legend: { data: ['Revenue', 'Orders'], textStyle: { color: '#8FA3BE' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: data.salesTrend.map(d => new Date(d.date).toLocaleDateString()), axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE' } },
      yAxis: [
        { type: 'value', name: 'Revenue', axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE' }, splitLine: { lineStyle: { color: '#1A3355' } } },
        { type: 'value', name: 'Orders', axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE' }, splitLine: { show: false } }
      ],
      series: [
        { name: 'Revenue', type: 'bar', data: data.salesTrend.map(d => d.revenue), itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#00D4FF' }, { offset: 1, color: '#3B82F6' }]) } },
        { name: 'Orders', type: 'line', yAxisIndex: 1, data: data.salesTrend.map(d => d.orders), smooth: true, lineStyle: { color: '#F59E0B', width: 2 }, itemStyle: { color: '#F59E0B' } }
      ]
    })
  }

  if (charts.channel && data.channelData) {
    charts.channel.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,31,54,0.9)', borderColor: '#2A4365', textStyle: { color: '#E4EAF2' } },
      legend: { textStyle: { color: '#8FA3BE' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: data.channelData.map(d => d.channel), axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE' } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE' }, splitLine: { lineStyle: { color: '#1A3355' } } },
      series: [
        { name: 'Orders', type: 'bar', data: data.channelData.map(d => d.orders), itemStyle: { color: '#00D4FF', borderRadius: [4, 4, 0, 0] } },
        { name: 'Revenue', type: 'bar', data: data.channelData.map(d => d.revenue), itemStyle: { color: '#8B5CF6', borderRadius: [4, 4, 0, 0] } },
        { name: 'Avg Order Value', type: 'line', data: data.channelData.map(d => d.avg_order_value), smooth: true, itemStyle: { color: '#F59E0B' } }
      ]
    })
  }

  if (charts.category && data.categoryData) {
    charts.category.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,31,54,0.9)', borderColor: '#2A4365', textStyle: { color: '#E4EAF2' } },
      legend: { textStyle: { color: '#8FA3BE' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: data.categoryData.map(d => d.category), axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE' } },
      yAxis: { type: 'value', axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE' }, splitLine: { lineStyle: { color: '#1A3355' } } },
      series: [
        { name: 'Product Count', type: 'bar', data: data.categoryData.map(d => d.product_count), itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] } },
        { name: 'Total Sold', type: 'bar', data: data.categoryData.map(d => d.total_sold), itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] } },
        { name: 'Total Revenue', type: 'bar', data: data.categoryData.map(d => d.total_revenue), itemStyle: { color: '#F59E0B', borderRadius: [4, 4, 0, 0] } }
      ]
    })
  }
}

async function loadData() {
  try {
    const [overviewRes, channelRes, categoryRes, trendRes] = await Promise.all([
      analyticsApi.overview(),
      analyticsApi.channelComparison(),
      analyticsApi.categoryPerformance(),
      analyticsApi.salesTrend({ range: range.value })
    ])

    const overview = overviewRes.data
    stats.value[0].value = '$' + Number(overview.total_revenue || 0).toLocaleString()
    stats.value[1].value = overview.total_orders?.toLocaleString() || '0'
    stats.value[2].value = '$' + (overview.total_orders ? (overview.total_revenue / overview.total_orders).toFixed(2) : '0')

    updateCharts({
      salesTrend: trendRes.data,
      channelData: channelRes.data,
      categoryData: categoryRes.data
    })
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  await nextTick()
  initCharts()
  loadData()
  window.addEventListener('resize', () => {
    Object.values(charts).forEach(c => c?.resize())
  })
})
</script>

<style lang="scss" scoped>
.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.chart-card {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
}

.chart-card h3 {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.chart-area {
  width: 100%;
  height: 350px;
}
</style>