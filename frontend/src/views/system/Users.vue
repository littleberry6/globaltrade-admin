<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ $t('system.users') }}</h1>
      <el-button type="primary" @click="showDialog()">
        <el-icon><Plus /></el-icon>
        New User
      </el-button>
    </div>

    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="Search user" clearable style="width: 240px" @keyup.enter="loadData">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.role" placeholder="Role" clearable style="width: 140px">
        <el-option v-for="r in roleOptions" :key="r.value" :label="r.label" :value="r.value" />
      </el-select>
      <el-select v-model="filters.status" placeholder="Status" clearable style="width: 120px">
        <el-option label="Active" :value="1" />
        <el-option label="Disabled" :value="0" />
      </el-select>
      <el-button @click="resetFilters">Reset</el-button>
    </div>

    <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe>
      <el-table-column prop="username" :label="$t('system.username')" width="140" />
      <el-table-column prop="nickname" label="Nickname" width="140" />
      <el-table-column prop="email" :label="$t('customers.email')" width="180" />
      <el-table-column :label="$t('system.role')" width="120">
        <template #default="{ row }">
          <el-tag :type="roleType(row.role)" effect="dark" size="small">{{ getRoleLabel(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('system.status')" width="100">
        <template #default="{ row }">
          <el-switch :model-value="row.status === 1" @change="toggleStatus(row)" />
        </template>
      </el-table-column>
      <el-table-column :label="$t('system.lastLogin')" width="180">
        <template #default="{ row }">{{ formatDate(row.last_login_at) }}</template>
      </el-table-column>
      <el-table-column :label="$t('common.actions')" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="showDialog(row)"><el-icon><Edit /></el-icon></el-button>
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

    <el-dialog v-model="dialogVisible" :title="editing ? 'Edit User' : 'New User'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="Username" v-if="!editing">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="Password" v-if="!editing">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="Nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="Phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="Role">
          <el-select v-model="form.role" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Status">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
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
import { systemApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'viewer', label: 'Viewer' }
]

const filters = reactive({ page: 1, pageSize: 10, keyword: '', role: '', status: '' })

const dialogVisible = ref(false)
const editing = ref(null)
const form = reactive({
  username: '', password: '', nickname: '', email: '', phone: '', role: 'staff', status: 1
})

function getRoleLabel(r) { return roleOptions.find(o => o.value === r)?.label || r }
function roleType(r) { return { admin: 'danger', manager: 'warning', staff: '', viewer: 'info' }[r] || 'info' }
function formatDate(d) { return d ? new Date(d).toLocaleString() : '-' }

async function loadData() {
  loading.value = true
  try {
    const res = await systemApi.users(filters)
    tableData.value = res.data.list
    total.value = res.data.total
  } finally { loading.value = false }
}

function resetFilters() {
  filters.keyword = ''
  filters.role = ''
  filters.status = ''
  filters.page = 1
  loadData()
}

async function toggleStatus(row) {
  try {
    await systemApi.updateUser(row.id, { status: row.status === 1 ? 0 : 1 })
    ElMessage.success('Updated')
    loadData()
  } catch (e) { console.error(e) }
}

function showDialog(row) {
  editing.value = row || null
  if (row) {
    Object.assign(form, {
      username: row.username, password: '', nickname: row.nickname,
      email: row.email, phone: row.phone, role: row.role, status: row.status
    })
  } else {
    Object.assign(form, { username: '', password: '', nickname: '', email: '', phone: '', role: 'staff', status: 1 })
  }
  dialogVisible.value = true
}

async function handleSave() {
  try {
    const data = { ...form }
    if (editing.value) {
      await systemApi.updateUser(editing.value.id, data)
      ElMessage.success('Updated')
    } else {
      await systemApi.createUser(data)
      ElMessage.success('Created')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) { console.error(e) }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('Confirm delete?', 'Warning', { type: 'warning' })
    await systemApi.deleteUser(row.id)
    ElMessage.success('Deleted')
    loadData()
  } catch (e) { if (e !== 'cancel') console.error(e) }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>