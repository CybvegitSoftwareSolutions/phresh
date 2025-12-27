# Backend API Requirements to Replace Supabase

## 📋 **Executive Summary**
This document outlines all the additional APIs and database tables needed to completely replace Supabase functionality in the Phresh frontend.

## 🎯 **Current Status**
- ✅ **Authentication APIs** - Already implemented
- ✅ **Products APIs** - Already implemented  
- ✅ **Orders APIs** - Already implemented
- ✅ **Admin APIs** - Already implemented
- ✅ **Contact APIs** - Already implemented
- ✅ **Categories APIs** - Already implemented
- ✅ **Blogs APIs** - Already implemented
- ✅ **Reviews APIs** - Already implemented
- ✅ **Carousel APIs** - Already implemented
- ✅ **Announcements APIs** - Already implemented

## ❌ **Missing Tables & APIs (Currently Using Supabase)**

### **1. Cart System** - TOP PRIORITY
**Current:** Using Supabase `cart_items` table
**Missing:** Backend API for cart management

#### **Required API Endpoints:**
```javascript
// GET /api/cart - Get user's cart
// POST /api/cart - Add item to cart
// PUT /api/cart/:id - Update cart item quantity
// DELETE /api/cart/:id - Remove item from cart
// DELETE /api/cart - Clear entire cart
```

#### **Required MongoDB Collections:**
```javascript
// cart_items collection
{
  _id: ObjectId,
  userId: ObjectId, // Reference to users
  productId: ObjectId, // Reference to products
  quantity: Number,
  variant_size: String | null,
  variant_price: Number | null,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Request/Response Examples:**
```javascript
// POST /api/cart
Request: {
  productId: "product_id_here",
  quantity: 2,
  variant_size: "Large", // optional
  variant_price: 200 // optional
}
Response: {
  success: true,
  data: {
    _id: "cart_item_id",
    userId: "user_id",
    productId: "product_id",
    quantity: 2,
    variant_size: "Large",
    variant_price: 200,
    createdAt: "2024-01-15T10:00:00Z"
  }
}

// GET /api/cart
Response: {
  success: true,
  data: [
    {
      _id: "cart_item_id",
      userId: "user_id",
      product: {
        _id: "product_id",
        name: "Fresh Orange Juice",
        price: 150,
        image_url: "https://...",
        // ... full product details
      },
      quantity: 2,
      variant_size: "Large",
      variant_price: 200
    }
  ]
}
```

---

### **2. Shipping & Payment Settings** - HIGH PRIORITY
**Current:** Using Supabase `shipping_settings` and `payment_settings` tables
**Missing:** Backend API for settings management

#### **Required API Endpoints:**
```javascript
// GET /api/settings/shipping - Get shipping settings
// PUT /api/settings/shipping - Update shipping settings
// GET /api/settings/payment - Get payment settings
// PUT /api/settings/payment - Update payment settings
```

#### **Required MongoDB Collections:**
```javascript
// shipping_settings collection
{
  _id: ObjectId,
  cod_enabled: Boolean,
  delivery_charges: Number,
  free_delivery_threshold: Number,
  delivery_time: String,
  updatedAt: Date
}

// payment_settings collection
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
  updatedAt: Date
}
```

#### **Request/Response Examples:**
```javascript
// GET /api/settings/shipping
Response: {
  success: true,
  data: {
    _id: "settings_id",
    cod_enabled: true,
    delivery_charges: 100,
    free_delivery_threshold: 1000,
    delivery_time: "3-5 business days"
  }
}

// PUT /api/settings/shipping
Request: {
  cod_enabled: true,
  delivery_charges: 150,
  free_delivery_threshold: 1500
}
Response: {
  success: true,
  data: { /* updated settings */ }
}
```

---

### **3. Email Notifications** - HIGH PRIORITY
**Current:** Using Supabase functions for email
**Missing:** Backend email service integration

#### **Required API Endpoints:**
```javascript
// POST /api/emails/order-confirmation - Send order confirmation email
// POST /api/emails/order-status - Send order status update email
// POST /api/emails/contact-form - Process contact form submission
// POST /api/emails/corporate-order - Process corporate order submission
```

#### **Request/Response Examples:**
```javascript
// POST /api/emails/order-confirmation
Request: {
  orderNumber: "ORD-12345",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  orderItems: [...],
  totalAmount: 500,
  shippingCharge: 100,
  paymentMethod: "cash_on_delivery",
  confirmationUrl: "https://phresh.pk/order-confirmation/ORD-12345"
}
Response: {
  success: true,
  message: "Email sent successfully"
}

// POST /api/emails/order-status
Request: {
  orderNumber: "ORD-12345",
  customerName: "John Doe",
  customerEmail: "john@example.com",
  status: "confirmed",
  notes: "Order confirmed and being prepared"
}
Response: {
  success: true,
  message: "Status email sent successfully"
}
```

---

### **4. Admin Order Management** - MEDIUM PRIORITY
**Current:** Using Supabase for order management
**Missing:** Additional order management endpoints

#### **Required API Endpoints:**
```javascript
// GET /api/admin/orders - Get all orders (with filters)
// PUT /api/admin/orders/:id/status - Update order status
// POST /api/admin/orders/:id/tracking - Add tracking number
// GET /api/admin/orders/stats - Get order statistics
```

#### **Request/Response Examples:**
```javascript
// GET /api/admin/orders?status=pending&page=1&limit=10
Response: {
  success: true,
  data: {
    orders: [
      {
        _id: "order_id",
        orderNumber: "ORD-12345",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+1234567890",
        totalAmount: 500,
        status: "pending",
        orderItems: [...],
        createdAt: "2024-01-15T10:00:00Z"
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 50,
      pages: 5
    }
  }
}

// PUT /api/admin/orders/:id/status
Request: {
  status: "confirmed",
  trackingNumber: "TRACK123", // optional
  notes: "Order confirmed" // optional
}
Response: {
  success: true,
  data: { /* updated order */ }
}
```

---

### **5. File Upload Service** - MEDIUM PRIORITY
**Current:** Using Supabase storage for images
**Missing:** Backend file upload service

#### **Required API Endpoints:**
```javascript
// POST /api/upload/image - Upload image (products, carousel, etc.)
// DELETE /api/upload/image/:id - Delete image
// GET /api/upload/image/:id - Get image URL
```

#### **Request/Response Examples:**
```javascript
// POST /api/upload/image
Request: FormData with 'image' field
Response: {
  success: true,
  data: {
    url: "https://your-domain.com/uploads/image-123.jpg",
    filename: "image-123.jpg",
    size: 1024,
    mimetype: "image/jpeg"
  }
}
```

---

### **6. Address Management** - MEDIUM PRIORITY
**Current:** Using Supabase `addresses` table
**Missing:** Backend address management API

#### **Required API Endpoints:**
```javascript
// GET /api/addresses - Get user's addresses
// POST /api/addresses - Add new address
// PUT /api/addresses/:id - Update address
// DELETE /api/addresses/:id - Delete address
// POST /api/addresses/:id/set-default - Set default address
```

#### **Required MongoDB Collections:**
```javascript
// addresses collection
{
  _id: ObjectId,
  userId: ObjectId, // Reference to users
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  street: String | null,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  floor: String | null,
  apartment: String | null,
  is_default: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📊 **Summary Table**

| Feature | Supabase Table | Required MongoDB Collection | API Status | Priority |
|---------|---------------|------------------------------|------------|----------|
| Cart | `cart_items` | ✅ Need | ❌ Missing | **HIGH** |
| Shipping Settings | `shipping_settings` | ✅ Need | ❌ Missing | **HIGH** |
| Payment Settings | `payment_settings` | ✅ Need | ❌ Missing | **HIGH** |
| Email Service | Functions | N/A | ❌ Missing | **HIGH** |
| Admin Orders | `orders` | ✅ Exists | ⚠️ Need more endpoints | **MEDIUM** |
| File Upload | Storage | N/A | ❌ Missing | **MEDIUM** |
| Addresses | `addresses` | ✅ Need | ❌ Missing | **MEDIUM** |
| Products | `products` | ✅ Exists | ✅ Implemented | ✅ DONE |
| Categories | `categories` | ✅ Exists | ✅ Implemented | ✅ DONE |
| Orders | `orders` | ✅ Exists | ✅ Implemented | ✅ DONE |
| Reviews | `product_reviews` | ✅ Exists | ✅ Implemented | ✅ DONE |
| Blogs | `blogs` | ✅ Exists | ✅ Implemented | ✅ DONE |
| Announcements | `announcement_settings` | ✅ Exists | ✅ Implemented | ✅ DONE |

---

## 🎯 **Implementation Priority**

### **Phase 1: Critical E-commerce Features (Week 1)**
1. ✅ **Cart System API** - Users can add to cart
2. ✅ **Checkout Process** - Users can place orders
3. ✅ **Email Notifications** - Order confirmations

### **Phase 2: Admin Features (Week 2)**
4. ✅ **Shipping Settings API** - Configure shipping
5. ✅ **Payment Settings API** - Configure payments
6. ✅ **Enhanced Order Management** - Better admin control

### **Phase 3: Quality of Life (Week 3)**
7. ✅ **File Upload Service** - Image uploads
8. ✅ **Address Management** - User addresses
9. ✅ **Final Testing & Deployment**

---

## 📝 **Detailed API Specifications**

### **Cart Management APIs**

#### **GET /api/cart**
Get current user's cart items with product details

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "cart_item_id",
      "product": {
        "_id": "product_id",
        "name": "Fresh Orange Juice",
        "price": 150,
        "image_url": "https://...",
        "category": "fruit-juices",
        "discount": 10,
        "stock": 100
      },
      "quantity": 2,
      "variant_size": "Large",
      "variant_price": 200,
      "subtotal": 400
    }
  ],
  "total": 400
}
```

#### **POST /api/cart**
Add item to cart

**Request:**
```json
{
  "productId": "product_id_here",
  "quantity": 2,
  "variant_size": "Large",
  "variant_price": 200
}
```

#### **PUT /api/cart/:id**
Update cart item quantity

**Request:**
```json
{
  "quantity": 3
}
```

#### **DELETE /api/cart/:id**
Remove item from cart

#### **DELETE /api/cart**
Clear entire cart

---

### **Settings APIs**

#### **GET /api/settings/shipping**
Get current shipping settings

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "settings_id",
    "cod_enabled": true,
    "delivery_charges": 100,
    "free_delivery_threshold": 1000,
    "delivery_time": "3-5 business days",
    "applicable_cities": ["Karachi", "Lahore", "Islamabad"]
  }
}
```

#### **PUT /api/settings/shipping** (Admin Only)
Update shipping settings

**Request:**
```json
{
  "cod_enabled": true,
  "delivery_charges": 150,
  "free_delivery_threshold": 1500,
  "delivery_time": "2-4 business days"
}
```

#### **GET /api/settings/payment**
Get current payment settings

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "settings_id",
    "cod_enabled": true,
    "mobile_payment_enabled": true,
    "account_title": "Phresh Juices",
    "account_number": "1234567890",
    "iban": "PK36SCBL0000001123456702",
    "bank_name": "Standard Chartered",
    "contact_email": "support@phresh.pk",
    "contact_whatsapp": "+923020025727",
    "instructions": "Please use your order number as reference"
  }
}
```

#### **PUT /api/settings/payment** (Admin Only)
Update payment settings

---

### **Email Service APIs**

#### **POST /api/emails/order-confirmation**
Send order confirmation email

**Request:**
```json
{
  "orderNumber": "ORD-12345",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "orderItems": [
    {
      "product": {
        "name": "Fresh Orange Juice",
        "price": 150,
        "image_url": "https://..."
      },
      "quantity": 2,
      "subtotal": 300
    }
  ],
  "totalAmount": 400,
  "shippingCharge": 100,
  "paymentMethod": "cash_on_delivery",
  "confirmationUrl": "https://phresh.pk/order-confirmation/ORD-12345"
}
```

#### **POST /api/emails/order-status**
Send order status update email

**Request:**
```json
{
  "orderNumber": "ORD-12345",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "status": "confirmed",
  "notes": "Order confirmed and being prepared"
}
```

#### **POST /api/emails/contact-form**
Process contact form submission

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "I need help with my order"
}
```

#### **POST /api/emails/corporate-order**
Process corporate order submission

---

### **File Upload API**

#### **POST /api/upload/image**
Upload image file

**Request:** FormData
- `image`: File (required)
- `type`: String (optional) - "product", "carousel", "blog", etc.

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://your-domain.com/uploads/image-123.jpg",
    "filename": "image-123.jpg",
    "size": 1024000,
    "mimetype": "image/jpeg"
  }
}
```

---

### **Address Management APIs**

#### **GET /api/addresses**
Get user's saved addresses

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "address_id",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "street": "123 Main St",
      "city": "Karachi",
      "state": "Sindh",
      "zipCode": "75000",
      "country": "Pakistan",
      "is_default": true
    }
  ]
}
```

#### **POST /api/addresses**
Add new address

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "street": "123 Main St",
  "city": "Karachi",
  "state": "Sindh",
  "zipCode": "75000",
  "country": "Pakistan",
  "is_default": false
}
```

---

## 🚀 **Next Steps**

1. **Implement these APIs** in your Node.js backend
2. **Create the MongoDB collections** as specified
3. **Test each API** with Postman
4. **Provide me with the API endpoints** and I'll update the frontend to use them
5. **Deploy and test** the complete system

---

## 📞 **Questions?**

If you need clarification on any API specification, let me know!
