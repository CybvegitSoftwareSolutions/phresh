# Supabase to MongoDB Migration Plan

## 🎯 **Goal**
Remove all Supabase dependencies and migrate to your MongoDB + Node.js backend.

## 📊 **Current Supabase Usage**

### **Database Tables Being Used:**
- `orders` - Order management
- `order_items` - Order line items
- `products` - Product catalog
- `product_reviews` - Customer reviews
- `contact_queries` - Contact form submissions
- `corporate_orders` - Corporate order requests
- `blogs` - Blog posts
- `carousel_items` - Homepage carousel
- `categories` - Product categories
- `announcement_settings` - Site announcements
- `payment_settings` - Payment options
- `shipping_settings` - Shipping configuration
- `profiles` - User profiles (already removed)

### **Supabase Functions Being Used:**
- `send-order-email` - Order confirmation emails
- `send-order-status-email` - Order status update emails
- `dynamic-processor` - Contact form processing
- `corporate-processor` - Corporate order processing

### **Supabase Storage:**
- Product image uploads

## 🔄 **Migration Strategy**

### **Phase 1: Backend API Development**
Your backend team needs to create these endpoints:

#### **Orders API:**
```
GET    /api/orders              - Get all orders
GET    /api/orders/:id          - Get specific order
POST   /api/orders              - Create new order
PUT    /api/orders/:id          - Update order status
GET    /api/orders/:id/items    - Get order items
```

#### **Products API:**
```
GET    /api/products            - Get all products
GET    /api/products/:id        - Get specific product
POST   /api/products            - Create product
PUT    /api/products/:id        - Update product
DELETE /api/products/:id        - Delete product
POST   /api/products/:id/image  - Upload product image
```

#### **Reviews API:**
```
GET    /api/reviews             - Get all reviews
GET    /api/reviews/:id         - Get specific review
POST   /api/reviews              - Create review
PUT    /api/reviews/:id          - Update review status
DELETE /api/reviews/:id          - Delete review
```

#### **Contact Queries API:**
```
GET    /api/contact-queries     - Get all contact queries
GET    /api/contact-queries/:id - Get specific query
POST   /api/contact-queries     - Submit contact query
PUT    /api/contact-queries/:id - Update query status
```

#### **Corporate Orders API:**
```
GET    /api/corporate-orders    - Get all corporate orders
GET    /api/corporate-orders/:id - Get specific order
POST   /api/corporate-orders    - Submit corporate order
PUT    /api/corporate-orders/:id - Update order status
```

#### **Blogs API:**
```
GET    /api/blogs               - Get all blogs
GET    /api/blogs/:slug         - Get specific blog
POST   /api/blogs               - Create blog
PUT    /api/blogs/:id           - Update blog
DELETE /api/blogs/:id           - Delete blog
```

#### **Categories API:**
```
GET    /api/categories          - Get all categories
POST   /api/categories          - Create category
PUT    /api/categories/:id      - Update category
DELETE /api/categories/:id      - Delete category
```

#### **Carousel API:**
```
GET    /api/carousel            - Get carousel items
POST   /api/carousel            - Create carousel item
PUT    /api/carousel/:id        - Update carousel item
DELETE /api/carousel/:id        - Delete carousel item
```

#### **Settings API:**
```
GET    /api/settings/announcement - Get announcement settings
PUT    /api/settings/announcement - Update announcement settings
GET    /api/settings/payment    - Get payment settings
PUT    /api/settings/payment    - Update payment settings
GET    /api/settings/shipping   - Get shipping settings
PUT    /api/settings/shipping   - Update shipping settings
```

### **Phase 2: Email Service Integration**
Replace Supabase functions with your backend:

#### **Email Endpoints:**
```
POST   /api/emails/order-confirmation    - Send order confirmation
POST   /api/emails/order-status          - Send order status update
POST   /api/emails/contact-form          - Process contact form
POST   /api/emails/corporate-order       - Process corporate order
```

### **Phase 3: File Upload Service**
Replace Supabase storage with your backend:

#### **File Upload API:**
```
POST   /api/upload/image         - Upload image
GET    /api/upload/image/:id     - Get image URL
DELETE /api/upload/image/:id     - Delete image
```

### **Phase 4: Frontend Migration**
Update all frontend components to use your APIs instead of Supabase.

## 📋 **Files That Need Migration**

### **High Priority (Core Functionality):**
1. `src/pages/CheckoutPage.tsx` - Order creation
2. `src/pages/AdminDashboard.tsx` - Order management
3. `src/components/admin/OrdersManagement.tsx` - Order CRUD
4. `src/components/admin/ProductsManagement.tsx` - Product CRUD
5. `src/hooks/useCart.ts` - Cart functionality

### **Medium Priority (Admin Features):**
6. `src/components/admin/ReviewsManagement.tsx`
7. `src/components/admin/ContactQueriesManagement.tsx`
8. `src/components/admin/CorporateOrdersManagement.tsx`
9. `src/components/admin/BlogsManagement.tsx`
10. `src/components/admin/CategoriesManagement.tsx`
11. `src/components/admin/CarouselManagement.tsx`
12. `src/components/admin/AnnouncementBarManagement.tsx`
13. `src/components/admin/PaymentOptionsManagement.tsx`
14. `src/components/admin/ShippingManagement.tsx`

### **Low Priority (Display Features):**
15. `src/pages/ProductDetailPage.tsx`
16. `src/pages/CartPage.tsx`
17. `src/pages/OrderConfirmationPage.tsx`
18. `src/pages/BlogsPage.tsx`
19. `src/pages/BlogDetailPage.tsx`
20. `src/pages/CorporateOrder.tsx`
21. `src/components/layout/Footer.tsx`
22. `src/components/layout/AnnouncementBar.tsx`

## 🚀 **Implementation Steps**

### **Step 1: Backend API Development**
- [ ] Create all required API endpoints
- [ ] Implement authentication middleware
- [ ] Set up email service integration
- [ ] Set up file upload service
- [ ] Test all endpoints

### **Step 2: Frontend Service Layer**
- [ ] Create API service functions
- [ ] Replace Supabase calls with API calls
- [ ] Update error handling
- [ ] Test all functionality

### **Step 3: Data Migration**
- [ ] Export data from Supabase
- [ ] Import data to MongoDB
- [ ] Verify data integrity

### **Step 4: Cleanup**
- [ ] Remove Supabase dependencies
- [ ] Delete Supabase files
- [ ] Update documentation

## 💰 **Benefits of Migration**

1. **Cost Reduction** - No more Supabase subscription
2. **Simplified Architecture** - Single backend system
3. **Better Control** - Full control over your data
4. **Performance** - Optimized for your specific needs
5. **Scalability** - Scale according to your requirements

## ⚠️ **Risks & Considerations**

1. **Development Time** - Significant development effort required
2. **Testing** - Extensive testing needed
3. **Downtime** - Potential downtime during migration
4. **Data Loss** - Risk of data loss if not handled carefully

## 🎯 **Recommendation**

**Start with Phase 1** - Have your backend team create the core APIs first:
- Orders API
- Products API
- Reviews API
- Contact Queries API

Once these are ready, I can help you migrate the frontend components one by one.

Would you like me to start with migrating a specific component, or would you prefer to have your backend team create the APIs first?
