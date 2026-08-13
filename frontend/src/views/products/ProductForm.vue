<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? $t('products.edit') : $t('products.create') }}</h1>
      <div>
        <el-button @click="$router.push('/products')">Cancel</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ $t('common.save') }}
        </el-button>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="product-form">
      <el-row :gutter="24">
        <el-col :span="12">
          <el-form-item label="Product Name" prop="name">
            <el-input v-model="form.name" placeholder="Enter product name" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="SKU" prop="sku">
            <el-input v-model="form.sku" placeholder="Enter SKU" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="24">
        <el-col :span="8">
          <el-form-item label="Category" prop="category">
            <el-select v-model="form.category" placeholder="Select category" style="width: 100%">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Price ($)" prop="price">
            <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Cost Price ($)" prop="costPrice">
            <el-input-number v-model="form.costPrice" :min="0" :precision="2" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="24">
        <el-col :span="8">
          <el-form-item label="Stock" prop="stock">
            <el-input-number v-model="form.stock" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Status">
            <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="On Sale" inactive-text="Off Shelf" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Description">
        <el-input v-model="form.description" type="textarea" :rows="6" placeholder="Enter product description" />
      </el-form-item>

      <el-form-item label="Images">
        <div class="image-upload">
          <div
            v-for="(img, idx) in form.images"
            :key="idx"
            class="image-item"
          >
            <img :src="img" />
            <el-icon class="remove-btn" @click="form.images.splice(idx, 1)"><Close /></el-icon>
          </div>
          <div class="image-upload-btn" @click="addImage">
            <el-icon :size="28"><Plus /></el-icon>
            <span>Add Image</span>
          </div>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productApi } from '@/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const productId = computed(() => route.params.id)

const formRef = ref(null)
const saving = ref(false)
const categories = ref([])

const form = reactive({
  name: '',
  sku: '',
  category: '',
  price: 0,
  costPrice: 0,
  stock: 0,
  description: '',
  images: [],
  status: 1
})

const rules = {
  name: [{ required: true, message: 'Please enter product name', trigger: 'blur' }],
  sku: [{ required: true, message: 'Please enter SKU', trigger: 'blur' }],
  price: [{ required: true, message: 'Please enter price', trigger: 'blur' }]
}

function addImage() {
  const url = prompt('Enter image URL')
  if (url) form.images.push(url)
}

async function loadProduct() {
  if (!isEdit.value) return
  try {
    const res = await productApi.getById(productId.value)
    const p = res.data
    Object.assign(form, {
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: p.price,
      costPrice: p.cost_price,
      stock: p.stock,
      description: p.description,
      images: p.images || [],
      status: p.status
    })
  } catch (e) {
    console.error(e)
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

async function handleSave() {
  try {
    await formRef.value.validate()
    saving.value = true
    const data = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      price: form.price,
      costPrice: form.costPrice,
      stock: form.stock,
      description: form.description,
      images: form.images,
      status: form.status
    }
    if (isEdit.value) {
      await productApi.update(productId.value, data)
      ElMessage.success('Updated')
    } else {
      await productApi.create(data)
      ElMessage.success('Created')
    }
    router.push('/products')
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadProduct()
})
</script>

<style lang="scss" scoped>
.product-form {
  max-width: 1000px;
}

.image-upload {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
}

.image-upload-btn {
  width: 120px;
  height: 120px;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: border-color 0.2s;
}

.image-upload-btn:hover {
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}
</style>