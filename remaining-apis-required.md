# Remaining APIs Required to Complete Supabase Migration

## 📋 **Current Status**

**✅ Already Migrated:**
- Cart System (GET, POST, PUT, DELETE)
- Checkout Process (Order Creation)
- Address Management (GET, POST, PUT, DELETE)
- Shipping Settings (GET, PUT)
- Payment Settings (GET, PUT)
- Admin Order Management (GET, PUT)

**⏳ Still Using Supabase:**
The following components and pages are still importing and using Supabase:

---

## 🔴 **Files Still Using Supabase:**

### **1. ProfilePage.tsx**
**What it does:**
- Loads user profile data
- Loads user addresses
- Loads user order history
- Updates user profile

**APIs Needed:**
- ✅ GET `/api/addresses` - Already have
- ✅ GET `/api/orders` - Already have (getUserOrders)
- ⚠️ Need: `GET /api/auth/profile` - Get user profile
- ⚠️ Need: `PUT /api/auth/profile` - Update user profile

---

### **2. AdminDashboard.tsx**
**What it does:**
- Shows dashboard statistics (total orders, revenue, products, etc.)
- Gets recent orders

**APIs Needed:**
- ⚠️ Need: `GET /api/admin/dashboard/stats` - Get dashboard statistics

**Response Format:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 50000,
    "totalProducts": 25,
    "totalReviews": 85,
    "recentOrders": [...]
  }
}
```

---

### **3. ProductsManagement.tsx**
**What it does:**
- CRUD operations for products
- Upload product images
- Manage product variants

**APIs Needed:**
- ✅ Already have: GET, POST, PUT, DELETE `/api/products`
- ⚠️ Need: `POST /api/products/upload` - Upload product image
- ⚠️ Need: `GET /api/products/:id/variants` - Get product variants
- ⚠️ Need: `POST /api/products/:id/variants` - Add variant
- ⚠️ Need: `PUT /api/products/:id/variants/:variantId` - Update variant
- ⚠️ Need: `DELETE /api/products/:id/variants/:variantId` - Delete variant

---

### **4. ReviewsManagement.tsx**
**What it does:**
- View all product reviews
- Approve/reject reviews
- Delete reviews

**APIs Needed:**
- ⚠️ Need: `GET /api/admin/reviews` - Get all reviews (admin only)
- ⚠️ Need: `PUT /api/reviews/:id/status` - Update review status (approve/reject)
- ⚠️ Need: `DELETE /api/reviews/:id` - Delete review

**Request:**
```json
{
  "status": "approved" // or "rejected"
}
```

---

### **5. CarouselManagement.tsx**
**What it does:**
- Manage homepage carousel items
- Upload carousel images/videos

**APIs Needed:**
- ⚠️ Need: `GET /api/admin/carousel` - Get all carousel items
- ⚠️ Need: `POST /api/admin/carousel` - Create carousel item
- ⚠️ Need: `PUT /api/admin/carousel/:id` - Update carousel item
- ⚠️ Need: `DELETE /api/admin/carousel/:id` - Delete carousel item
- ⚠️ Need: `POST /api/admin/carousel/upload` - Upload carousel image/video
- ⚠️ Need: `PUT /api/admin/carousel/:id/order` - Reorder carousel items

**Carousel Item Schema:**
```json
{
  "title": "Summer Collection",
  "description": "Check out our new summer collection",
  "image_url": "https://...",
  "video_url": "https://...", // optional
  "link_url": "https://...", // optional
  "button_text": "Shop Now", // optional
  "is_active": true,
  "order": 1
}
```

---

### **6. BlogsManagement.tsx**
**What it does:**
- CRUD operations for blog posts
- Upload blog images

**APIs Needed:**
- ⚠️ Need: `GET /api/admin/blogs` - Get all blogs (admin)
- ⚠️ Need: `POST /api/admin/blogs` - Create blog
- ⚠️ Need: `PUT /api/admin/blogs/:id` - Update blog
- ⚠️ Need: `DELETE /api/admin/blogs/:id` - Delete blog
- ⚠️ Need: `POST /api/admin/blogs/upload` - Upload blog image
- ⚠️ Need: `GET /api/admin/blogs/:id` - Get single blog

**Blog Schema:**
```json
{
  "title": "Blog Post Title",
  "slug": "blog-post-slug",
  "content": "HTML content...",
  "excerpt": "Short description...",
  "image_url": "https://...",
  "category": "nutrition",
  "author": "Admin",
  "published": true,
  "published_at": "2024-01-15T10:00:00Z"
}
```

---

### **7. CategoriesManagement.tsx**
**What it does:**
- CRUD operations for categories

**APIs Needed:**
- ⚠️ Need: `GET /api/admin/categories` - Get all categories
- ⚠️ Need: `POST /api/admin/categories` - Create category
- ⚠️ Need: `PUT /api/admin/categories/:id` - Update category
- ⚠️ Need: `DELETE /api/admin/categories/:id` - Delete category

**Category Schema:**
```json
{
  "name": "Fruit Juices",
  "slug": "fruit-juices",
  "description": "Fresh fruit juices",
  "image_url": "https://...",
  "order": 1
}
```

---

### **8. AnnouncementBarManagement.tsx**
**What it does:**
- Manage site announcements
- Control announcement visibility

**APIs Needed:**
- ⚠️ Need: `GET /api/admin/announcements` - Get all announcements (admin)
- ⚠️ Need: `POST /api/admin/announcements` - Create announcement
- ⚠️ Need: `PUT /api/admin/announcements/:id` - Update announcement
- ⚠️ Need: `DELETE /api/admin/announcements/:id` - Delete announcement

**Announcement Schema:**
```json
{
  "title": "Free Shipping",
  "message": "Free shipping on orders over $50",
  "link_url": "https://...",
  "text_color": "#000000",
  "bg_color": "#FFD700",
  "font_size": "14px",
  "is_active": true,
  "show_on_homepage": true
}
```

---

### **9. AnnouncementBar.tsx (Layout Component)**
**What it does:**
- Display active announcements on homepage

**APIs Needed:**
- ✅ Already have: `GET /api/announcements/homepage`

---

### **10. CorporateOrdersManagement.tsx**
**What it does:**
- View corporate order requests
- Update corporate order status
- Send email confirmations

**APIs Needed:**
- ⚠️ Need: `GET /api/admin/corporate-orders` - Get all corporate orders
- ⚠️ Need: `GET /api/admin/corporate-orders/:id` - Get single order
- ⚠️ Need: `PUT /api/admin/corporate-orders/:id/status` - Update status

**Request:**
```json
{
  "status": "approved" // or "rejected", "processing"
}
```

---

### **11. ContactQueriesManagement.tsx**
**What it does:**
- View contact form submissions
- Mark as read/unread
- Delete queries

**APIs Needed:**
- ⚠️ Need: `GET /api/admin/contact-queries` - Get all queries
- ⚠️ Need: `PUT /api/admin/contact-queries/:id` - Update query status (read/unread)
- ⚠️ Need: `DELETE /api/admin/contact-queries/:id` - Delete query

**Request:**
```json
{
  "is_read": true
}
```

---

### **12. BlogsPage.tsx**
**What it does:**
- Display list of blogs

**APIs Needed:**
- ✅ Already have: `GET /api/blogs`

---

### **13. BlogDetailPage.tsx**
**What it does:**
- Display single blog post

**APIs Needed:**
- ✅ Already have: `GET /api/blogs/:slug`

---

### **14. FeaturedProductsManagement.tsx**
**What it does:**
- Manage featured products

**APIs Needed:**
- ⚠️ Need: `GET /api/admin/products/featured` - Get featured products
- ⚠️ Need: `PUT /api/admin/products/featured` - Toggle featured status

**Request:**
```json
{
  "productIds": ["id1", "id2", "id3"]
}
```

---

### **15. HomepageCategoriesManagement.tsx**
**What it does:**
- Manage homepage category display order

**APIs Needed:**
- ⚠️ Need: `GET /api/admin/homepage-categories` - Get homepage categories
- ⚠️ Need: `PUT /api/admin/homepage-categories` - Update order

**Request:**
```json
{
  "categoryIds": ["id1", "id2", "id3"]
}
```

---

### **16. ProductDetailPage.tsx**
**What it does:**
- Add product to cart (already migrated)
- View product details (already have API)
- Load related products

**APIs Needed:**
- ✅ Already have: `GET /api/products/:id`
- ✅ Already have: `GET /api/products/:id/related`

---

### **17. CorporateOrder.tsx**
**What it does:**
- Submit corporate order requests

**APIs Needed:**
- ✅ Already have: `POST /api/contact/corporate`

---

### **18. OrderConfirmationPage.tsx**
**What it does:**
- Display order confirmation
- Verify order with public token

**APIs Needed:**
- ⚠️ Need: `GET /api/orders/:orderNumber` - Get order by order number
- ⚠️ Need: `GET /api/orders/public/:orderNumber?token=XXX` - Verify with public token

---

### **19. Header.tsx**
**What it does:**
- Display announcement bar
- Search functionality

**APIs Needed:**
- ✅ Already using announcement APIs
- ✅ Already have search: `GET /api/products/search`

---

### **20. Footer.tsx**
**What it does:**
- Newsletter subscription (not implemented)

**APIs Needed:**
- Already documented in `newsletter-backend-requirements.md`

---

### **21. AdminLogin.tsx**
**What it does:**
- Admin authentication

**APIs Needed:**
- ✅ Already have: Auth APIs

---

## 📊 **Summary of APIs Still Needed:**

### **High Priority:**

1. **Dashboard Stats API**
   - `GET /api/admin/dashboard/stats`

2. **Profile Management**
   - `GET /api/auth/profile`
   - `PUT /api/auth/profile`

3. **Order Confirmation**
   - `GET /api/orders/:orderNumber`

### **Medium Priority:**

4. **Admin Products**
   - `POST /api/products/upload`
   - Product variants APIs

5. **Admin Reviews**
   - `GET /api/admin/reviews`
   - `PUT /api/reviews/:id/status`

6. **Admin Carousel**
   - Full CRUD for carousel items
   - `POST /api/admin/carousel/upload`

7. **Admin Blogs**
   - Full CRUD for blogs (admin)
   - `POST /api/admin/blogs/upload`

8. **Admin Categories**
   - Full CRUD for categories (admin)

9. **Admin Announcements**
   - Full CRUD for announcements

10. **Admin Corporate Orders**
    - `GET /api/admin/corporate-orders`
    - `PUT /api/admin/corporate-orders/:id/status`

11. **Admin Contact Queries**
    - `GET /api/admin/contact-queries`
    - `PUT /api/admin/contact-queries/:id`

12. **Admin Featured Products**
    - `GET /api/admin/products/featured`
    - `PUT /api/admin/products/featured`

13. **Admin Homepage Categories**
    - `GET /api/admin/homepage-categories`
    - `PUT /api/admin/homepage-categories`

---

## 🎯 **Implementation Priority:**

### **Phase 1: Critical E-Commerce**
1. Profile Management APIs
2. Dashboard Stats API
3. Order Confirmation API

### **Phase 2: Admin Content Management**
4. Product Image Upload
5. Blog Image Upload
6. Carousel Image/Video Upload
7. Review Management APIs

### **Phase 3: Advanced Admin Features**
8. Corporate Orders Management
9. Contact Queries Management
10. Featured Products Management
11. Homepage Categories Management

---

## 📝 **Notes:**

- All APIs should follow your existing authentication pattern (Bearer token)
- Admin APIs should check for `role === 'admin'`
- File uploads should return URLs (cloud storage URLs)
- Most CRUD operations follow the same pattern as existing APIs
- The frontend already has the UI components, they just need backend support

---

**Next Steps:**
1. Implement the high-priority APIs
2. Share the API documentation with frontend
3. Test integration
4. Move to medium and low-priority APIs

