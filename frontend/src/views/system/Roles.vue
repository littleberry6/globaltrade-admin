<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ $t('system.roles') }}</h1>
      <el-button type="primary" @click="showDialog()">
        <el-icon><Plus /></el-icon>
        New Role
      </el-button>
    </div>

    <el-row :gutter="16">
      <el-col :span="16">
        <el-table :data="roleList" style="width: 100%" stripe>
          <el-table-column prop="name" label="Role Name" width="180" />
          <el-table-column prop="code" label="Code" width="140" />
          <el-table-column prop="description" label="Description" min-width="200" />
          <el-table-column :label="$t('common.actions')" width="150">
            <template #default="{ row }">
              <el-button size="small" link type="primary" @click="showDialog(row)"><el-icon><Edit /></el-icon></el-button>
              <el-button size="small" link type="danger" @click="handleDelete(row)"><el-icon><Delete /></el-icon></el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-col>

      <el-col :span="8">
        <el-card class="perm-card">
          <h3>Permissions</h3>
          <div class="perm-list" v-if="permissionList.length">
            <div v-for="perm in permissionList" :key="perm.key" class="perm-item">
              <el-checkbox
                v-model="form.permissions"
                :label="perm.key"
                :disabled="!editing"
              >
                {{ perm.name }}
              </el-checkbox>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" :title="editing ? 'Edit Role' : 'New Role'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="Role Name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="Code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="Permissions">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox v-for="perm in permissionList" :key="perm.key" :label="perm.key">
              {{ perm.name }}
            </el-checkbox>
          </el-checkbox-group>
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

const roleList = ref([])
const permissionList = ref([])

const dialogVisible = ref(false)
const editing = ref(null)
const form = reactive({ name: '', code: '', description: '', permissions: [] })

async function loadRoles() {
  try {
    const res = await systemApi.roles()
    roleList.value = res.data
  } catch (e) { console.error(e) }
}

async function loadPermissions() {
  try {
    const res = await systemApi.permissions()
    permissionList.value = res.data
  } catch (e) { console.error(e) }
}

function showDialog(row) {
  editing.value = row || null
  if (row) {
    form.name = row.name
    form.code = row.code
    form.description = row.description
    form.permissions = row.permissions || []
  } else {
    form.name = ''
    form.code = ''
    form.description = ''
    form.permissions = []
  }
  dialogVisible.value = true
}

async function handleSave() {
  try {
    if (editing.value) {
      await systemApi.updateRole(editing.value.id, form)
      ElMessage.success('Updated')
    } else {
      await systemApi.createRole(form)
      ElMessage.success('Created')
    }
    dialogVisible.value = false
    loadRoles()
  } catch (e) { console.error(e) }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('Confirm delete?', 'Warning', { type: 'warning' })
    await systemApi.deleteRole(row.id)
    ElMessage.success('Deleted')
    loadRoles()
  } catch (e) { if (e !== 'cancel') console.error(e) }
}

onMounted(() => {
  loadRoles()
  loadPermissions()
})
</script>

<style lang="scss" scoped>
.perm-card {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
}

.perm-card h3 {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.perm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 500px;
  overflow-y: auto;
}

.perm-item {
  padding: 8px;
  background: var(--bg-tertiary);
  border-radius: 6px;
}
</style>