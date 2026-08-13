<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 16px">
        <el-button @click="$router.back()"><el-icon><ArrowLeft /></el-icon></el-button>
        <h1 class="page-title">{{ customer?.name }}</h1>
      </div>
      <el-button type="primary" @click="showInquiryDialog = true">
        <el-icon><Plus /></el-icon>
        Add Inquiry
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="info-card">
          <h3>Customer Info</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="Name">{{ customer?.name }}</el-descriptions-item>
            <el-descriptions-item label="Company">{{ customer?.company }}</el-descriptions-item>
            <el-descriptions-item label="Email">{{ customer?.email }}</el-descriptions-item>
            <el-descriptions-item label="Phone">{{ customer?.phone }}</el-descriptions-item>
            <el-descriptions-item label="Level">
              <el-tag :type="levelType(customer?.level)" effect="dark">{{ getLevelLabel(customer?.level) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Source">{{ getSourceLabel(customer?.source) }}</el-descriptions-item>
            <el-descriptions-item label="Address" :span="2">{{ customer?.address }}</el-descriptions-item>
            <el-descriptions-item label="Remark" :span="2">{{ customer?.remark }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card" style="margin-top: 16px">
          <h3>Inquiry History</h3>
          <el-table :data="customer?.inquiries || []" stripe>
            <el-table-column prop="type" label="Type" width="120">
              <template #default="{ row }">
                <el-tag size="small" effect="dark">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="Content" min-width="200" />
            <el-table-column prop="amount" label="Amount" width="120">
              <template #default="{ row }">
                <span v-if="row.amount">${{ row.amount }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="Status" width="120">
              <template #default="{ row }">
                <el-tag :type="inquiryStatusType(row.status)" size="small" effect="dark">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.actions')" width="120">
              <template #default="{ row }">
                <el-button size="small" link type="primary" @click="handleUpdateInquiry(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="info-card">
          <h3>Order History</h3>
          <el-table :data="customer?.orders || []" stripe>
            <el-table-column prop="order_no" label="Order No." width="180">
              <template #default="{ row }">
                <span class="order-no" @click="$router.push(`/orders/${row.id}`)">{{ row.order_no }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="total_amount" label="Amount" width="120">
              <template #default="{ row }">
                <span class="amount">${{ Number(row.total_amount).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="Status" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="dark">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="Date">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="info-card" style="margin-top: 16px">
          <h3>Conversion Pipeline</h3>
          <div ref="pipelineChartRef" class="chart-area"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showInquiryDialog" title="Add Inquiry" width="400px">
      <el-form :model="inquiryForm" label-width="80px">
        <el-form-item label="Type">
          <el-select v-model="inquiryForm.type" style="width: 100%">
            <el-option label="Inquiry" value="inquiry" />
            <el-option label="Quote" value="quote" />
            <el-option label="Sample" value="sample" />
            <el-option label="Negotiation" value="negotiation" />
          </el-select>
        </el-form-item>
        <el-form-item label="Content">
          <el-input v-model="inquiryForm.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="Amount">
          <el-input-number v-model="inquiryForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInquiryDialog = false">Cancel</el-button>
        <el-button type="primary" @click="addInquiry">Confirm</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showUpdateDialog" title="Update Inquiry" width="400px">
      <el-form :model="updateForm" label-width="80px">
        <el-form-item label="Status">
          <el-select v-model="updateForm.status" style="width: 100%">
            <el-option label="Pending" value="pending" />
            <el-option label="Replied" value="replied" />
            <el-option label="Quoted" value="quoted" />
            <el-option label="Negotiating" value="negotiating" />
            <el-option label="Won" value="won" />
            <el-option label="Lost" value="lost" />
          </el-select>
        </el-form-item>
        <el-form-item label="Content">
          <el-input v-model="updateForm.content" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUpdateDialog = false">Cancel</el-button>
        <el-button type="primary" @click="updateInquiry">Confirm</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { customerApi } from '@/api'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const route = useRoute()
const loading = ref(false)
const customer = ref(null)

const showInquiryDialog = ref(false)
const inquiryForm = ref({ type: 'inquiry', content: '', amount: 0 })

const showUpdateDialog = ref(false)
const updateForm = ref({ id: null, status: 'pending', content: '' })

const pipelineChartRef = ref(null)
let pipelineChart = null

function getLevelLabel(l) { return { vip: 'VIP', key: 'Key', normal: 'Normal', potential: 'Potential' }[l] || l }
function levelType(l) { return { vip: 'warning', key: 'danger', normal: '', potential: 'info' }[l] || 'info' }
function getSourceLabel(s) {
  const map = { alibaba: 'Alibaba', madeinchina: 'Made-in-China', expo: 'Expo', online: 'Online', referral: 'Referral', other: 'Other' }
  return map[s] || s
}
function inquiryStatusType(s) { return { pending: 'info', replied: '', quoted: 'warning', negotiating: 'warning', won: 'success', lost: 'danger' }[s] || 'info' }
function formatDate(d) { return d ? new Date(d).toLocaleString() : '' }

async function loadData() {
  loading.value = true
  try {
    const res = await customerApi.getById(route.params.id)
    customer.value = res.data
    await nextTick()
    initPipelineChart()
  } catch (e) { console.error(e) } finally { loading.value = false }
}

function initPipelineChart() {
  if (!pipelineChartRef.value) return
  pipelineChart = echarts.init(pipelineChartRef.value, 'dark')
  const inquiries = customer.value?.inquiries || []
  const stages = ['inquiry', 'quote', 'negotiation', 'won']
  const stageLabels = ['Inquiry', 'Quote', 'Negotiation', 'Won']
  const stageData = stages.map(s => inquiries.filter(i => i.type === s || i.status === s).length)

  pipelineChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,31,54,0.9)', borderColor: '#2A4365', textStyle: { color: '#E4EAF2' } },
    series: [{
      type: 'funnel',
      data: stageData.map((v, i) => ({ value: v, name: stageLabels[i] })),
      itemStyle: { borderColor: '#0F1F36', borderWidth: 2 },
      label: { color: '#8FA3BE' }
    }]
  })
}

async function addInquiry() {
  try {
    await customerApi.addInquiry(route.params.id, inquiryForm.value)
    ElMessage.success('Added')
    showInquiryDialog.value = false
    inquiryForm.value = { type: 'inquiry', content: '', amount: 0 }
    loadData()
  } catch (e) { console.error(e) }
}

function handleUpdateInquiry(row) {
  updateForm.value = { id: row.id, status: row.status, content: row.content }
  showUpdateDialog.value = true
}

async function updateInquiry() {
  try {
    await customerApi.updateInquiry(updateForm.value.id, { status: updateForm.value.status, content: updateForm.value.content })
    ElMessage.success('Updated')
    showUpdateDialog.value = false
    loadData()
  } catch (e) { console.error(e) }
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', () => pipelineChart?.resize())
})
</script>

<style lang="scss" scoped>
.info-card {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
}

.info-card h3 {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.order-no {
  color: var(--accent-cyan);
  cursor: pointer;
}

.order-no:hover {
  text-decoration: underline;
}

.amount {
  color: var(--accent-cyan);
  font-weight: 600;
}

.chart-area {
  width: 100%;
  height: 280px;
}
</style>