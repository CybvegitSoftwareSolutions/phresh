# 🏠 Homepage Backend API Requirements

**Purpose:** Complete specification of all APIs and data structures needed for the Phresh homepage.

**Base URL:** `http://localhost:6001`

---

## 📋 **Overview**

The homepage requires **4 main API endpoints** to display:
1. **Carousel/Slider** items
2. **Featured Products**
3. **Categories** list
4. **Products by Category** (for each category)

---

## 1. 📸 **Carousel Items API**

### **Endpoint:** `GET /api/carousel`

**Description:** Returns all active carousel/slider items to display on the homepage hero section.

**Authentication:** Not required (public endpoint)

**Query Parameters:** None required

**cURL Example:**
```bash
curl -X GET http://localhost:6001/api/carousel
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67890abcdef1234567890123",
      "title": "Fresh Summer Collection",
      "image_url": "http://localhost:6001/uploads/carousel-summer.jpg",
      "link_url": "/products",
      "product_id": null,
      "video_url": null,
      "is_active": true,
      "order_position": 1,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "_id": "67890abcdef1234567890124",
      "title": "New Arrivals",
      "image_url": "http://localhost:6001/uploads/carousel-new.jpg",
      "link_url": "/products?new=true",
      "product_id": null,
      "video_url": null,
      "is_active": true,
      "order_position": 2,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

**Required Fields:**
- `_id` - Unique identifier (required)
- `title` - Carousel slide title (nullable)
- `image_url` - Image URL for the slide (required if no video_url)
- `link_url` - Link to navigate to (nullable)
- `product_id` - Product ID to link to (nullable)
- `video_url` - Video URL for the slide (nullable, alternative to image_url)
- `is_active` - Whether slide is active (boolean, required)
- `order_position` - Display order (number, required)

**Notes:**
- Should only return items where `is_active === true`
- Should be sorted by `order_position` (ascending)
- Either `image_url` OR `video_url` must be provided
- `link_url` can be relative path (e.g., `/products`) or absolute URL

---

## 2. ⭐ **Featured Products API**

### **Endpoint:** `GET /api/products/featured`

**Description:** Returns featured products to display in the "Featured Fresh Juices" section.

**Authentication:** Not required (public endpoint)

**Query Parameters:**
- `limit` (optional): Number of products to return (default: 8)
- `page` (optional): Page number for pagination (default: 1)

**cURL Example:**
```bash
curl -X GET "http://localhost:6001/api/products/featured?limit=8"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67890abcdef1234567890123",
      "name": "Fresh Orange Juice",
      "description": "100% pure orange juice, freshly squeezed",
      "price": 150.00,
      "discount": 10,
      "discount_type": "percentage",
      "discount_amount": null,
      "stock": 50,
      "image_url": "http://localhost:6001/uploads/product-orange.jpg",
      "image_urls": [
        "http://localhost:6001/uploads/product-orange-1.jpg",
        "http://localhost:6001/uploads/product-orange-2.jpg"
      ],
      "category": {
        "_id": "category123",
        "name": "Fruit Juices"
      },
      "is_featured": true,
      "variants": [
        {
          "_id": "variant123",
          "name": "250ml",
          "size": "250ml",
          "price": 150.00,
          "stock": 25
        },
        {
          "_id": "variant124",
          "name": "500ml",
          "size": "500ml",
          "price": 280.00,
          "stock": 25
        }
      ],
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Alternative Response Format (with pagination):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "67890abcdef1234567890123",
        "name": "Fresh Orange Juice",
        ...
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 8,
    "pages": 2
  }
}
```

**Required Fields:**
- `_id` - Product ID (required)
- `name` - Product name/title (required)
- `price` - Base price (required)
- `image_url` - Primary image URL (required)
- `image_urls` - Array of image URLs (optional, but recommended)
- `category` - Category object with `name` (required)
- `is_featured` - Should be `true` (required)

**Optional but Recommended:**
- `description` - Product description
- `discount` - Discount percentage (if applicable)
- `discount_type` - "percentage" or "amount"
- `discount_amount` - Fixed discount amount
- `variants` - Array of product variants
- `stock` - Available stock

**Notes:**
- Should only return products where `is_featured === true`
- Should be sorted by most recent or custom order
- At least one image URL (`image_url` or `image_urls[0]`) must be provided
- Variants should include size/name and price

---

## 3. 📂 **Categories API**

### **Endpoint:** `GET /api/categories`

**Description:** Returns all categories that should be displayed on the homepage (typically categories with `show_on_homepage === true`).

**Authentication:** Not required (public endpoint)

**Query Parameters:** None required

**cURL Example:**
```bash
curl -X GET http://localhost:6001/api/categories
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67890abcdef1234567890123",
      "name": "Fruit Juices",
      "slug": "fruit-juices",
      "description": "Fresh and natural fruit juices",
      "homepage_image_url": "http://localhost:6001/uploads/category-fruit.jpg",
      "homepage_description": "Discover our collection of fresh fruit juices",
      "image_url": "http://localhost:6001/uploads/category-fruit.jpg",
      "order": 1,
      "show_on_homepage": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "_id": "67890abcdef1234567890124",
      "name": "Vegetable Juices",
      "slug": "vegetable-juices",
      "description": "Healthy vegetable juice blends",
      "homepage_image_url": "http://localhost:6001/uploads/category-vegetable.jpg",
      "homepage_description": "Nutritious vegetable juice options",
      "image_url": "http://localhost:6001/uploads/category-vegetable.jpg",
      "order": 2,
      "show_on_homepage": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Required Fields:**
- `_id` - Category ID (required)
- `name` - Category name (required)
- `slug` - URL-friendly slug (required)
- `description` - Category description (nullable)
- `homepage_image_url` - Image for homepage display (nullable)
- `homepage_description` - Description for homepage (nullable)

**Optional Fields:**
- `image_url` - General category image
- `order` - Display order on homepage
- `show_on_homepage` - Boolean flag (should filter by this)

**Notes:**
- Should filter by `show_on_homepage === true` if that field exists
- Should be sorted by `order` (ascending)
- `slug` is used to fetch products by category
- At least `name` and `slug` are required

---

## 4. 🛍️ **Products by Category API**

### **Endpoint:** `GET /api/products/category/:categorySlug`

**Description:** Returns products for a specific category (used to populate each category section on homepage).

**Authentication:** Not required (public endpoint)

**URL Parameters:**
- `categorySlug` - The slug of the category (from categories API)

**Query Parameters:**
- `limit` (optional): Number of products to return (default: 5)
- `page` (optional): Page number for pagination (default: 1)

**cURL Example:**
```bash
curl -X GET "http://localhost:6001/api/products/category/fruit-juices?limit=5"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "67890abcdef1234567890123",
      "name": "Fresh Orange Juice",
      "description": "100% pure orange juice",
      "price": 150.00,
      "discount": 10,
      "discount_type": "percentage",
      "discount_amount": null,
      "stock": 50,
      "image_url": "http://localhost:6001/uploads/product-orange.jpg",
      "image_urls": [
        "http://localhost:6001/uploads/product-orange-1.jpg"
      ],
      "category": {
        "_id": "category123",
        "name": "Fruit Juices"
      },
      "variants": [
        {
          "_id": "variant123",
          "name": "250ml",
          "size": "250ml",
          "price": 150.00,
          "stock": 25
        }
      ],
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Alternative Response Format:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "67890abcdef1234567890123",
        "name": "Fresh Orange Juice",
        ...
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 5
  }
}
```

**Required Fields:** Same as Featured Products API

**Notes:**
- Should filter products by the category slug
- Should return only active/available products
- Should be sorted by relevance or newest first
- At least one image URL is required

---

## 📊 **Data Flow Summary**

1. **Page Load** → Frontend calls all 4 APIs in parallel
2. **Carousel** → Display slides at the top
3. **Featured Products** → Display in "Featured Fresh Juices" section
4. **Categories Loop** → For each category:
   - Display category header
   - Fetch products for that category
   - Display products in horizontal scroll/grid

---

## 🔄 **Response Format Standards**

All APIs should follow this consistent format:

### **Success Response:**
```json
{
  "success": true,
  "data": [/* array of items */]
  // OR
  "data": {/* single object */}
}
```

### **Error Response:**
```json
{
  "success": false,
  "message": "Error description here"
}
```

---

## ✅ **Validation Checklist**

### **For Carousel API:**
- [ ] Returns array of carousel items
- [ ] Only active items (`is_active: true`)
- [ ] Sorted by `order_position`
- [ ] Each item has either `image_url` or `video_url`
- [ ] `_id` field present

### **For Featured Products API:**
- [ ] Returns array of products
- [ ] Only featured products (`is_featured: true`)
- [ ] Each product has `_id`, `name`, `price`, `image_url`
- [ ] Category object with `name` included
- [ ] Supports `limit` query parameter

### **For Categories API:**
- [ ] Returns array of categories
- [ ] Only homepage categories (`show_on_homepage: true`)
- [ ] Each category has `_id`, `name`, `slug`
- [ ] Sorted by `order` (ascending)

### **For Products by Category API:**
- [ ] Filters by category slug correctly
- [ ] Returns array of products
- [ ] Supports `limit` query parameter
- [ ] Each product has required fields

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Empty Homepage**
**Cause:** API returning empty arrays or failing
**Solution:** Ensure databases have:
- At least 1 active carousel item
- At least 1 featured product
- At least 1 category with `show_on_homepage: true`
- Products in those categories

### **Issue 2: Missing Images**
**Cause:** `image_url` is null or invalid
**Solution:** 
- Ensure all products/carousel items have valid image URLs
- Use absolute URLs (not relative paths)
- Check file uploads are working

### **Issue 3: Wrong Data Format**
**Cause:** Using `id` instead of `_id`, `title` instead of `name`
**Solution:**
- Use MongoDB `_id` format (ObjectId string)
- Use `name` for products (frontend maps to `title`)
- Use `image_url` for images

### **Issue 4: Categories Not Showing Products**
**Cause:** Category slug mismatch or no products in category
**Solution:**
- Verify category slug matches between categories API and products API
- Ensure products have correct category reference
- Check category filtering logic in backend

---

## 📝 **Example: Complete Homepage Data Flow**

```javascript
// 1. Load Carousel
GET /api/carousel
→ Display carousel slides

// 2. Load Featured Products
GET /api/products/featured?limit=8
→ Display in "Featured Fresh Juices" section

// 3. Load Categories
GET /api/categories
→ Get list of categories to display

// 4. For each category, load products
GET /api/products/category/fruit-juices?limit=5
GET /api/products/category/vegetable-juices?limit=5
GET /api/products/category/detox-juices?limit=5
→ Display products under each category section
```

---

## 🎯 **Priority Order**

If implementing incrementally:

1. **HIGH PRIORITY:** Featured Products API
2. **HIGH PRIORITY:** Categories API
3. **MEDIUM PRIORITY:** Products by Category API
4. **LOW PRIORITY:** Carousel API (page works without it)

---

## 📞 **Testing Endpoints**

Use these cURL commands to test:

```bash
# Test Carousel
curl http://localhost:6001/api/carousel

# Test Featured Products
curl "http://localhost:6001/api/products/featured?limit=8"

# Test Categories
curl http://localhost:6001/api/categories

# Test Products by Category
curl "http://localhost:6001/api/products/category/fruit-juices?limit=5"
```

---

**Backend Team:** Please ensure all 4 APIs are implemented and returning data in the specified format. The homepage will remain empty until these APIs are working correctly.

