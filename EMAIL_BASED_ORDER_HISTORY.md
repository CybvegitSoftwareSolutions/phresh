# Email-Based Order History Implementation

## Overview

Order history is now fetched using email-based endpoints. This allows guest users to view their order history without authentication, and seamlessly transitions to authenticated endpoints when they sign up.

## Implementation Details

### 1. **New Public Endpoint**

**Endpoint:** `GET /api/orders/email/:email`  
**Access:** Public (no authentication required)  
**Purpose:** Fetch order history by email for guest users

**Usage:**
```typescript
GET /api/orders/email/user@example.com?page=1&limit=10
```

**Response:** Same pagination structure as `GET /api/orders`
- Returns orders where `email` matches the provided email
- Includes all order details with product info
- Sorted by most recent first

### 2. **Frontend Changes**

#### **API Service** (`src/services/api.ts`)
- Added `getOrdersByEmail()` method (line 448-484)
  - Makes public request (no JWT token)
  - Encodes email in URL path
  - Supports pagination via query parameters

#### **Checkout Page** (`src/pages/CheckoutPage.tsx`)
- Saves email to localStorage after guest checkout (line 422-425)
  ```typescript
  // Save email to local storage for guest order history (if guest checkout)
  if (!user && formData.email) {
    localStorage.setItem('guest_email', formData.email);
  }
  ```

#### **Profile Page** (`src/pages/ProfilePage.tsx`)
- **Authenticated Users:** Uses `getUserOrders()` (authenticated endpoint)
- **Guest Users:** Uses `getOrdersByEmail()` with email from localStorage
- Automatically switches when user logs in (via `useEffect` dependency on `user`)

**Implementation:**
```typescript
const loadUserData = async () => {
  if (user) {
    // Authenticated: use authenticated endpoint
    const ordersResponse = await apiService.getUserOrders();
    // ... handle response
  } else {
    // Guest: use public email endpoint
    const guestEmail = localStorage.getItem('guest_email');
    if (guestEmail) {
      const ordersResponse = await apiService.getOrdersByEmail(guestEmail);
      // ... handle response
    }
  }
};
```

## User Flow

### **Guest Checkout Flow:**
1. Guest user fills checkout form (enters email)
2. Completes order → email saved to `localStorage.guest_email`
3. User can view orders via Profile page (no login required)
4. Orders fetched using `GET /api/orders/email/:email`

### **Guest → Authenticated Transition:**
1. Guest user with orders in localStorage
2. Signs up or logs in with same email
3. ProfilePage automatically switches to `getUserOrders()`
4. Backend returns orders based on email matching
5. All previous guest orders appear in order history

### **Authenticated User Flow:**
1. User logs in
2. ProfilePage loads → uses `getUserOrders()`
3. Backend returns orders where email matches authenticated user's email
4. Shows both authenticated orders and matching guest orders

## Benefits

✅ **Guest Order History:** Guests can view their orders without creating an account  
✅ **Seamless Transition:** Orders automatically appear when guest signs up  
✅ **Email-Based Matching:** Consistent order retrieval using email (not user ID)  
✅ **No Data Loss:** Guest orders preserved and accessible after account creation  
✅ **Public Access:** Order history available without authentication

## API Methods Added

### `getOrdersByEmail(email, params?)`
- **Type:** Public endpoint (no auth required)
- **Parameters:**
  - `email: string` - Email address to fetch orders for
  - `params?: { page?: number, limit?: number }` - Optional pagination
- **Returns:** Same structure as `getUserOrders()`
- **Example:**
  ```typescript
  const orders = await apiService.getOrdersByEmail('user@example.com', { page: 1, limit: 10 });
  ```

## Local Storage

### `guest_email`
- **Set:** After guest checkout (if user not authenticated)
- **Used:** For fetching guest order history
- **Cleaned:** Automatically replaced when user logs in (ProfilePage uses authenticated endpoint)

## Testing Checklist

✅ **Guest Order History:**
- [ ] Place order as guest (with email)
- [ ] Check localStorage contains `guest_email`
- [ ] Navigate to Profile page (without login)
- [ ] Verify orders are displayed

✅ **Authenticated Order History:**
- [ ] Login with account
- [ ] Navigate to Profile page
- [ ] Verify orders displayed via authenticated endpoint

✅ **Guest → Authenticated Transition:**
- [ ] Place order as guest (save email)
- [ ] Sign up with same email
- [ ] Login and check Profile page
- [ ] Verify guest orders appear in order history

✅ **Email Matching:**
- [ ] Create guest order with email X
- [ ] Create authenticated order with email X
- [ ] Check both appear in order history when logged in

## Files Modified

1. **`src/services/api.ts`**
   - Added `getOrdersByEmail()` method (line 448-484)

2. **`src/pages/CheckoutPage.tsx`**
   - Save email to localStorage after guest checkout (line 422-425)

3. **`src/pages/ProfilePage.tsx`**
   - Updated `loadUserData()` to use email-based endpoint for guests (line 125-176)
   - Automatically switches to authenticated endpoint when user logs in

