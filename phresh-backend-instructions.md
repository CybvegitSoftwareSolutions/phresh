# 🚀 Complete Node.js MongoDB Backend Instructions for Phresh

## PROJECT OVERVIEW
Create a complete Node.js/Express backend API for a fresh juices e-commerce platform called "Phresh" using MongoDB. This backend will replace Supabase functionality with full control and customization.

## PROJECT SETUP
- Create a new folder called "phresh-backend" 
- Use Node.js with Express.js (JavaScript, not TypeScript)
- MongoDB with Mongoose ODM
- JWT authentication
- All necessary dependencies for a complete e-commerce backend

## DEPENDENCIES TO INSTALL
```bash
npm install express mongoose jsonwebtoken bcryptjs cors dotenv multer nodemailer stripe cloudinary socket.io express-validator multer-storage-cloudinary
npm install -D nodemon
```

## PROJECT STRUCTURE
Create this exact folder structure:
```
phresh-backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Order.js
│   │   ├── ProductVariant.js
│   │   ├── CarouselItem.js
│   │   ├── ContactQuery.js
│   │   ├── CorporateOrder.js
│   │   ├── Blog.js
│   │   └── Review.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── admin.js
│   │   └── contact.js
│   ├── utils/
│   │   ├── email.js
│   │   ├── pagination.js
│   │   └── response.js
│   └── index.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## ENVIRONMENT VARIABLES (.env.example)
```env
# Database
MONGO_URI=mongodb://207.180.215.127:7102/droptech

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FROM_EMAIL=noreply@phresh.pk

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# CORS
FRONTEND_URL=http://localhost:5173

# Company Info
COMPANY_PHONE=+923020025727
COMPANY_EMAIL=support@phresh.pk
WHATSAPP_NUMBER=033372507
```

## DATABASE MODELS
Create Mongoose schemas for all models with:
- Proper validation
- Indexes for performance
- Relationships between collections
- Pre-save hooks where needed
- Password hashing for User model

### User Model Features:
- Email, password, name, phone
- Role (user/admin)
- Address information
- Profile image
- Created/updated timestamps

### Product Model Features:
- Name, description, price
- Category reference
- Images array
- Variants (size, flavor, etc.)
- Stock management
- Featured status
- SEO fields

### Order Model Features:
- User reference
- Order items array
- Shipping address
- Payment status
- Order status tracking
- Total amount
- Order number generation

## AUTHENTICATION SYSTEM
- JWT-based authentication
- User registration/login
- Password hashing with bcrypt
- Admin authorization
- Profile management
- Middleware for protecting routes

### Auth Endpoints:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- PUT /api/auth/profile
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

## PRODUCT MANAGEMENT
- CRUD operations for products
- Category management
- Product variants support
- Featured products
- Search functionality
- Image upload with Cloudinary
- Pagination and filtering

### Product Endpoints:
- GET /api/products (with pagination, search, filters)
- GET /api/products/:id
- POST /api/products (admin only)
- PUT /api/products/:id (admin only)
- DELETE /api/products/:id (admin only)
- GET /api/products/featured
- GET /api/products/category/:category

## ORDER PROCESSING
- Order creation and management
- Order status tracking
- Payment integration ready
- Shipping address handling
- Order history for users

### Order Endpoints:
- POST /api/orders
- GET /api/orders (user's orders)
- GET /api/orders/:id
- PUT /api/orders/:id/status (admin only)
- GET /api/orders/admin (admin only)

## ADMIN FEATURES
- Admin dashboard endpoints
- Product management
- Order management
- User management
- Analytics and statistics

### Admin Endpoints:
- GET /api/admin/dashboard
- GET /api/admin/users
- GET /api/admin/orders
- GET /api/admin/products
- PUT /api/admin/users/:id/role
- DELETE /api/admin/users/:id

## EMAIL SYSTEM
- Order confirmation emails
- Contact form notifications
- Corporate order alerts
- HTML email templates with Phresh branding

### Email Templates:
- Order confirmation
- Order status updates
- Contact form notifications
- Corporate order alerts
- Password reset emails

## MIDDLEWARE
- Authentication middleware
- File upload handling
- Input validation
- Error handling
- CORS configuration

### Middleware Functions:
- `auth` - JWT token verification
- `adminAuth` - Admin role verification
- `upload` - File upload handling
- `validate` - Input validation
- `errorHandler` - Global error handling

## UTILITIES
- Email sending functions
- Pagination helpers
- Response formatting
- File upload handling

### Utility Functions:
- `sendEmail()` - Email sending
- `paginate()` - Pagination helper
- `formatResponse()` - Response formatting
- `uploadToCloudinary()` - Image upload
- `generateOrderNumber()` - Order number generation

## PACKAGE.JSON SCRIPTS
```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  }
}
```

## THEME & BRANDING
- Use green color scheme (#97ad58) for Phresh branding
- Fresh juices theme throughout
- Health-focused messaging
- Categories: Fruit Juices, Vegetable Juices, Detox Juices

## SECURITY FEATURES
- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- Admin authorization
- Rate limiting (optional)

## ERROR HANDLING
- Global error handler
- Validation error handling
- Database error handling
- Consistent error response format

## RESPONSE FORMAT
All API responses should follow this format:
```json
{
  "success": true/false,
  "message": "Description",
  "data": { ... },
  "error": "Error details (if any)"
}
```

## ADDITIONAL FEATURES
- Contact form handling
- Corporate order processing
- Blog system
- Review system
- Carousel management
- Real-time notifications (Socket.io)
- File upload with Cloudinary
- Email notifications

### Contact Endpoints:
- POST /api/contact
- GET /api/contact/admin (admin only)
- POST /api/contact/corporate

### Blog Endpoints:
- GET /api/blogs
- GET /api/blogs/:id
- POST /api/blogs (admin only)
- PUT /api/blogs/:id (admin only)
- DELETE /api/blogs/:id (admin only)

### Review Endpoints:
- GET /api/reviews/product/:productId
- POST /api/reviews
- PUT /api/reviews/:id
- DELETE /api/reviews/:id

## DOCUMENTATION
Create a comprehensive README.md with:
- Setup instructions
- API documentation
- Environment variables
- Database schema
- Deployment instructions

## DEPLOYMENT CONSIDERATIONS
- Environment variables setup
- MongoDB connection
- Cloudinary configuration
- Email service setup
- CORS configuration for production
- Error logging
- Performance monitoring

## KEY FEATURES TO IMPLEMENT
1. **User Management**: Registration, login, profile management
2. **Product Catalog**: CRUD operations, categories, variants
3. **Shopping Cart**: Add/remove items, quantity management
4. **Order Processing**: Order creation, status tracking, history
5. **Admin Panel**: Dashboard, user management, order management
6. **Email System**: Notifications, confirmations, alerts
7. **File Upload**: Image handling with Cloudinary
8. **Search & Filter**: Product search, category filtering
9. **Pagination**: Efficient data loading
10. **Security**: Authentication, authorization, validation

## IMPLEMENTATION NOTES
- Use async/await for all database operations
- Implement proper error handling for all routes
- Use JSDoc comments for function documentation
- Follow RESTful API conventions
- Implement proper HTTP status codes
- Use environment variables for all configuration
- Implement proper logging for debugging
- Use middleware for common functionality
- Implement proper validation for all inputs
- Use proper database indexing for performance

## TESTING CONSIDERATIONS
- Test all API endpoints
- Test authentication flows
- Test file upload functionality
- Test email sending
- Test database operations
- Test error handling
- Test admin functionality
- Test user permissions

## PRODUCTION READINESS
- Environment configuration
- Database optimization
- Error logging
- Performance monitoring
- Security measures
- CORS configuration
- Rate limiting
- Input sanitization
- Output validation

Make sure all code is production-ready with proper error handling, validation, and security measures. The backend should be a complete replacement for Supabase with all the same functionality plus more control and customization options.

## FINAL NOTES
- All code should be in JavaScript (not TypeScript)
- Use require() and module.exports instead of import/export
- Implement proper JSDoc comments for documentation
- Follow Node.js best practices
- Ensure all dependencies are properly installed
- Test all functionality before deployment
- Implement proper logging and monitoring
- Use environment variables for all configuration
- Implement proper security measures
- Follow RESTful API design principles
