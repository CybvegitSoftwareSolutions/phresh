# Guest Checkout Implementation Guide

## How Order Creation Works

### **Email-Based Order System**

**Key Principle:** All orders include email in the request body. Order history is fetched based on email matching, not user ID.

### 1. **Guest Order (Not Logged In)**

**Frontend Flow:**
1. User fills checkout form (including email field - user must input)
2. User clicks "Complete order"
3. Frontend sends request to `POST /api/orders`:
   - ❌ **No JWT token** (user is not authenticated)
   - ✅ **Includes `email` field** (always required - from form input)
   - ✅ Includes all order data (items, shipping address, payment method)

**Backend Flow:**
1. Receives request without JWT token
2. Uses `optionalAuth` middleware (doesn't fail without token)
3. Validates that `email` field is present
4. Creates order with:
   - `user: null` (no associated user account)
   - `email: <email_from_request>` (used for order history matching)
   - All other order data

**Code Location:**
- **Frontend:** `src/pages/CheckoutPage.tsx` (line 353-381)
  ```typescript
  const orderData: any = {
    email: formData.email, // Always include email for both guest and authenticated orders
    items: [...],
    shippingAddress: {...},
    paymentMethod: formData.paymentMethod,
    notes: formData.notes || undefined
  };
  ```

---

### 2. **Authenticated Order (Logged In)**

**Frontend Flow:**
1. User fills checkout form (email auto-prefilled from user profile)
2. User can edit email if needed
3. User clicks "Complete order"
4. Frontend sends request to `POST /api/orders`:
   - ✅ **JWT token in Authorization header** (automatically added by `apiService.request()`)
   - ✅ **Includes `email` field** (always included - prefilled from user profile, can be edited)
   - ✅ Includes all order data (items, shipping address, payment method)

**Backend Flow:**
1. Receives request with JWT token
2. Uses `optionalAuth` middleware (extracts user from token)
3. Sets `req.user` from decoded JWT token
4. Creates order with:
   - `user: <user_id>` (associated with user account)
   - `email: <email_from_request>` (used for order history matching)
   - All other order data

**Code Location:**
- **Frontend:** `src/pages/CheckoutPage.tsx`
  - Email prefilling (line 101-106):
    ```typescript
    // Prefill email from user profile when authenticated
    useEffect(() => {
      if (user?.email && formData.email !== user.email) {
        setFormData(prev => ({ ...prev, email: user.email }));
      }
    }, [user?.email]);
    ```
  - Order creation (line 353-381):
    ```typescript
    const orderData: any = {
      email: formData.email, // Always include email for both guest and authenticated orders
      items: [...],
      shippingAddress: {...},
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || undefined
    };
    ```

---

## Order History

### How It Works

**Backend Logic:**
- `GET /api/orders` (with JWT token) returns orders based on **email matching**:
  1. All orders where `email` field matches authenticated user's email
  2. This includes both authenticated orders and guest orders with matching email

**Frontend:**
- `src/pages/ProfilePage.tsx` calls `apiService.getUserOrders()`
- Displays all orders returned (filtered by email on backend)

**Order Merging:**
- All orders are stored with an `email` field
- Order history fetches orders by matching email (not user ID)
- When a guest creates an account:
  - Guest orders are already associated with their email
  - Once logged in, they see all orders (guest + authenticated) that match their email
  - No conversion needed - email matching handles everything

---

## Key Differences Summary

| Aspect | Guest Order | Authenticated Order |
|--------|------------|---------------------|
| **JWT Token** | ❌ Not sent | ✅ Sent in Authorization header |
| **Email Field** | ✅ Required in request body (user inputs) | ✅ Required in request body (auto-prefilled from profile) |
| **Order.user** | `null` | `user._id` |
| **Order.email** | Email from request | Email from request |
| **Order History** | Fetched by email matching | Fetched by email matching |

---

## API Request Examples

### Guest Order Request:
```javascript
POST /api/orders
Headers: {
  "Content-Type": "application/json"
  // NO Authorization header
}
Body: {
  "email": "customer@example.com",  // REQUIRED
  "items": [...],
  "shippingAddress": {...},
  "paymentMethod": "cash_on_delivery",
  "notes": "..."
}
```

### Authenticated Order Request:
```javascript
POST /api/orders
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"  // REQUIRED
}
Body: {
  "email": "user@example.com",  // REQUIRED (auto-prefilled from user profile)
  "items": [...],
  "shippingAddress": {...},
  "paymentMethod": "cash_on_delivery",
  "notes": "..."
}
```

---

## Testing Checklist

✅ **Guest Checkout:**
- [ ] Logout
- [ ] Add items to cart
- [ ] Go to checkout
- [ ] Fill form (including email)
- [ ] Complete order
- [ ] Verify order is created successfully
- [ ] Check order confirmation page works

✅ **Authenticated Checkout:**
- [ ] Login
- [ ] Add items to cart
- [ ] Go to checkout
- [ ] Complete order (email auto-filled, not sent in body)
- [ ] Verify order is created successfully
- [ ] Check order appears in profile/order history

✅ **Order History:**
- [ ] Create guest order with email X
- [ ] Create account with email X
- [ ] Login and check profile
- [ ] Verify guest order appears in order history

---

## Frontend Files Modified

1. **`src/pages/CheckoutPage.tsx`**
   - Line 101-106: Prefills email from user profile when authenticated
   - Line 270-277: Validates email is always present
   - Line 353-381: Always includes email in order data (for both guest and authenticated)

2. **`src/services/api.ts`**
   - Line 405-432: `createOrder()` method signature requires email (not optional)
   - Line 26-61: `request()` method automatically includes JWT if available

---

## Benefits

✅ **Guest Checkout:** Customers can order without creating an account
✅ **Email-Based History:** Guest orders visible after account creation
✅ **Order Merging:** Existing guest orders appear when user signs up
✅ **Backward Compatible:** Existing authenticated orders work unchanged

