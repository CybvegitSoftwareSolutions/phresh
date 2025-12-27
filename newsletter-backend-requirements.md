# Newsletter Subscription System - Backend Requirements

## 📋 Current State Analysis

### ✅ What's Working:
- Footer has newsletter signup form (email input + submit button)
- Checkout page has newsletter opt-in checkbox
- Frontend validation for email format

### ❌ What's Missing:
- **No backend integration** - emails are lost after form submission
- **No database storage** - no way to track subscribers
- **No admin management** - no way to view/manage subscribers

---

## 🎯 Required Backend API Endpoints

### 1. Newsletter Subscription Endpoint

**Endpoint:** `POST /api/newsletter/subscribe`

**Request Body:**
```json
{
  "email": "user@example.com",
  "source": "website" | "checkout" | "admin",
  "ip_address": "192.168.1.1", // optional
  "user_agent": "Mozilla/5.0...", // optional
  "name": "John Doe" // optional, if available
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Thanks for subscribing! Expect sweet deals in your inbox.",
  "data": {
    "id": "sub_123",
    "email": "user@example.com",
    "status": "active",
    "subscribed_at": "2025-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Email already subscribed"
}
```

```json
{
  "success": false,
  "error": "Invalid email format"
}
```

```json
{
  "success": false,
  "error": "Rate limit exceeded"
}
```

### 2. Newsletter Unsubscribe Endpoint

**Endpoint:** `POST /api/newsletter/unsubscribe`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully unsubscribed from newsletter"
}
```

### 3. Admin Management Endpoints

#### Get All Subscribers
**Endpoint:** `GET /api/admin/newsletter/subscribers`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `search` (optional): Search by email
- `status` (optional): Filter by status (active, unsubscribed, bounced)

**Response:**
```json
{
  "success": true,
  "data": {
    "subscribers": [
      {
        "id": "sub_123",
        "email": "user@example.com",
        "status": "active",
        "subscribed_at": "2025-01-15T10:30:00Z",
        "source": "website",
        "name": "John Doe"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "pages": 3
    }
  }
}
```

#### Export Subscribers
**Endpoint:** `GET /api/admin/newsletter/export`

**Query Parameters:**
- `format`: "csv" | "json"
- `status` (optional): Filter by status

**Response:** CSV file download or JSON data

#### Update Subscription Status
**Endpoint:** `PUT /api/admin/newsletter/subscribers/{id}`

**Request Body:**
```json
{
  "status": "active" | "unsubscribed" | "bounced"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription status updated successfully"
}
```

#### Get Newsletter Statistics
**Endpoint:** `GET /api/admin/newsletter/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 120,
    "unsubscribed": 25,
    "bounced": 5,
    "this_month": 15,
    "last_month": 12
  }
}
```

---

## 🗄️ Database Schema Requirements

### Table: `newsletter_subscriptions`

```sql
CREATE TABLE newsletter_subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('active', 'unsubscribed', 'bounced') DEFAULT 'active',
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL,
    source ENUM('website', 'checkout', 'admin') DEFAULT 'website',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    name VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_subscribed_at (subscribed_at),
    INDEX idx_source (source)
);
```

---

## 🔧 Business Logic Requirements

### 1. Email Validation
- Validate email format using proper regex
- Check for valid domain and structure
- Return appropriate error messages

### 2. Duplicate Prevention
- Check if email already exists in database
- If exists and status is 'active', return "already subscribed" error
- If exists and status is 'unsubscribed', reactivate the subscription

### 3. Rate Limiting
- Maximum 3 subscription attempts per IP address per day
- Track by IP address and date
- Return "rate limit exceeded" error when limit reached

### 4. Status Management
- **active**: Subscribed and receiving emails
- **unsubscribed**: User opted out
- **bounced**: Email bounced back

### 5. Source Tracking
- **website**: Subscribed from footer form
- **checkout**: Subscribed during checkout process
- **admin**: Added by admin manually

### 6. Admin Access Control
- Only authenticated admin users can access management endpoints
- Implement proper authentication/authorization

---

## 🎨 Frontend Integration Points

### 1. Footer Newsletter Form
**Current Location:** `src/components/layout/Footer.tsx` (lines 97-120)
- Currently shows success message but doesn't save email
- Needs API integration to actually subscribe users

### 2. Checkout Newsletter Opt-in
**Current Location:** `src/pages/CheckoutPage.tsx` (lines 512-519)
- Currently has checkbox but doesn't process subscription
- Needs integration with order completion flow

### 3. Admin Dashboard
**Needed:** New admin management interface
- View all subscribers with search/filter
- Export subscribers to CSV
- Manage subscription statuses
- View subscription statistics

---

## 📋 Implementation Priority

### Phase 1 (High Priority)
1. ✅ Newsletter subscription endpoint (`POST /api/newsletter/subscribe`)
2. ✅ Basic email validation and duplicate prevention
3. ✅ Database schema implementation

### Phase 2 (Medium Priority)
4. ✅ Admin management endpoints
5. ✅ Newsletter statistics endpoint
6. ✅ Export functionality

### Phase 3 (Low Priority)
7. ✅ Unsubscribe endpoint
8. ✅ Advanced rate limiting
9. ✅ Email bounce handling

---

## 🔑 What Frontend Developer Needs

Once backend implementation is complete, please provide:

1. **Base API URL** (e.g., `https://api.phresh.pk`)
2. **Authentication method** (API key, JWT token, etc.)
3. **cURL examples** for each endpoint
4. **Response format examples** (success/error cases)
5. **Error code documentation**

---

## 📊 Expected Data Flow

### Footer Newsletter Signup:
1. User enters email → Frontend validates format
2. Frontend calls `POST /api/newsletter/subscribe`
3. Backend validates, checks duplicates, saves to DB
4. Frontend shows success/error message

### Checkout Newsletter Opt-in:
1. User checks newsletter checkbox during checkout
2. After successful order, frontend calls subscription API
3. Email is subscribed with source "checkout"

### Admin Management:
1. Admin accesses newsletter management page
2. Frontend calls `GET /api/admin/newsletter/subscribers`
3. Admin can search, filter, export, and manage subscriptions

---

## 🚀 Success Criteria

- [ ] Users can subscribe from footer form
- [ ] Users can opt-in during checkout
- [ ] Admins can view and manage all subscribers
- [ ] Admins can export subscriber lists
- [ ] Proper error handling and user feedback
- [ ] Rate limiting prevents spam
- [ ] Duplicate prevention works correctly
