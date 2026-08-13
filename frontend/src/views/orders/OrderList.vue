<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ $t('orders.title') }}</h1>
      <div>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          New Order
        </el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="filters.keyword" placeholder="Order No. / Customer" clearable style="width: 240px" @keyup.enter="loadData">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filters.status" placeholder="Status" clearable style="width: 140px">
        <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>
      <el-select v-model="filters.channel" placeholder="Channel" clearable style="width: 140px">
        <el-option v-for="c in channelOptions" :key="c.value" :label="c.label" :value="c.value" />
      </el-select>
      <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="To" start-placeholder="Start" end-placeholder="End" />
      <el-button @click="resetFilters">Reset</el-button>
    </div>

    <el-table :data="tableData" style="width: 100%" v-loading="loading" stripe>
      <el-table-column prop="order_no" :label="$t('orders.orderNo')" width="200">
        <template #default="{ row }">
          <span class="order-no" @click="$router.push(`/orders/${row.id}`)">{{ row.order_no }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="customer_name" :label="$t('orders.customer')" width="180" />
      <el-table-column :label="$t('orders.channel')" width="120">
        <template #default="{ row }">
          <el-tag size="small" effect="dark">{{ getChannelLabel(row.channel) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('orders.totalAmount')" width="120">
        <template #default="{ row }">
          <span class="amount">${{ Number(row.total_amount).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('orders.status')" width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="dark" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('orders.createdAt')" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.actions')" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="$router.push(`/orders/${row.id}`)">
            <el-icon><View /></el-icon>
          </el-button>
          <el-button size="small" link type="warning" @click="handleUpdateStatus(row)">
            <el-icon><Edit /></el-icon>
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

    <el-dialog v-model="showCreateDialog" title="New Order" width="600px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="120px">
        <el-form-item label="Order No." prop="orderNo">
          <el-input v-model="createForm.orderNo" />
        </el-form-item>
        <el-form-item label="Customer" prop="customerId">
          <el-select v-model="createForm.customerId" placeholder="Select customer" style="width: 100%" @change="onCustomerChange">
            <el-option v-for="c in customerList" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Channel" prop="channel">
          <el-select v-model="createForm.channel" style="width: 100%">
            <el-option v-for="c in channelOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Products">
          <div v-for="(item, idx) in createForm.items" :key="idx" class="order-item">
            <el-select v-model="item.productId" placeholder="Select product" style="width: 200px" @change="onProductChange(idx)">
              <el-option v-for="p in productList" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
            <el-input-number v-model="item.quantity" :min="1" />
            <span class="item-price">${{ item.price }}</span>
            <el-button type="danger" link @click="createForm.items.splice(idx, 1)"><el-icon><Delete /></el-icon></el-button>
          </div>
          <el-button type="primary" link @click="addOrderItem">+ Add Product</el-button>
        </el-form-item>
        <el-form-item label="Total">
          <span class="amount">${{ totalAmount }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">Cancel</el-button>
        <el-button type="primary" @click="createOrder">Create</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { orderApi, customerApi, productApi } from '@/api'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

const channelOptions = [
  { value: 'alibaba', label: 'Alibaba' },
  { value: 'madeinchina', label: 'Made-in-China' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'shopify', label: 'Shopify' },
  { value: 'tiktok', label: 'TikTok Shop' },
  { value: 'direct', label: 'Direct' }
]

const filters = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: '',
  channel: '',
  dateRange: null
})

const showStatusDialog = ref(false)
const currentOrder = ref(null)
const newStatus = ref('')

const showCreateDialog = ref(false)
const createFormRef = ref(null)
const customerList = ref([])
const productList = ref([])

const createForm = reactive({
  orderNo: `GT${Date.now()}`,
  customerId: null,
  customerName: '',
  channel: 'alibaba',
  items: [{ productId: null, productName: '', sku: '', quantity: 1, price: 0 }]
})

const createRules = {
  orderNo: [{ required: true, message: 'Required', trigger: 'blur' }],
  customerId: [{ required: true, message: 'Required', trigger: 'change' }]
}

const totalAmount = computed(() => {
  return createForm.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
})

function getStatusLabel(s) { return statusOptions.find(o => o.value === s)?.label || s }
function getStatusType(s) {
  const map = { pending: 'info', paid: '', processing: 'warning', shipped: '', delivered: 'success', completed: 'success', cancelled: 'danger' }
  return map[s] || 'info'
}
function getChannelLabel(c) { return channelOptions.find(o => o.value === c)?.label || c }
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
    const res = await orderApi.list(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.channel = ''
  filters.dateRange = null
  filters.page = 1
  loadData()
}

function handleUpdateStatus(row) {
  currentOrder.value = row
  newStatus.value = row.status
  showStatusDialog.value = true
}

async function updateStatus() {
  try {
    await orderApi.updateStatus(currentOrder.value.id, newStatus.value)
    ElMessage.success('Updated')
    showStatusDialog.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function loadCustomers() {
  try {
    const res = await customerApi.list({ pageSize: 100 })
    customerList.value = res.data.list
  } catch (e) {
    console.error(e)
  }
}

async function loadProducts() {
  try {
    const res = await productApi.list({ pageSize: 100 })
    productList.value = res.data.list
  } catch (e) {
    console.error(e)
  }
}

function onCustomerChange(id) {
  const c = customerList.value.find(x => x.id === id)
  createForm.customerName = c?.name || ''
}

function onProductChange(idx) {
  const p = productList.value.find(x => x.id === createForm.items[idx].productId)
  if (p) {
    createForm.items[idx].productName = p.name
    createForm.items[idx].sku = p.sku
    createForm.items[idx].price = p.price
  }
}

function addOrderItem() {
  createForm.items.push({ productId: null, productName: '', sku: '', quantity: 1, price: 0 })
}

async function createOrder() {
  try {
    await createFormRef.value.validate()
    const data = {
      orderNo: createForm.orderNo,
      customerId: createForm.customerId,
      customerName: createForm.customerName,
      channel: createForm.channel,
      items: createForm.items.map(i => ({
        productId: i.productId,
        productName: i.productName,
        sku: i.sku,
        quantity: i.quantity,
        price: i.price
      })),
      totalAmount: totalAmount.value,
      status: 'pending'
    }
    await orderApi.create(data)
    ElMessage.success('Created')
    showCreateDialog.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
  loadCustomers()
  loadProducts()
})
</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.order-no {
  color: var(--accent-cyan);
  cursor: pointer;
  font-weight: 500;
}

.order-no:hover {
  text-decoration: underline;
}

.amount {
  color: var(--accent-cyan);
  font-weight: 600;
}

.order-item {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

.item-price {
  color: var(--accent-cyan);
  min-width: 70px;
}
</style>