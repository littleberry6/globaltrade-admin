<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ $t('selection.trending') }}</h1>
    </div>

    <el-card class="chart-card">
      <h3>Hot Products Trend</h3>
      <div ref="chartRef" class="chart-area"></div>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card class="rank-card">
          <h3>Top Selling Products</h3>
          <div class="rank-list">
            <div v-for="(item, idx) in trendingData" :key="idx" class="rank-item">
              <span class="rank" :class="{ 'top3': idx < 3 }">{{ idx + 1 }}</span>
              <div class="rank-info">
                <div class="rank-name">{{ item.name }}</div>
                <div class="rank-meta">
                  <el-tag size="small">{{ item.category }}</el-tag>
                  <span class="sales">{{ item.sales_count }} sold</span>
                </div>
              </div>
              <div class="rank-price">${{ item.price }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="insight-card">
          <h3>Market Insights</h3>
          <div class="insight-content" v-if="trendingData.length">
            <div class="insight-item">
              <el-icon color="#00D4FF"><TrendCharts /></el-icon>
              <span>Top category: <strong>{{ topCategory }}</strong></span>
            </div>
            <div class="insight-item">
              <el-icon color="#10B981"><Money /></el-icon>
              <span>Avg price: <strong>${{ avgPrice }}</strong></span>
            </div>
            <div class="insight-item">
              <el-icon color="#F59E0B"><Goods /></el-icon>
              <span>Total products: <strong>{{ trendingData.length }}</strong></span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { selectionApi } from '@/api'
import * as echarts from 'echarts'

const trendingData = ref([])
const chartRef = ref(null)
let chart = null

const topCategory = computed(() => {
  const cats = {}
  trendingData.value.forEach(d => { cats[d.category] = (cats[d.category] || 0) + d.sales_count })
  return Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
})

const avgPrice = computed(() => {
  if (!trendingData.value.length) return '0'
  return (trendingData.value.reduce((s, d) => s + Number(d.price), 0) / trendingData.value.length).toFixed(2)
})

async function loadData() {
  try {
    const res = await selectionApi.trending()
    trendingData.value = res.data
    await nextTick()
    initChart()
  } catch (e) { console.error(e) }
}

function initChart() {
  if (!chartRef.value || !trendingData.value.length) return
  chart = echarts.init(chartRef.value, 'dark')
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,31,54,0.9)', borderColor: '#2A4365', textStyle: { color: '#E4EAF2' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: trendingData.value.map(d => d.name), axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE', rotate: 30, interval: 0 } },
    yAxis: { type: 'value', name: 'Sales', axisLine: { lineStyle: { color: '#2A4365' } }, axisLabel: { color: '#8FA3BE' }, splitLine: { lineStyle: { color: '#1A3355' } } },
    series: [{
      type: 'bar',
      data: trendingData.value.map(d => d.sales_count),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#00D4FF' }, { offset: 1, color: '#3B82F6' }]),
        borderRadius: [6, 6, 0, 0]
      },
      barWidth: '50%'
    }]
  })
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', () => chart?.resize())
})
</script>

<style lang="scss" scoped>
.chart-card, .rank-card, .insight-card {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
}

.chart-card h3, .rank-card h3, .insight-card h3 {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.chart-area {
  width: 100%;
  height: 350px;
}

.rank-list {
  max-height: 400px;
  overflow-y: auto;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  transition: background 0.2s;
}

.rank-item:hover {
  background: var(--bg-tertiary);
}

.rank {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--text-secondary);
  margin-right: 12px;
  flex-shrink: 0;
}

.rank.top3 {
  background: var(--gradient-primary);
  color: #fff;
}

.rank-info {
  flex: 1;
}

.rank-name {
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 4px;
}

.rank-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.sales {
  color: var(--accent-cyan);
}

.rank-price {
  color: var(--accent-orange);
  font-weight: 600;
  font-size: 18px;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.insight-item strong {
  color: var(--text-primary);
}
</style>