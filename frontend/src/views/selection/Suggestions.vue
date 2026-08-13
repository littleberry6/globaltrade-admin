<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ $t('selection.suggestions') }}</h1>
    </div>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-card class="suggest-card warning">
          <div class="suggest-header">
            <div class="suggest-icon"><el-icon :size="24"><Warning /></el-icon></div>
            <h3>Low Stock Alert</h3>
          </div>
          <div class="suggest-list" v-if="data.lowStock?.length">
            <div v-for="item in data.lowStock" :key="item.id" class="suggest-item">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-stock" :class="{ critical: item.stock < 5 }">Stock: {{ item.stock }}</span>
              </div>
              <el-button size="small" type="warning" link @click="$router.push(`/products/${item.id}/edit`)">Restock</el-button>
            </div>
          </div>
          <div v-else class="empty">No low stock items</div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="suggest-card danger">
          <div class="suggest-header">
            <div class="suggest-icon"><el-icon :size="24"><TrendCharts /></el-icon></div>
            <h3>Low Margin Products</h3>
          </div>
          <div class="suggest-list" v-if="data.lowMargin?.length">
            <div v-for="item in data.lowMargin" :key="item.id" class="suggest-item">
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-margin">Margin: {{ Number(item.margin_rate).toFixed(1) }}%</span>
              </div>
              <span class="item-price">${{ item.price }}</span>
            </div>
          </div>
          <div v-else class="empty">No low margin products</div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="suggest-card success">
          <div class="suggest-header">
            <div class="suggest-icon"><el-icon :size="24"><Promotion /></el-icon></div>
            <h3>Hot Categories</h3>
          </div>
          <div class="suggest-list" v-if="data.hotCategories?.length">
            <div v-for="(item, idx) in data.hotCategories" :key="idx" class="suggest-item hot">
              <span class="hot-rank">{{ idx + 1 }}</span>
              <div class="item-info">
                <span class="item-name">{{ item.category }}</span>
                <span class="item-sales">{{ item.sales }} sold</span>
              </div>
              <el-tag type="success" effect="dark">{{ item.sales }}</el-tag>
            </div>
          </div>
          <div v-else class="empty">No data</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="ai-card" style="margin-top: 20px">
      <div class="ai-header">
        <div class="ai-icon"><el-icon :size="20"><MagicStick /></el-icon></div>
        <h3>AI Suggestions</h3>
      </div>
      <div class="ai-content">
        <div class="ai-item" v-for="(item, idx) in aiSuggestions" :key="idx">
          <el-icon :size="18" color="#00D4FF"><component :is="item.icon" /></el-icon>
          <span>{{ item.text }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { selectionApi } from '@/api'

const data = ref({ lowStock: [], lowMargin: [], hotCategories: [] })

const aiSuggestions = computed(() => {
  const suggestions = []
  if (data.value.lowStock?.length > 0) {
    suggestions.push({ icon: 'Warning', text: `There are ${data.value.lowStock.length} products with low stock. Consider reordering to avoid stockouts.` })
  }
  if (data.value.lowMargin?.length > 0) {
    suggestions.push({ icon: 'TrendCharts', text: `${data.value.lowMargin.length} products have low margins. Consider adjusting prices or reducing costs.` })
  }
  if (data.value.hotCategories?.length > 0) {
    const topCat = data.value.hotCategories[0]
    suggestions.push({ icon: 'Promotion', text: `Category "${topCat.category}" is trending with ${topCat.sales} sales. Consider expanding this category.` })
  }
  if (suggestions.length === 0) {
    suggestions.push({ icon: 'CircleCheck', text: 'All products are healthy. No immediate action required.' })
  }
  return suggestions
})

async function loadData() {
  try {
    const res = await selectionApi.suggestions()
    data.value = res.data
  } catch (e) { console.error(e) }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.suggest-card {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
}

.suggest-card.warning { border-left: 4px solid var(--accent-orange) !important; }
.suggest-card.danger { border-left: 4px solid var(--accent-red) !important; }
.suggest-card.success { border-left: 4px solid var(--accent-green) !important; }

.suggest-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.suggest-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 212, 255, 0.1);
  color: var(--accent-cyan);
}

.suggest-card h3 {
  font-size: 16px;
  color: var(--text-primary);
}

.suggest-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 350px;
  overflow-y: auto;
}

.suggest-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  transition: background 0.2s;
}

.suggest-item:hover {
  background: var(--bg-card);
}

.suggest-item.hot {
  gap: 10px;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-name {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 13px;
}

.item-stock {
  color: var(--accent-orange);
  font-size: 12px;
}

.item-stock.critical {
  color: var(--accent-red);
}

.item-margin {
  color: var(--text-secondary);
  font-size: 12px;
}

.item-sales {
  color: var(--accent-cyan);
  font-size: 12px;
}

.item-price {
  color: var(--accent-green);
  font-weight: 600;
}

.hot-rank {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--gradient-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
}

.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 0;
}

.ai-card {
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.ai-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.ai-header h3 {
  color: var(--text-primary);
  font-size: 16px;
}

.ai-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.1);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
}
</style>