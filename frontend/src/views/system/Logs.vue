<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ $t('system.logs') }}</h1>
      <el-button @click="loadData"><el-icon><Refresh /></el-icon>Refresh</el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.userId" placeholder="User" clearable style="width: 160px">
        <el-option v-for="u in userOptions" :key="u.id" :label="u.username" :value="u.id" />
      </el-select>
      <el-select v-model="filters.action" placeholder="Action" clearable style="width: 140px">
        <el-option label="Create" value="create" />
        <el-option label="Update" value="update" />
        <el-option label="Delete" value="delete" />
        <el-option label="Login" value="login" />
        <el-option label="Export" value="export" />
      </el-select>
      <el-select v-model="filters.targetType" placeholder="Target Type" clearable style="width: 160px">
        <el-option label="Product" value="product" />
        <el-option label="Order" value="order" />
        <el-option label="Customer" value="customer" />
        <el-option label="User" value="user" />
        <el-option label="Competitor" value="competitor" />
      </el-select>
      <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="To" start-placeholder="Start" end-placeholder="End" />
      <el-button @click="resetFilters">Reset</el-button>
    </div>

    <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe>
      <el-table-column prop="username" label="User" width="140" />
      <el-table-column :label="$t('system.actions')" width="100">
        <template #default="{ row }">
          <el-tag :type="actionType(row.action)" size="small" effect="dark">{{ row.action }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="target_type" :label="$t('system.targetType')" width="120" />
      <el-table-column prop="target_id" label="Target ID" width="100" />
      <el-table-column prop="detail" label="Detail" min-width="200" />
      <el-table-column prop="created_at" label="Time" width="180">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { systemApi } from '@/api'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const userOptions = ref([])

const filters = reactive({
  page: 1,
  pageSize: 20,
  userId: '',
  action: '',
  targetType: '',
  dateRange: null
})

function actionType(a) { return { create: 'success', read: 'info', update: 'warning', delete: 'danger', login: '', export: '' }[a] || 'info' }
function formatDate(d) { return d ? new Date(d).toLocaleString() : '' }

async function loadData() {
  loading.value = true
  try {
    const params = { ...filters }
    if (filters.dateRange) {
      params.startDate = filters.dateRange[0]
      params.endDate = filters.dateRange[1]
    }
    delete params.dateRange
    const res = await systemApi.logs(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } finally { loading.value = false }
}

async function loadUsers() {
  try {
    const res = await systemApi.users({ pageSize: 100 })
    userOptions.value = res.data.list
  } catch (e) { console.error(e) }
}

function resetFilters() {
  filters.userId = ''
  filters.action = ''
  filters.targetType = ''
  filters.dateRange = null
  filters.page = 1
  loadData()
}

onMounted(() => {
  loadData()
  loadUsers()
})
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
</style>