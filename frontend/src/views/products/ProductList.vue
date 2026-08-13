<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ $t('products.title') }}</h1>
      <div>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          {{ $t('products.exportData') }}
        </el-button>
        <el-button type="primary" @click="$router.push('/products/new')">
          <el-icon><Plus /></el-icon>
          {{ $t('products.create') }}
        </el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="filters.keyword" :placeholder="$t('products.name') + '/SKU'" clearable style="width: 240px" @keyup.enter="loadData">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.category" placeholder="Category" clearable style="width: 160px">
        <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="filters.status" placeholder="Status" clearable style="width: 140px">
        <el-option label="On Sale" :value="1" />
        <el-option label="Off Shelf" :value="0" />
      </el-select>
      <el-button @click="resetFilters">Reset</el-button>
    </div>

    <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe>
      <el-table-column type="index" label="#" width="60" />
      <el-table-column label="Image" width="100">
        <template #default="{ row }">
          <div class="product-thumb" @click="previewImage(row)">
            <img v-if="row.images && row.images.length" :src="row.images[0]" :alt="row.name" />
            <div v-else class="no-image"><el-icon><Goods /></el-icon></div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="name" :label="$t('products.name')" min-width="180">
        <template #default="{ row }">
          <span class="product-name">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sku" label="SKU" width="140" />
      <el-table-column prop="category" :label="$t('products.category')" width="120">
        <template #default="{ row }">
          <el-tag size="small" effect="dark">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Price" width="120">
        <template #default="{ row }">
          <span class="price">${{ row.price }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="stock" :label="$t('products.stock')" width="100">
        <template #default="{ row }">
          <span :class="{ 'low-stock': row.stock < 10 }">{{ row.stock }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('products.status')" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="dark" size="small">
            {{ row.status === 1 ? $t('products.onSale') : $t('products.offShelf') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.actions')" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link @click="handleView(row)">
            <el-icon><View /></el-icon>
          </el-button>
          <el-button size="small" link type="primary" @click="$router.push(`/products/${row.id}/edit`)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button size="small" link :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">
            {{ row.status === 1 ? 'Off Shelf' : 'On Sale' }}
          </el-button>
          <el-button size="small" link type="danger" @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="filters.page"
      v-model:page-size="filters.pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      background
      style="margin-top: 16px; justify-content: flex-end"
      @size-change="loadData"
      @current-change="loadData"
    />

    <el-dialog v-model="previewVisible" :title="currentProduct?.name" width="700px">
      <div class="preview-container">
        <div class="preview-main">
          <img :src="currentProduct?.images?.[currentImageIndex]" />
        </div>
        <div class="preview-thumbs" v-if="currentProduct?.images?.length > 1">
          <img
            v-for="(img, idx) in currentProduct.images"
            :key="idx"
            :src="img"
            :class="{ active: idx === currentImageIndex }"
            @click="currentImageIndex = idx"
          />
        </div>
        <div class="preview-actions" v-if="currentProduct?.images?.length > 1">
          <el-button @click="rotateLeft"><el-icon><RefreshLeft /></el-icon></el-button>
          <el-button @click="rotateRight"><el-icon><RefreshRight /></el-icon></el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { productApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const categories = ref([])

const filters = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  category: '',
  status: ''
})

const previewVisible = ref(false)
const currentProduct = ref(null)
const currentImageIndex = ref(0)
const rotation = ref(0)

async function loadData() {
  loading.value = true
  try {
    const res = await productApi.list(filters)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const res = await productApi.categories()
    categories.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.category = ''
  filters.status = ''
  filters.page = 1
  loadData()
}

function previewImage(row) {
  currentProduct.value = row
  currentImageIndex.value = 0
  rotation.value = 0
  previewVisible.value = true
}

function rotateLeft() {
  rotation.value -= 90
}

function rotateRight() {
  rotation.value += 90
}

function handleView(row) {
  currentProduct.value = row
  previewVisible.value = true
}

async function toggleStatus(row) {
  try {
    await productApi.updateStatus(row.id, row.status === 1 ? 0 : 1)
    ElMessage.success('Status updated')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('Confirm delete?', 'Warning', { type: 'warning' })
    await productApi.delete(row.id)
    ElMessage.success('Deleted')
    loadData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

function handleExport() {
  ElMessage.info('Exporting...')
}

onMounted(() => {
  loadData()
  loadCategories()
})
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.product-thumb {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  color: var(--text-muted);
}

.product-name {
  color: var(--text-primary);
  font-weight: 500;
}

.price {
  color: var(--accent-cyan);
  font-weight: 600;
}

.low-stock {
  color: var(--accent-orange);
  font-weight: 600;
}

.preview-container {
  text-align: center;
}

.preview-main {
  margin-bottom: 16px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-main img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  transition: transform 0.3s;
}

.preview-thumbs {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.preview-thumbs img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.preview-thumbs img.active {
  border-color: var(--accent-cyan);
}

.preview-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>