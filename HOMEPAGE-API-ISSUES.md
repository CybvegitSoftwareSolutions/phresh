# Homepage API Issues & Fixes

## 🔍 **Current Issues**

Based on the network tab errors, the following APIs are failing:

### **1. Homepage API - `/api/homepage`**
- **Status:** ❌ Failing - Returns `{"success": false, "message": "..."}`
- **Issue:** This endpoint doesn't seem to exist in the frontend code
- **Used by:** Frontend doesn't call this - might be a legacy or incorrect call

### **2. Featured Products API - `/api/products/featured`**
- **Status:** ❌ Failing - Red X in network tab
- **Called by:** `HomePage.tsx` line 84
- **Method:** `apiService.getFeaturedProducts({ limit: 8 })`
- **Endpoint:** `GET /api/products/featured?limit=8`

### **3. Carousel API - `/api/carousel`**
- **Status:** ⚠️ No response data visible
- **Called by:** `HomePage.tsx` line 76
- **Method:** `apiService.getCarouselItems()`
- **Endpoint:** `GET /api/carousel`

### **4. Categories API - `/api/categories`**
- **Status:** ⚠️ Unknown
- **Called by:** `HomePage.tsx` line 121
- **Method:** `apiService.getCategories()`
- **Endpoint:** `GET /api/categories`

---

## 📋 **APIs Being Called in HomePage**

### **1. Carousel Items**
```typescript
apiService.getCarouselItems()
→ GET /api/carousel
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "...",
      "image_url": "...",
      "link_url": "...",
      "product_id": "...",
      "video_url": "...",
      "is_active": true,
      "order_position": 1
    }
  ]
}
```

**Frontend Issue:** The interface expects `id` but API returns `_id`

---

### **2. Featured Products**
```typescript
apiService.getFeaturedProducts({ limit: 8 })
→ GET /api/products/featured?limit=8
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "products": [...]
  }
  // OR
  "data": [...]
}
```

**Frontend Issue:** 
- Code handles multiple data structures (lines 88-95)
- Transform expects `product._id` → `id`, `product.name` → `title`
- Transform expects `product.images[0].url` but API might return `image_url`

---

### **3. Categories**
```typescript
apiService.getCategories()
→ GET /api/categories
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "...",
      "slug": "...",
      "description": "...",
      "homepage_image_url": "...",
      "homepage_description": "..."
    }
  ]
}
```

**Frontend Issue:** Interface expects `id` but API returns `_id`

---

### **4. Products by Category**
```typescript
apiService.getProductsByCategory(category.slug, { limit: 5 })
→ GET /api/products/category/:categorySlug?limit=5
```

**Expected Response:** Similar to featured products

---

## 🔧 **Fixes Needed**

### **1. Fix Carousel Data Mapping**
The carousel response needs to map `_id` to `id`:

```typescript
// Current (line 79)
setCarouselItems(carouselResponse.data || []);

// Should be:
if (carouselResponse.success && carouselResponse.data) {
  const mappedItems = carouselResponse.data.map((item: any) => ({
    id: item._id,
    title: item.title,
    image_url: item.image_url,
    link_url: item.link_url,
    product_id: item.product_id,
    video_url: item.video_url
  }));
  setCarouselItems(mappedItems);
}
```

### **2. Fix Product Image URLs**
The transform expects `product.images[0].url` but API might return `image_url`:

```typescript
// Current (line 108)
image_url: product.images?.[0]?.url || null,

// Should handle both:
image_url: product.image_url || product.images?.[0]?.url || null,
image_urls: product.image_urls || product.images?.map((img: any) => img.url) || [],
```

### **3. Fix Category ID Mapping**
```typescript
// Current interface expects `id` but API returns `_id`
// Need to map in the transform
```

---

## 🎯 **Backend API Requirements**

### **Verify these endpoints exist and return correct data:**

1. ✅ `GET /api/carousel` - Should return carousel items
2. ✅ `GET /api/products/featured?limit=8` - Should return featured products
3. ✅ `GET /api/categories` - Should return categories
4. ✅ `GET /api/products/category/:slug?limit=5` - Should return products by category

### **Expected Data Structures:**

**Products:**
- `_id` (not `id`)
- `name` (not `title`)
- `image_url` or `image_urls` (not `images[0].url`)
- `price`, `description`, `category`, etc.

**Carousel:**
- `_id` (not `id`)
- `title`, `image_url`, `link_url`, `video_url`, etc.

**Categories:**
- `_id` (not `id`)
- `name`, `slug`, `description`, etc.

---

## 🚀 **Quick Fixes**

Let me update the HomePage to handle the data structure correctly:

