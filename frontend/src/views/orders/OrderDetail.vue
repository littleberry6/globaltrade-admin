<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 16px">
        <el-button @click="$router.back()"><el-icon><ArrowLeft /></el-icon></el-button>
        <h1 class="page-title">{{ order?.order_no }}</h1>
      </div>
      <div>
        <el-tag :type="statusType" effect="dark" size="large">{{ statusLabel }}</el-tag>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="info-card">
          <h3 class="section-title">{{ $t('orders.detail') }}</h3>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="Order No.">{{ order?.order_no }}</el-descriptions-item>
            <el-descriptions-item label="Customer">{{ order?.customer_name }}</el-descriptions-item>
            <el-descriptions-item label="Channel">{{ getChannelLabel(order?.channel) }}</el-descriptions-item>
            <el-descriptions-item label="Total Amount">
              <span class="amount">${{ Number(order?.total_amount || 0).toFixed(2) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="Created">{{ formatDate(order?.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="Status">{{ statusLabel }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card" style="margin-top: 16px">
          <h3 class="section-title">{{ $t('orders.items') }}</h3>
          <el-table :data="order?.items || []" stripe>
            <el-table-column prop="product_name" label="Product" />
            <el-table-column prop="sku" label="SKU" width="140" />
            <el-table-column prop="quantity" label="Qty" width="80" align="center" />
            <el-table-column label="Price" width="120">
              <template #default="{ row }">${{ Number(row.price).toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="Subtotal" width="120">
              <template #default="{ row }">
                <span class="amount">${{ (Number(row.price) * row.quantity).toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="info-card">
          <h3 class="section-title">{{ $t('orders.logistics') }}</h3>
          <div class="logistics-timeline">
            <el-timeline>
              <el-timeline-item
                v-for="(log, idx) in order?.logistics || []"
                :key="idx"
                :timestamp="formatDate(log.created_at)"
                :color="idx === 0 ? '#00D4FF' : '#2A4365'"
              >
                <div class="logistics-stage">
                  <strong>{{ getStageLabel(log.stage) }}</strong>
                  <p>{{ log.description }}</p>
                </div>
              </el-timeline-item>
            </el-timeline>
            <div v-if="!order?.logistics?.length" class="no-logistics">
              No logistics data
            </div>
          </div>
          <el-button type="primary" style="width: 100%; margin-top: 16px" @click="showLogisticsDialog = true">
            + Add Logistics Node
          </el-button>
        </el-card>

        <el-card class="info-card" style="margin-top: 16px">
          <h3 class="section-title">Quick Actions</h3>
          <div class="action-buttons">
            <el-button :type="nextStatusType" @click="handleNextStatus">
              Move to {{ nextStatusLabel }}
            </el-button>
            <el-button @click="showStatusDialog = true">Update Status</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showLogisticsDialog" title="Add Logistics Node" width="400px">
      <el-form label-width="80px">
        <el-form-item label="Stage">
          <el-select v-model="newLogistics.stage" style="width: 100%">
            <el-option label="Picked Up" value="picked_up" />
            <el-option label="Customs Clearance" value="customs" />
            <el-option label="Warehouse" value="warehouse" />
            <el-option label="Delivery" value="delivery" />
            <el-option label="Signed" value="signed" />
          </el-select>
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="newLogistics.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLogisticsDialog = false">Cancel</el-button>
        <el-button type="primary" @click="addLogistics">Confirm</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showStatusDialog" title="Update Status" width="400px">
      <el-form label-width="80px">
        <el-form-item label="Status">
          <el-select v-model="newStatus" style="width: 100%">
            <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStatusDialog = false">Cancel</el-button>
        <el-button type="primary" @click="updateStatus">Confirm</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { orderApi } from '@/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const loading = ref(false)
const order = ref(null)

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

const showLogisticsDialog = ref(false)
const newLogistics = ref({ stage: 'picked_up', description: '' })
const showStatusDialog = ref(false)
const newStatus = ref('')

const statusLabel = computed(() => statusOptions.find(o => o.value === order.value?.status)?.label || '')
const statusType = computed(() => {
  const map = { pending: 'info', paid: '', processing: 'warning', shipped: '', delivered: 'success', completed: 'success', cancelled: 'danger' }
  return map[order.value?.status] || 'info'
})

const nextStatusFlow = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'completed']
const nextStatusLabel = computed(() => {
  const idx = nextStatusFlow.indexOf(order.value?.status)
  if (idx >= 0 && idx < nextStatusFlow.length - 1) {
    return statusOptions.find(o => o.value === nextStatusFlow[idx + 1])?.label
  }
  return 'N/A'
})
const nextStatusType = computed(() => {
  const idx = nextStatusFlow.indexOf(order.value?.status)
  if (idx >= 0 && idx < nextStatusFlow.length - 1) return 'primary'
  return 'info'
})

function getChannelLabel(c) {
  const map = { alibaba: 'Alibaba', madeinchina: 'Made-in-China', amazon: 'Amazon', shopify: 'Shopify', tiktok: 'TikTok Shop', direct: 'Direct' }
  return map[c] || c
}

function getStageLabel(s) {
  const map = { picked_up: 'Picked Up', customs: 'Customs Clearance', warehouse: 'Warehouse', delivery: 'Out for Delivery', signed: 'Signed' }
  return map[s] || s
}

function formatDate(d) { return d ? new Date(d).toLocaleString() : '' }

async function loadData() {
  loading.value = true
  try {
    const res = await orderApi.getById(route.params.id)
    order.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function addLogistics() {
  try {
    await orderApi.addLogistics(order.value.id, newLogistics.value)
    ElMessage.success('Added')
    showLogisticsDialog.value = false
    newLogistics.value = { stage: 'picked_up', description: '' }
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function updateStatus() {
  try {
    await orderApi.updateStatus(order.value.id, newStatus.value)
    ElMessage.success('Updated')
    showStatusDialog.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}

function handleNextStatus() {
  const idx = nextStatusFlow.indexOf(order.value.status)
  if (idx >= 0 && idx < nextStatusFlow.length - 1) {
    newStatus.value = nextStatusFlow[idx + 1]
    updateStatus()
  }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.info-card {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.amount {
  color: var(--accent-cyan);
  font-weight: 600;
}

.logistics-timeline {
  padding: 8px 0;
}

.logistics-stage strong {
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
}

.logistics-stage p {
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0;
}

.no-logistics {
  text-align: center;
  color: var(--text-muted);
  padding: 20px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>