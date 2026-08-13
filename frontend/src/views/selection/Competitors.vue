<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ $t('selection.competitors') }}</h1>
      <el-button type="primary" @click="showDialog()">
        <el-icon><Plus /></el-icon>
        Add Competitor
      </el-button>
    </div>

    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="Search competitor" clearable style="width: 240px" @keyup.enter="loadData">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.category" placeholder="Category" clearable style="width: 160px">
        <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
      </el-select>
      <el-button @click="resetFilters">Reset</el-button>
    </div>

    <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe>
      <el-table-column prop="product_name" label="Product" min-width="180" />
      <el-table-column prop="competitor_name" label="Competitor" width="180" />
      <el-table-column prop="category" label="Category" width="120">
        <template #default="{ row }">
          <el-tag size="small" effect="dark">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Price" width="120">
        <template #default="{ row }">
          <span class="price">${{ row.price }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Our Price" width="120">
        <template #default="{ row }">
          <span class="our-price">${{ getOurPrice(row.product_id) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Diff" width="100">
        <template #default="{ row }">
          <span :class="diffClass(row)">
            {{ diffPercent(row) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="URL" min-width="150">
        <template #default="{ row }">
          <a :href="row.url" target="_blank" v-if="row.url">{{ row.url }}</a>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.actions')" width="120" fixed="right">
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

    <el-dialog v-model="dialogVisible" :title="editing ? 'Edit Competitor' : 'Add Competitor'" width="500px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="Product Name">
          <el-input v-model="form.productName" />
        </el-form-item>
        <el-form-item label="Competitor Name">
          <el-input v-model="form.competitorName" />
        </el-form-item>
        <el-form-item label="Category">
          <el-input v-model="form.category" />
        </el-form-item>
        <el-form-item label="Price ($)">
          <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="URL">
          <el-input v-model="form.url" />
        </el-form-item>
        <el-form-item label="Remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
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
import { selectionApi, productApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const categories = ref([])
const productPrices = ref({})

const filters = reactive({ page: 1, pageSize: 10, keyword: '', category: '' })

const dialogVisible = ref(false)
const editing = ref(null)
const form = reactive({
  productName: '', competitorName: '', category: '', price: 0, url: '', remark: ''
})

async function loadData() {
  loading.value = true
  try {
    const res = await selectionApi.competitors(filters)
    tableData.value = res.data.list
    total.value = res.data.total
  } finally { loading.value = false }
}

async function loadCategories() {
  try {
    const res = await productApi.categories()
    categories.value = res.data
  } catch (e) { console.error(e) }
}

async function loadProductPrices() {
  try {
    const res = await productApi.list({ pageSize: 500 })
    const map = {}
    res.data.list.forEach(p => { map[p.name] = p.price })
    productPrices.value = map
  } catch (e) { console.error(e) }
}

function getOurPrice(productName) {
  return productPrices.value[productName] || '0.00'
}

function diffPercent(row) {
  const ourPrice = parseFloat(getOurPrice(row.product_name))
  const compPrice = parseFloat(row.price)
  if (!ourPrice || !compPrice) return '-'
  const diff = ((ourPrice - compPrice) / compPrice * 100).toFixed(1)
  return (diff >= 0 ? '+' : '') + diff + '%'
}

function diffClass(row) {
  const ourPrice = parseFloat(getOurPrice(row.product_name))
  const compPrice = parseFloat(row.price)
  if (!ourPrice || !compPrice) return ''
  return ourPrice > compPrice ? 'higher' : 'lower'
}

function resetFilters() {
  filters.keyword = ''
  filters.category = ''
  filters.page = 1
  loadData()
}

function showDialog(row) {
  editing.value = row || null
  if (row) {
    Object.assign(form, {
      productName: row.product_name, competitorName: row.competitor_name,
      category: row.category, price: row.price, url: row.url, remark: row.remark
    })
  } else {
    Object.assign(form, { productName: '', competitorName: '', category: '', price: 0, url: '', remark: '' })
  }
  dialogVisible.value = true
}

async function handleSave() {
  try {
    const data = {
      productName: form.productName, competitorName: form.competitorName,
      category: form.category, price: form.price, url: form.url, remark: form.remark
    }
    if (editing.value) {
      await selectionApi.updateCompetitor(editing.value.id, data)
      ElMessage.success('Updated')
    } else {
      await selectionApi.createCompetitor(data)
      ElMessage.success('Created')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) { console.error(e) }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('Confirm delete?', 'Warning', { type: 'warning' })
    await selectionApi.deleteCompetitor(row.id)
    ElMessage.success('Deleted')
    loadData()
  } catch (e) { if (e !== 'cancel') console.error(e) }
}

onMounted(() => {
  loadData()
  loadCategories()
  loadProductPrices()
})
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.price {
  color: var(--accent-orange);
  font-weight: 600;
}

.our-price {
  color: var(--accent-cyan);
  font-weight: 600;
}

.higher {
  color: var(--accent-green);
  font-weight: 600;
}

.lower {
  color: var(--accent-red);
  font-weight: 600;
}
</style>