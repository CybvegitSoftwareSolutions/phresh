# Guest Checkout Backend Changes Required

## Problem
Currently, the order creation endpoint (`POST /api/orders`) requires authentication, which prevents guest users from completing orders. The error "Access denied. No token provided" occurs when unauthenticated users try to place orders.

## Required Backend Changes

### 1. Create Optional Authentication Middleware

Create a new middleware file: `src/middleware/optionalAuth.js`

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Optional authentication middleware
 * - If token is provided and valid, sets req.user
 * - If no token or invalid token, continues without req.user
 * - Never throws an error - always allows the request to proceed
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // No token provided - this is OK for guest checkout
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user) {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (error) {
    // Invalid token - treat as guest
    req.user = null;
  }
  
  next();
};

module.exports = { optionalAuth };
```

### 2. Update Order Routes

Modify `src/routes/orders.js`:

**Change from:**
```javascript
router.post('/', auth, createOrder);
```

**Change to:**
```javascript
const { optionalAuth } = require('../middleware/optionalAuth');
router.post('/', optionalAuth, createOrder);
```

### 3. Update Order Controller

Modify the `createOrder` function in `src/controllers/orderController.js`:

**Change from:**
```javascript
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;
    
    // ... calculate totals ...
    
    const order = new Order({
      user: req.user._id,  // ❌ This fails for guest users
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalAmount,
      notes
    });
```

**Change to:**
```javascript
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes, email } = req.body;
    
    // Validate email for guest orders
    if (!req.user && !email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for guest orders'
      });
    }
    
    // ... calculate totals ...
    
    const order = new Order({
      user: req.user ? req.user._id : null,  // ✅ Allow null for guest orders
      guestEmail: req.user ? null : email,    // ✅ Store email for guest orders
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalAmount,
      notes
    });
```

### 4. Update Order Model Schema

Modify the Order model in `src/models/Order.js` to support guest orders:

**Add to schema:**
```javascript
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,  // ✅ Change from required: true to required: false
    default: null
  },
  guestEmail: {
    type: String,
    required: function() {
      return !this.user;  // Required only if user is not set
    },
    validate: {
      validator: function(email) {
        if (!this.user && !email) return false;
        if (email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }
        return true;
      },
      message: 'Valid email is required for guest orders'
    }
  },
  // ... rest of schema
}, {
  timestamps: true
});
```

### 5. Update Frontend to Send Email for Guest Orders

The frontend already collects email in the checkout form, but we should ensure it's sent in the order data:

**File: `src/pages/CheckoutPage.tsx` (line 354)**

Add `email` field to `orderData`:
```typescript
const orderData = {
  email: formData.email,  // ✅ Add this line
  items: items.map(item => {
    // ... existing code ...
  }),
  shippingAddress: {
    // ... existing code ...
  },
  paymentMethod: formData.paymentMethod,
  notes: formData.notes || undefined
};
```

**File: `src/services/api.ts` (line 405)**

Update the `createOrder` method signature:
```typescript
async createOrder(orderData: {
  email?: string;  // ✅ Add email field
  items: Array<{
    // ... existing fields ...
  }>;
  shippingAddress: {
    // ... existing fields ...
  };
  paymentMethod: string;
  notes?: string;
}) {
  return this.request('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}
```

## Testing Checklist

After implementing these changes:

1. ✅ **Guest Order**: Try creating an order without logging in - should work
2. ✅ **Authenticated Order**: Try creating an order while logged in - should still work
3. ✅ **Order Tracking**: Ensure guest orders can be tracked by order number
4. ✅ **Email Validation**: Verify that guest orders require a valid email
5. ✅ **Order History**: Test that logged-in users can see their orders in profile
6. ✅ **Admin View**: Ensure admin can see both user and guest orders

## Alternative Approach (If You Prefer)

If you want to keep orders always associated with users, you could:

1. Create a temporary "Guest" user account for each guest order
2. Or create a separate guest order endpoint (e.g., `POST /api/orders/guest`)
3. Or require account creation before checkout

However, the approach outlined above (allowing null user) is the most common pattern for e-commerce guest checkout.

