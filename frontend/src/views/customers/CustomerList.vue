<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ $t('customers.title') }}</h1>
      <el-button type="primary" @click="showDialog()">
        <el-icon><Plus /></el-icon>
        New Customer
      </el-button>
    </div>

    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="Name/Company/Email" clearable style="width: 240px" @keyup.enter="loadData">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.level" placeholder="Level" clearable style="width: 140px">
        <el-option label="VIP" value="vip" />
        <el-option label="Key" value="key" />
        <el-option label="Normal" value="normal" />
        <el-option label="Potential" value="potential" />
      </el-select>
      <el-select v-model="filters.source" placeholder="Source" clearable style="width: 140px">
        <el-option v-for="s in sourceOptions" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>
      <el-button @click="resetFilters">Reset</el-button>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="6" v-for="stat in pipelineStats" :key="stat.label">
        <div class="pipeline-card">
          <div class="pipeline-value">{{ stat.value }}</div>
          <div class="pipeline-label">{{ stat.label }}</div>
        </div>
      </el-col>
    </el-row>

    <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe>
      <el-table-column prop="name" :label="$t('customers.name')" width="140">
        <template #default="{ row }">
          <span class="customer-name" @click="$router.push(`/customers/${row.id}`)">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="company" :label="$t('customers.company')" min-width="160" />
      <el-table-column prop="email" :label="$t('customers.email')" width="180" />
      <el-table-column prop="phone" :label="$t('customers.phone')" width="140" />
      <el-table-column :label="$t('customers.level')" width="100">
        <template #default="{ row }">
          <el-tag :type="levelType(row.level)" effect="dark" size="small">{{ getLevelLabel(row.level) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('customers.source')" width="120">
        <template #default="{ row }">
          {{ getSourceLabel(row.source) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.actions')" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="$router.push(`/customers/${row.id}`)">
            <el-icon><View /></el-icon>
          </el-button>
          <el-button size="small" link @click="showDialog(row)"><el-icon><Edit /></el-icon></el-button>
          <el-button size="small" link type="danger" @click="handleDelete(row)"><el-icon><Delete /></el-icon></el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="filters.page"
      v-model:page-size="filters.pageSize"
      :total="total"
      layout="total, sizes, prev, pager, next"
      background
      style="margin-top: 16px; justify-content: flex-end"
      @size-change="loadData"
      @current-change="loadData"
    />

    <el-dialog v-model="dialogVisible" :title="editing ? 'Edit Customer' : 'New Customer'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="Name"><el-input v-model="form.name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Company"><el-input v-model="form.company" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="Email"><el-input v-model="form.email" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Phone"><el-input v-model="form.phone" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Level">
              <el-select v-model="form.level" style="width: 100%">
                <el-option label="VIP" value="vip" />
                <el-option label="Key" value="key" />
                <el-option label="Normal" value="normal" />
                <el-option label="Potential" value="potential" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Source">
              <el-select v-model="form.source" style="width: 100%">
                <el-option v-for="s in sourceOptions" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Address"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="Remark"><el-input v-model="form.remark" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSave">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { customerApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const sourceOptions = [
  { value: 'alibaba', label: 'Alibaba' },
  { value: 'madeinchina', label: 'Made-in-China' },
  { value: 'expo', label: 'Expo' },
  { value: 'online', label: 'Online' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' }
]

const pipelineStats = ref([])

const filters = reactive({ page: 1, pageSize: 10, keyword: '', level: '', source: '' })

const dialogVisible = ref(false)
const editing = ref(null)
const form = reactive({
  name: '', company: '', email: '', phone: '', level: 'potential', source: 'alibaba', address: '', remark: ''
})

function getLevelLabel(l) { return { vip: 'VIP', key: 'Key', normal: 'Normal', potential: 'Potential' }[l] || l }
function levelType(l) { return { vip: 'warning', key: 'danger', normal: '', potential: 'info' }[l] || 'info' }
function getSourceLabel(s) { return sourceOptions.find(o => o.value === s)?.label || s }

async function loadData() {
  loading.value = true
  try {
    const res = await customerApi.list(filters)
    tableData.value = res.data.list
    total.value = res.data.total
  } finally { loading.value = false }
}

async function loadPipeline() {
  try {
    const res = await customerApi.pipeline()
    const data = res.data
    pipelineStats.value = [
      { label: 'Total Customers', value: Object.values(data.byLevel || {}).reduce((s, v) => s + v.count, 0) },
      { label: 'VIP / Key Accounts', value: ((data.byLevel || []).filter(l => l.level === 'vip' || l.level === 'key').reduce((s, l) => s + l.count, 0)) },
      { label: 'Pending Inquiries', value: (data.inquiryStats || []).find(s => s.status === 'pending')?.count || 0 },
      { label: 'Conversion Rate', value: calcConversion(data) + '%' }
    ]
  } catch (e) { console.error(e) }
}

function calcConversion(data) {
  const total = (data.conversion || []).reduce((s, c) => s + Number(c.total_customers || 0), 0)
  const ordered = (data.conversion || []).reduce((s, c) => s + Number(c.ordered_customers || 0), 0)
  if (!total) return 0
  return ((ordered / total) * 100).toFixed(1)
}

function resetFilters() {
  filters.keyword = ''
  filters.level = ''
  filters.source = ''
  filters.page = 1
  loadData()
}

function showDialog(row) {
  editing.value = row || null
  if (row) {
    Object.assign(form, {
      name: row.name, company: row.company, email: row.email, phone: row.phone,
      level: row.level, source: row.source, address: row.address, remark: row.remark
    })
  } else {
    Object.assign(form, { name: '', company: '', email: '', phone: '', level: 'potential', source: 'alibaba', address: '', remark: '' })
  }
  dialogVisible.value = true
}

async function handleSave() {
  try {
    if (editing.value) {
      await customerApi.update(editing.value.id, form)
      ElMessage.success('Updated')
    } else {
      await customerApi.create(form)
      ElMessage.success('Created')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) { console.error(e) }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('Confirm delete?', 'Warning', { type: 'warning' })
    await customerApi.delete(row.id)
    ElMessage.success('Deleted')
    loadData()
  } catch (e) { if (e !== 'cancel') console.error(e) }
}

onMounted(() => {
  loadData()
  loadPipeline()
})
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.stats-row {
  margin-bottom: 16px;
}

.pipeline-card {
  background: var(--gradient-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.pipeline-value {
  font-size: 28px;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.pipeline-label {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 4px;
}

.customer-name {
  color: var(--accent-cyan);
  cursor: pointer;
  font-weight: 500;
}

.customer-name:hover {
  text-decoration: underline;
}
</style>