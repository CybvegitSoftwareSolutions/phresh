# Complete Backend Migration Guide: Supabase → Node.js + MongoDB

## 🎯 **Overview**

This document provides complete specifications for migrating ALL Supabase functionality to your Node.js + MongoDB backend. Every table, API endpoint, data structure, and frontend requirement is detailed below.

---

## 📊 **Current Status**

### ✅ **Already Migrated (Working with Node.js)**
- Authentication System
- Cart Management
- Checkout Process
- Order Management
- Address Management
- Shipping Settings
- Payment Settings
- Admin Order Management

### 🔴 **Still Using Supabase (Need Migration)**
- User Profile Management
- Product Management (Admin)
- Review Management
- Carousel Management
- Blog Management
- Category Management
- Announcement Management
- Corporate Orders
- Contact Queries
- Featured Products
- Homepage Categories
- Dashboard Statistics

---

## 🗄️ **MongoDB Collections Required**

### **1. Users Collection** ✅ (Already exists)
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String,
  phone: String,
  role: String, // "user" or "admin"
  address: {
    country: String,
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  profileImage: String,
  isActive: Boolean,
  emailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **2. Products Collection** ✅ (Already exists)
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  category: ObjectId, // Reference to categories
  stock: Number,
  image_url: String,
  image_urls: [String],
  is_featured: Boolean,
  selling_points: [String],
  shipping_information: String,
  discount: Number,
  discount_amount: Number,
  discount_type: String, // "percentage" or "fixed"
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### **3. Product Variants Collection** ⚠️ (Need to create)
```javascript
{
  _id: ObjectId,
  productId: ObjectId, // Reference to products
  name: String, // "Small", "Large", "Red", "Blue"
  price: Number,
  stock: Number,
  sku: String,
  attributes: {
    size: String,
    color: String,
    material: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### **4. Categories Collection** ✅ (Already exists)
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String,
  description: String,
  image_url: String,
  order: Number, // For homepage display order
  createdAt: Date,
  updatedAt: Date
}
```

### **5. Orders Collection** ✅ (Already exists)
```javascript
{
  _id: ObjectId,
  orderNumber: String, // "ORD-2024-001"
  userId: ObjectId, // Reference to users (null for guest orders)
  customer_name: String,
  customer_email: String,
  customer_phone: String,
  customer_address: String,
  total_amount: Number,
  status: String, // "pending", "confirmed", "shipped", "delivered", "cancelled"
  paymentMethod: String,
  notes: String,
  public_token: String, // For guest order access
  order_items: [{
    product: ObjectId,
    quantity: Number,
    price_at_time: Number,
    variant_size: String,
    variant_price: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### **6. Reviews Collection** ⚠️ (Need to create)
```javascript
{
  _id: ObjectId,
  productId: ObjectId, // Reference to products
  userId: ObjectId, // Reference to users
  rating: Number, // 1-5
  title: String,
  comment: String,
  status: String, // "pending", "approved", "rejected"
  is_verified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **7. Blogs Collection** ⚠️ (Need to create)
```javascript
{
  _id: ObjectId,
  title: String,
  slug: String,
  content: String,
  excerpt: String,
  image_url: String,
  category: String, // "nutrition", "health", "recipes"
  author: String,
  published: Boolean,
  published_at: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### **8. Carousel Items Collection** ⚠️ (Need to create)
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  image_url: String,
  video_url: String, // Optional
  link_url: String, // Optional
  button_text: String, // Optional
  is_active: Boolean,
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### **9. Announcements Collection** ⚠️ (Need to create)
```javascript
{
  _id: ObjectId,
  title: String,
  message: String,
  link_url: String, // Optional
  text_color: String, // "#000000"
  bg_color: String, // "#FFD700"
  font_size: String, // "14px"
  is_active: Boolean,
  show_on_homepage: Boolean,
  show_in_header: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **10. Corporate Orders Collection** ⚠️ (Need to create)
```javascript
{
  _id: ObjectId,
  companyName: String,
  contactPerson: {
    name: String,
    email: String,
    phone: String,
    position: String
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  orderDetails: {
    eventDate: Date,
    eventType: String,
    estimatedGuests: Number,
    specialRequirements: String
  },
  items: [{
    product: ObjectId,
    quantity: Number,
    price: Number,
    notes: String
  }],
  status: String, // "pending", "approved", "rejected", "processing"
  createdAt: Date,
  updatedAt: Date
}
```

### **11. Contact Queries Collection** ⚠️ (Need to create)
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  subject: String,
  message: String,
  category: String, // "general", "support", "sales"
  is_read: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **12. Cart Items Collection** ✅ (Already exists)
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to users
  productId: ObjectId, // Reference to products
  quantity: Number,
  variant_size: String,
  variant_price: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### **13. Addresses Collection** ✅ (Already exists)
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to users
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  floor: String,
  apartment: String,
  is_default: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **14. Settings Collections** ✅ (Already exists)
```javascript
// Shipping Settings
{
  _id: ObjectId,
  cod_enabled: Boolean,
  delivery_charges: Number,
  free_delivery_threshold: Number,
  delivery_time: String,
  applicable_cities: [String],
  createdAt: Date,
  updatedAt: Date
}

// Payment Settings
{
  _id: ObjectId,
  cod_enabled: Boolean,
  mobile_payment_enabled: Boolean,
  account_title: String,
  account_number: String,
  iban: String,
  bank_name: String,
  contact_email: String,
  contact_whatsapp: String,
  instructions: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 **API Endpoints Required**

### **1. User Profile Management**

#### `GET /api/auth/profile`
**Description:** Get current user's profile
**Auth:** Required (Bearer Token)
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "role": "user",
    "address": {
      "country": "Pakistan",
      "street": "123 Main St",
      "city": "Karachi",
      "state": "Sindh",
      "zipCode": "75000"
    },
    "profileImage": "https://...",
    "isActive": true,
    "emailVerified": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### `PUT /api/auth/profile`
**Description:** Update user's profile
**Auth:** Required (Bearer Token)
**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567891",
  "address": {
    "street": "123 Main St",
    "city": "Karachi",
    "state": "Sindh",
    "zipCode": "75000",
    "country": "Pakistan"
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1234567891",
    "address": {
      "street": "123 Main St",
      "city": "Karachi",
      "state": "Sindh",
      "zipCode": "75000",
      "country": "Pakistan"
    },
    "updatedAt": "2024-01-15T10:05:00Z"
  }
}
```

### **2. Product Variants Management**

#### `GET /api/products/:id/variants`
**Description:** Get all variants for a product
**Auth:** Required (Admin Token)
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "variant_id",
      "productId": "product_id",
      "name": "Large",
      "price": 15.99,
      "stock": 50,
      "sku": "PROD-LRG-001",
      "attributes": {
        "size": "Large",
        "color": "Red"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### `POST /api/products/:id/variants`
**Description:** Add a new variant to a product
**Auth:** Required (Admin Token)
**Request Body:**
```json
{
  "name": "Large",
  "price": 15.99,
  "stock": 50,
  "sku": "PROD-LRG-001",
  "attributes": {
    "size": "Large",
    "color": "Red"
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "variant_id",
    "productId": "product_id",
    "name": "Large",
    "price": 15.99,
    "stock": 50,
    "sku": "PROD-LRG-001",
    "attributes": {
      "size": "Large",
      "color": "Red"
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### `PUT /api/products/:id/variants/:variantId`
**Description:** Update a product variant
**Auth:** Required (Admin Token)
**Request Body:**
```json
{
  "name": "Extra Large",
  "price": 18.99,
  "stock": 30
}
```

#### `DELETE /api/products/:id/variants/:variantId`
**Description:** Delete a product variant
**Auth:** Required (Admin Token)
**Response:**
```json
{
  "success": true,
  "message": "Variant deleted successfully"
}
```

### **3. Reviews Management**

#### `GET /api/admin/reviews`
**Description:** Get all reviews (admin only)
**Auth:** Required (Admin Token)
**Query Parameters:** `page`, `limit`, `status`, `rating`
**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "review_id",
        "productId": "product_id",
        "userId": "user_id",
        "rating": 5,
        "title": "Great product!",
        "comment": "Really love this juice",
        "status": "approved",
        "is_verified": true,
        "user": {
          "name": "John Doe",
          "email": "john@example.com"
        },
        "product": {
          "name": "Fresh Orange Juice",
          "image_url": "https://..."
        },
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

#### `PUT /api/reviews/:id/approve`
**Description:** Approve a review
**Auth:** Required (Admin Token)
**Request Body:**
```json
{
  "status": "approved"
}
```

#### `DELETE /api/reviews/:id`
**Description:** Delete a review
**Auth:** Required (Admin Token)
**Response:**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

### **4. Carousel Management**

#### `GET /api/admin/carousel`
**Description:** Get all carousel items (admin)
**Auth:** Required (Admin Token)
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "carousel_id",
      "title": "Summer Collection",
      "description": "Check out our new summer collection",
      "image_url": "https://...",
      "video_url": "https://...",
      "link_url": "https://...",
      "button_text": "Shop Now",
      "is_active": true,
      "order": 1,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### `POST /api/admin/carousel`
**Description:** Create a new carousel item
**Auth:** Required (Admin Token)
**Request Body:**
```json
{
  "title": "Summer Collection",
  "description": "Check out our new summer collection",
  "image_url": "https://...",
  "video_url": "https://...",
  "link_url": "https://...",
  "button_text": "Shop Now",
  "is_active": true,
  "order": 1
}
```

#### `PUT /api/admin/carousel/:id`
**Description:** Update a carousel item
**Auth:** Required (Admin Token)

#### `DELETE /api/admin/carousel/:id`
**Description:** Delete a carousel item
**Auth:** Required (Admin Token)

### **5. Blog Management**

#### `GET /api/admin/blogs`
**Description:** Get all blogs (admin)
**Auth:** Required (Admin Token)
**Query Parameters:** `page`, `limit`, `category`, `published`
**Response:**
```json
{
  "success": true,
  "data": {
    "blogs": [
      {
        "_id": "blog_id",
        "title": "Health Benefits of Fresh Juice",
        "slug": "health-benefits-fresh-juice",
        "content": "<p>HTML content...</p>",
        "excerpt": "Learn about the amazing health benefits...",
        "image_url": "https://...",
        "category": "nutrition",
        "author": "Admin",
        "published": true,
        "published_at": "2024-01-15T10:00:00Z",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10
  }
}
```

#### `POST /api/admin/blogs`
**Description:** Create a new blog
**Auth:** Required (Admin Token)
**Request Body:**
```json
{
  "title": "Health Benefits of Fresh Juice",
  "slug": "health-benefits-fresh-juice",
  "content": "<p>HTML content...</p>",
  "excerpt": "Learn about the amazing health benefits...",
  "image_url": "https://...",
  "category": "nutrition",
  "author": "Admin",
  "published": true,
  "published_at": "2024-01-15T10:00:00Z"
}
```

#### `PUT /api/admin/blogs/:id`
**Description:** Update a blog
**Auth:** Required (Admin Token)

#### `DELETE /api/admin/blogs/:id`
**Description:** Delete a blog
**Auth:** Required (Admin Token)

### **6. Category Management**

#### `GET /api/admin/categories`
**Description:** Get all categories (admin)
**Auth:** Required (Admin Token)
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "category_id",
      "name": "Fruit Juices",
      "slug": "fruit-juices",
      "description": "Fresh fruit juices",
      "image_url": "https://...",
      "order": 1,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### `POST /api/admin/categories`
**Description:** Create a new category
**Auth:** Required (Admin Token)
**Request Body:**
```json
{
  "name": "Fruit Juices",
  "slug": "fruit-juices",
  "description": "Fresh fruit juices",
  "image_url": "https://...",
  "order": 1
}
```

#### `PUT /api/admin/categories/:id`
**Description:** Update a category
**Auth:** Required (Admin Token)

#### `DELETE /api/admin/categories/:id`
**Description:** Delete a category
**Auth:** Required (Admin Token)

### **7. Announcement Management**

#### `GET /api/admin/announcements`
**Description:** Get all announcements (admin)
**Auth:** Required (Admin Token)
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "announcement_id",
      "title": "Free Shipping",
      "message": "Free shipping on orders over $50",
      "link_url": "https://...",
      "text_color": "#000000",
      "bg_color": "#FFD700",
      "font_size": "14px",
      "is_active": true,
      "show_on_homepage": true,
      "show_in_header": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### `POST /api/admin/announcements`
**Description:** Create a new announcement
**Auth:** Required (Admin Token)
**Request Body:**
```json
{
  "title": "Free Shipping",
  "message": "Free shipping on orders over $50",
  "link_url": "https://...",
  "text_color": "#000000",
  "bg_color": "#FFD700",
  "font_size": "14px",
  "is_active": true,
  "show_on_homepage": true,
  "show_in_header": true
}
```

#### `PUT /api/admin/announcements/:id`
**Description:** Update an announcement
**Auth:** Required (Admin Token)

#### `DELETE /api/admin/announcements/:id`
**Description:** Delete an announcement
**Auth:** Required (Admin Token)

### **8. Corporate Orders Management**

#### `GET /api/admin/corporate-orders`
**Description:** Get all corporate orders (admin)
**Auth:** Required (Admin Token)
**Query Parameters:** `page`, `limit`, `status`
**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "corporate_order_id",
        "companyName": "Tech Corp",
        "contactPerson": {
          "name": "Jane Smith",
          "email": "jane@techcorp.com",
          "phone": "+1234567890",
          "position": "Office Manager"
        },
        "deliveryAddress": {
          "street": "456 Business Ave",
          "city": "Karachi",
          "state": "Sindh",
          "zipCode": "75001",
          "country": "Pakistan"
        },
        "orderDetails": {
          "eventDate": "2024-02-15T10:00:00Z",
          "eventType": "office_meeting",
          "estimatedGuests": 50,
          "specialRequirements": "Fresh juices for morning meeting"
        },
        "items": [
          {
            "product": "product_id",
            "quantity": 25,
            "price": 150,
            "notes": "Fresh orange juice"
          }
        ],
        "status": "pending",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 10
  }
}
```

#### `PUT /api/admin/corporate-orders/:id/status`
**Description:** Update corporate order status
**Auth:** Required (Admin Token)
**Request Body:**
```json
{
  "status": "approved"
}
```

### **9. Contact Queries Management**

#### `GET /api/admin/contact-queries`
**Description:** Get all contact queries (admin)
**Auth:** Required (Admin Token)
**Query Parameters:** `page`, `limit`, `is_read`, `category`
**Response:**
```json
{
  "success": true,
  "data": {
    "queries": [
      {
        "_id": "query_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "subject": "Inquiry about bulk orders",
        "message": "I would like to know more about bulk ordering options...",
        "category": "general",
        "is_read": false,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

#### `PUT /api/admin/contact-queries/:id`
**Description:** Update contact query status
**Auth:** Required (Admin Token)
**Request Body:**
```json
{
  "is_read": true
}
```

#### `DELETE /api/admin/contact-queries/:id`
**Description:** Delete a contact query
**Auth:** Required (Admin Token)

### **10. Featured Products Management**

#### `GET /api/products/admin/featured`
**Description:** Get featured products (admin)
**Auth:** Required (Admin Token)
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "name": "Fresh Orange Juice",
      "price": 150,
      "image_url": "https://...",
      "is_featured": true,
      "category": {
        "name": "Fruit Juices"
      }
    }
  ]
}
```

#### `PUT /api/products/admin/featured`
**Description:** Toggle featured status for products
**Auth:** Required (Admin Token)
**Request Body:**
```json
{
  "productIds": ["product_id_1", "product_id_2", "product_id_3"]
}
```

### **11. Homepage Categories Management**

#### `GET /api/admin/homepage-categories`
**Description:** Get homepage categories (admin)
**Auth:** Required (Admin Token)
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "category_id",
      "name": "Fruit Juices",
      "slug": "fruit-juices",
      "image_url": "https://...",
      "order": 1
    }
  ]
}
```

#### `PUT /api/admin/homepage-categories`
**Description:** Update homepage categories order
**Auth:** Required (Admin Token)
**Request Body:**
```json
{
  "categoryIds": ["category_id_1", "category_id_2", "category_id_3"]
}
```

### **12. Dashboard Statistics**

#### `GET /api/admin/dashboard`
**Description:** Get dashboard statistics (admin)
**Auth:** Required (Admin Token)
**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 50000,
    "totalProducts": 25,
    "totalReviews": 85,
    "totalUsers": 120,
    "recentOrders": [
      {
        "_id": "order_id",
        "orderNumber": "ORD-2024-001",
        "customer_name": "John Doe",
        "total_amount": 250,
        "status": "pending",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "monthlyStats": {
      "orders": 45,
      "revenue": 15000,
      "newUsers": 20
    }
  }
}
```

### **13. File Upload APIs**

#### `POST /api/upload/product-image`
**Description:** Upload product image
**Auth:** Required (Admin Token)
**Request:** FormData with `image` field
**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cloudinary.com/image/upload/v1234567890/product_image.jpg",
    "public_id": "product_image_1234567890",
    "secure_url": "https://cloudinary.com/image/upload/v1234567890/product_image.jpg"
  }
}
```

#### `POST /api/upload/blog-image`
**Description:** Upload blog image
**Auth:** Required (Admin Token)
**Request:** FormData with `image` field

#### `POST /api/upload/carousel-media`
**Description:** Upload carousel image/video
**Auth:** Required (Admin Token)
**Request:** FormData with `media` field

### **14. Public APIs (No Auth Required)**

#### `GET /api/announcements/homepage`
**Description:** Get active homepage announcements
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "announcement_id",
      "title": "Free Shipping",
      "message": "Free shipping on orders over $50",
      "link_url": "https://...",
      "text_color": "#000000",
      "bg_color": "#FFD700",
      "font_size": "14px"
    }
  ]
}
```

#### `GET /api/blogs`
**Description:** Get published blogs
**Query Parameters:** `page`, `limit`, `category`
**Response:**
```json
{
  "success": true,
  "data": {
    "blogs": [
      {
        "_id": "blog_id",
        "title": "Health Benefits of Fresh Juice",
        "slug": "health-benefits-fresh-juice",
        "excerpt": "Learn about the amazing health benefits...",
        "image_url": "https://...",
        "category": "nutrition",
        "author": "Admin",
        "published_at": "2024-01-15T10:00:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10
  }
}
```

#### `GET /api/blogs/:slug`
**Description:** Get single blog by slug
**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "blog_id",
    "title": "Health Benefits of Fresh Juice",
    "slug": "health-benefits-fresh-juice",
    "content": "<p>HTML content...</p>",
    "excerpt": "Learn about the amazing health benefits...",
    "image_url": "https://...",
    "category": "nutrition",
    "author": "Admin",
    "published_at": "2024-01-15T10:00:00Z"
  }
}
```

#### `POST /api/contact/corporate`
**Description:** Submit corporate order request
**Request Body:**
```json
{
  "companyName": "Tech Corp",
  "contactPerson": {
    "name": "Jane Smith",
    "email": "jane@techcorp.com",
    "phone": "+1234567890",
    "position": "Office Manager"
  },
  "deliveryAddress": {
    "street": "456 Business Ave",
    "city": "Karachi",
    "state": "Sindh",
    "zipCode": "75001",
    "country": "Pakistan"
  },
  "orderDetails": {
    "eventDate": "2024-02-15T10:00:00Z",
    "eventType": "office_meeting",
    "estimatedGuests": 50,
    "specialRequirements": "Fresh juices for morning meeting"
  },
  "items": [
    {
      "product": "product_id",
      "quantity": 25,
      "price": 150,
      "notes": "Fresh orange juice"
    }
  ]
}
```

---

## 🔐 **Authentication & Authorization**

### **Middleware Required:**
1. **`auth`** - Verify JWT token
2. **`adminAuth`** - Verify JWT token + admin role
3. **`rateLimit`** - Rate limiting for public endpoints

### **Role-Based Access:**
- **Public APIs:** No authentication required
- **User APIs:** Require valid JWT token
- **Admin APIs:** Require valid JWT token + `role: "admin"`

---

## 📁 **File Upload Requirements**

### **Cloud Storage Integration:**
- **Cloudinary** or **AWS S3** for image/video storage
- **File validation:** Check file type, size limits
- **Image optimization:** Resize, compress images
- **Video support:** For carousel videos

### **Supported File Types:**
- **Images:** JPG, PNG, GIF, WebP
- **Videos:** MP4, WebM, MOV
- **File size limits:** 5MB for images, 50MB for videos

---

## 🎯 **Implementation Priority**

### **Phase 1: Critical (High Priority)**
1. **User Profile Management** - `GET/PUT /api/auth/profile`
2. **Dashboard Statistics** - `GET /api/admin/dashboard`
3. **Product Variants** - `GET/POST/PUT/DELETE /api/products/:id/variants`

### **Phase 2: Admin Management (Medium Priority)**
4. **Reviews Management** - `GET/PUT/DELETE /api/admin/reviews`
5. **Carousel Management** - `GET/POST/PUT/DELETE /api/admin/carousel`
6. **Blog Management** - `GET/POST/PUT/DELETE /api/admin/blogs`
7. **Category Management** - `GET/POST/PUT/DELETE /api/admin/categories`
8. **Announcement Management** - `GET/POST/PUT/DELETE /api/admin/announcements`

### **Phase 3: Advanced Features (Low Priority)**
9. **Corporate Orders** - `GET/PUT /api/admin/corporate-orders`
10. **Contact Queries** - `GET/PUT/DELETE /api/admin/contact-queries`
11. **Featured Products** - `GET/PUT /api/products/admin/featured`
12. **Homepage Categories** - `GET/PUT /api/admin/homepage-categories`
13. **File Upload** - `POST /api/upload/*`

### **Phase 4: Public APIs**
14. **Public Announcements** - `GET /api/announcements/homepage`
15. **Public Blogs** - `GET /api/blogs`, `GET /api/blogs/:slug`
16. **Corporate Order Form** - `POST /api/contact/corporate`

---

## 📝 **Frontend Integration Notes**

### **Data Structure Changes:**
- **Supabase:** `id` → **MongoDB:** `_id`
- **Supabase:** `created_at` → **MongoDB:** `createdAt`
- **Supabase:** `updated_at` → **MongoDB:** `updatedAt`
- **Supabase:** `order_number` → **MongoDB:** `orderNumber`
- **Supabase:** `product.title` → **MongoDB:** `product.name`

### **API Response Format:**
All APIs should follow this consistent format:
```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation successful"
}
```

### **Error Response Format:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

---

## 🚀 **Deployment Checklist**

### **Backend Requirements:**
- [ ] MongoDB database setup
- [ ] JWT authentication middleware
- [ ] Admin role verification
- [ ] File upload service (Cloudinary/S3)
- [ ] Rate limiting middleware
- [ ] CORS configuration
- [ ] Environment variables setup

### **Database Indexes:**
```javascript
// Users collection
db.users.createIndex({ "email": 1 }, { unique: true })

// Products collection
db.products.createIndex({ "category": 1 })
db.products.createIndex({ "is_featured": 1 })

// Orders collection
db.orders.createIndex({ "orderNumber": 1 }, { unique: true })
db.orders.createIndex({ "userId": 1 })
db.orders.createIndex({ "public_token": 1 })

// Reviews collection
db.reviews.createIndex({ "productId": 1 })
db.reviews.createIndex({ "userId": 1 })
db.reviews.createIndex({ "status": 1 })

// Blogs collection
db.blogs.createIndex({ "slug": 1 }, { unique: true })
db.blogs.createIndex({ "published": 1 })
db.blogs.createIndex({ "category": 1 })
```

---

## 📞 **Support & Testing**

### **API Testing:**
- Use Postman collection for testing
- Test all CRUD operations
- Test authentication flows
- Test file uploads
- Test error handling

### **Frontend Integration:**
- Replace all Supabase imports with `apiService`
- Update data structure references
- Test all admin functionality
- Test user-facing features

---

## 🎉 **Success Criteria**

**Complete migration achieved when:**
- [ ] All 21 components use Node.js APIs
- [ ] No Supabase imports remain
- [ ] All admin functionality works
- [ ] All user functionality works
- [ ] File uploads work
- [ ] Authentication works
- [ ] Error handling works

**This document provides everything needed to completely replace Supabase with your Node.js + MongoDB backend!** 🚀
