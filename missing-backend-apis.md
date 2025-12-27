# Missing Backend APIs

This document lists the backend APIs that are still missing and need to be implemented to complete the migration from Supabase to Node.js + MongoDB.

## 🔴 High Priority - Critical for Core Functionality

### 1. **Create Product Review API**
**Endpoint:** `POST /api/products/:productId/reviews`
**Request Body:**
```json
{
  "product_id": "string",
  "user_id": "string",
  "customer_name": "string",
  "rating": "number (1-5)",
  "comment": "string | null"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "_id": "string",
    "product_id": "string",
    "user_id": "string",
    "customer_name": "string",
    "rating": 5,
    "comment": "string",
    "status": "pending",
    "created_at": "ISO date string"
  }
}
```
**Status:** ❌ Missing - Currently being called in `ProductDetailPage.tsx` line 273

---

### 2. **File Upload API - Product Images**
**Endpoint:** `POST /api/upload/product-image`
**Request:** `multipart/form-data` with `file` field
**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://your-cdn.com/product-images/12345-image.jpg",
    "publicUrl": "https://your-cdn.com/product-images/12345-image.jpg"
  }
}
```
**Status:** ❌ Missing - Currently using Supabase storage in `ProductsManagement.tsx` lines 499-508

---

### 3. **File Upload API - Blog Images**
**Endpoint:** `POST /api/upload/blog-image`
**Request:** `multipart/form-data` with `file` field
**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://your-cdn.com/blog-images/12345-image.jpg",
    "publicUrl": "https://your-cdn.com/blog-images/12345-image.jpg"
  }
}
```
**Status:** ❌ Missing - Currently using Supabase storage in `BlogsManagement.tsx` lines 120-123

---

### 4. **File Upload API - Carousel Media (Images/Videos)**
**Endpoint:** `POST /api/upload/carousel`
**Request:** `multipart/form-data` with `file` field and optional `type` field ("image" or "video")
**Response:**
```json
{
  "success": true,
  "message": "Media uploaded successfully",
  "data": {
    "url": "https://your-cdn.com/carousel/12345-media.mp4",
    "publicUrl": "https://your-cdn.com/carousel/12345-media.mp4"
  }
}
```
**Status:** ❌ Missing - Currently using Supabase storage in `CarouselManagement.tsx` lines 228-234

---

### 5. **Dashboard Stats API**
**Endpoint:** `GET /api/admin/dashboard`
**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 0,
    "totalRevenue": 0,
    "pendingOrders": 0,
    "totalProducts": 0,
    "featuredProducts": 0,
    "totalCategories": 0
  }
}
```
**Status:** ⚠️ Partially Implemented - Method exists in `apiService.ts` but needs backend implementation check

---

## 🟡 Medium Priority - Feature Completeness

### 6. **Complete Product Variant Management**
**Current Status:** Partially implemented
**Missing Operations:**
- Bulk delete variants for a product
- Update variant structure to match backend schema (check `size` vs `name` field)

**Endpoints that may need verification:**
- `POST /api/products/:productId/variants` - Add variant
- `PUT /api/products/:productId/variants/:variantId` - Update variant
- `DELETE /api/products/:productId/variants/:variantId` - Delete variant
- `DELETE /api/products/:productId/variants` - Delete all variants (needed for editing)

**Status:** ⚠️ Needs Verification - ProductsManagement.tsx lines 256-278 still use Supabase

---

### 7. **Product Creation/Update with Variants**
**Current Status:** Partially implemented
**Issue:** The `handleSaveProduct` function in `ProductsManagement.tsx` still contains Supabase calls for:
- Product creation/update (lines 237-251)
- Variant deletion and creation (lines 256-278)

**Needed:** Ensure these operations work end-to-end with the backend APIs.

---

## 🔵 Low Priority - Nice to Have

### 8. **OTP Management APIs** (if not already implemented)
- `POST /api/auth/send-otp` - Send OTP for password reset
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password with OTP

**Status:** ❓ Unknown - May be needed for password reset functionality in AdminLogin.tsx

---

## 📋 Summary

### Critical Missing APIs (Must Implement):
1. ✅ **Create Review** - `POST /api/products/:productId/reviews`
2. ✅ **File Upload - Product Images** - `POST /api/upload/product-image`
3. ✅ **File Upload - Blog Images** - `POST /api/upload/blog-image`
4. ✅ **File Upload - Carousel Media** - `POST /api/upload/carousel`

### Needs Verification:
1. ⚠️ **Dashboard Stats** - `GET /api/admin/dashboard` (check if backend returns correct structure)
2. ⚠️ **Product Variant Management** - Verify all CRUD operations work correctly

### Components Affected:
- `src/pages/ProductDetailPage.tsx` - Needs create review API
- `src/components/admin/ProductsManagement.tsx` - Needs file upload and variant management
- `src/components/admin/BlogsManagement.tsx` - Needs file upload
- `src/components/admin/CarouselManagement.tsx` - Needs file upload
- `src/components/admin/DashboardOverview.tsx` - Needs dashboard stats API verification

---

## 🔧 Implementation Notes

### File Upload APIs:
- Should accept `multipart/form-data`
- Should handle both single and multiple file uploads
- Should return public URLs
- Should validate file types and sizes
- Should store files in appropriate buckets/folders

### Review API:
- Should prevent duplicate reviews from same user
- Should set initial status as 'pending'
- Should validate rating (1-5 range)
- Should associate review with user and product

### Dashboard Stats API:
- Should aggregate data from orders, products, and categories
- Should calculate total revenue from completed orders
- Should count pending orders
- Should be fast (consider caching)

---

## ✅ Next Steps

1. **Implement the missing file upload APIs** (3 endpoints)
2. **Implement the create review API**
3. **Verify dashboard stats API** returns correct data structure
4. **Complete ProductsManagement migration** by removing remaining Supabase calls
5. **Test all file upload functionality** in admin panel
6. **Test review submission** on product detail pages

