// API Service for Phresh Backend
// TEMP: Force live backend while testing. To re-enable localhost later,
// restore the previous auto-detection or set VITE_API_URL.
// const isBrowser = typeof window !== 'undefined';
// const isLocalhost = isBrowser && (/^localhost$|^127\.0\.0\.1$|^\[::1\]$/.test(window.location.hostname));
// const FALLBACK_BASE_URL = isLocalhost ? 'http://localhost:8712' : 'https://phresh-backend.droptech.io';
const API_BASE_URL = 'https://phresh-backend.droptech.io';
// const API_BASE_URL = 'http://localhost:8712';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('jwt_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (this.token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('jwt_token', this.token);
    }

    return response;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('jwt_token', this.token);
    }

    return response;
  }

  async getProfile() {
    return this.request('/api/auth/profile');
  }

  async updateProfile(userData: any) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }) {
    return this.request('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async forgotPassword(email: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async uploadProfileImage(imageFile: File) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseURL}/api/auth/upload-profile-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('jwt_token');
  }

  // Product methods
  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/products?${queryString}` : '/api/products';

    return this.request(endpoint);
  }

  async getAllProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/products?${queryString}` : '/api/products';

    return this.request(endpoint);
  }

  async getProduct(id: string) {
    return this.request(`/api/products/${id}`);
  }

  async getFeaturedProducts(params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/products/featured?${queryString}` : '/api/products/featured';

    return this.request(endpoint);
  }

  async getBestSellerProducts(params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/products/best-sellers?${queryString}` : '/api/products/best-sellers';

    return this.request(endpoint);
  }

  async getNewProducts(params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/products/new?${queryString}` : '/api/products/new';

    return this.request(endpoint);
  }

  async searchProducts(query: string, params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams({ q: query });
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/api/products/search?${searchParams.toString()}`);
  }

  async getProductsByCategory(categorySlug: string, params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/api/products/category/${categorySlug}?${queryString}`
      : `/api/products/category/${categorySlug}`;

    return this.request(endpoint);
  }

  async getRelatedProducts(productId: string, limit: number = 4) {
    return this.request(`/api/products/${productId}/related?limit=${limit}`);
  }

  async createProduct(productData: {
    name: string;
    description: string;
    price: number;
    stock: number;
    category?: string | null;
    image_url?: string;
    image_urls?: string[];
    is_featured?: boolean;
    selling_points?: string[] | null;
    shipping_information?: string | null;
    discount?: number;
    discount_type?: 'percentage' | 'amount';
    discount_amount?: number;
    tags?: string[];
  }, imageFiles?: File[]) {
    // Create FormData for multipart/form-data
    const formData = new FormData();

    // Add text fields
    formData.append('name', productData.name);
    formData.append('description', productData.description);
    formData.append('price', productData.price.toString());
    formData.append('stock', productData.stock.toString());

    // Category is required - must be a valid ObjectId
    if (!productData.category || (typeof productData.category === 'string' && productData.category.trim() === '')) {
      throw new Error('Category is required and must be a valid ObjectId');
    }
    formData.append('category', productData.category.toString());

    if (productData.image_url) {
      formData.append('image_url', productData.image_url);
    }

    if (productData.image_urls && productData.image_urls.length > 0) {
      productData.image_urls.forEach((url, index) => {
        formData.append(`image_urls[${index}]`, url);
      });
    }

    if (productData.is_featured !== undefined) {
      formData.append('is_featured', productData.is_featured.toString());
    }

    if (productData.selling_points && productData.selling_points.length > 0) {
      productData.selling_points.forEach((point, index) => {
        formData.append(`selling_points[${index}]`, point);
      });
    }

    if (productData.shipping_information) {
      formData.append('shipping_information', productData.shipping_information);
    }

    if (productData.discount !== undefined) {
      formData.append('discount', productData.discount.toString());
    }

    if (productData.discount_type) {
      formData.append('discount_type', productData.discount_type);
    }

    if (productData.discount_amount !== undefined) {
      formData.append('discount_amount', productData.discount_amount.toString());
    }

    if (productData.tags && productData.tags.length > 0) {
      productData.tags.forEach((tag, index) => {
        formData.append(`tags[${index}]`, tag);
      });
    }

    // Add image files if provided
    if (imageFiles && imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });
    }

    // Send as multipart/form-data (don't set Content-Type header, browser will set it with boundary)
    const url = `${this.baseURL}/api/products`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Don't set Content-Type - browser will automatically set it with boundary for FormData
    const config: RequestInit = {
      method: 'POST',
      headers,
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, productData: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    category?: string | null;
    image_url?: string;
    image_urls?: string[];
    is_featured?: boolean;
    selling_points?: string[] | null;
    shipping_information?: string | null;
    discount?: number;
    discount_type?: 'percentage' | 'amount';
    discount_amount?: number;
    tags?: string[];
  }) {
    return this.request(`/api/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(productId: string) {
    return this.request(`/api/products/${productId}`, {
      method: 'DELETE',
    });
  }

  // Order methods
  async createOrder(orderData: {
    email: string; // Email is always required (used for order history matching)
    items: Array<{
      product: string;
      quantity: number;
      variant?: {
        name: string;
        price: number;
      };
    }>;
    shippingAddress: {
      name: string;
      phone: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      instructions?: string;
    };
    paymentMethod: string;
    notes?: string;
  }) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getUserOrders(params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/orders?${queryString}` : '/api/orders';

    return this.request(endpoint);
  }

  // Public endpoint to get orders by email (no authentication required)
  async getOrdersByEmail(email: string, params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/api/orders/email/${encodeURIComponent(email)}?${queryString}`
      : `/api/orders/email/${encodeURIComponent(email)}`;

    // This is a public endpoint, so we need to make a request without auth token
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async getOrder(orderId: string) {
    return this.request(`/api/orders/${orderId}`);
  }

  async cancelOrder(orderId: string, reason: string) {
    return this.request(`/api/orders/${orderId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  // Category methods
  async getCategories() {
    return this.request('/api/categories');
  }

  async getAllCategories() {
    return this.request('/api/categories');
  }

  async createCategory(categoryData: {
    name: string;
    slug?: string;
    description?: string;
  }) {
    return this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(categoryId: string, categoryData: {
    name?: string;
    slug?: string;
    description?: string;
  }) {
    return this.request(`/api/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(categoryId: string) {
    return this.request(`/api/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Contact methods
  async submitContactForm(contactData: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    category?: string;
  }) {
    return this.request('/api/contact', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async getAllContactQueries(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/admin/contact-queries?${queryString}` : '/api/admin/contact-queries';

    return this.request(endpoint);
  }

  async updateContactQueryStatus(queryId: string, status: 'pending' | 'resolved') {
    return this.request(`/api/admin/contact-queries/${queryId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async submitCorporateOrder(corporateData: {
    companyName: string;
    contactPerson: {
      name: string;
      email: string;
      phone: string;
      position: string;
    };
    deliveryAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    orderDetails: {
      eventDate: string;
      eventType: string;
      estimatedGuests: number;
      specialRequirements?: string;
    };
    items: Array<{
      product: string;
      quantity: number;
      price: number;
      notes?: string;
    }>;
  }) {
    return this.request('/api/contact/corporate', {
      method: 'POST',
      body: JSON.stringify(corporateData),
    });
  }

  async getAllCorporateOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/admin/corporate-orders?${queryString}` : '/api/admin/corporate-orders';

    return this.request(endpoint);
  }

  async updateCorporateOrderStatus(orderId: string, status: 'pending' | 'approved' | 'rejected' | 'resolved') {
    return this.request(`/api/admin/corporate-orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Blog methods
  async getBlogs(params: {
    page?: number;
    limit?: number;
    category?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/blogs?${queryString}` : '/api/blogs';

    return this.request(endpoint);
  }

  async getBlog(slug: string) {
    return this.request(`/api/blogs/${slug}`);
  }

  // Review methods
  async getProductReviews(productId: string, params: {
    page?: number;
    limit?: number;
    rating?: number;
    sortBy?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/api/reviews/product/${productId}?${queryString}`
      : `/api/reviews/product/${productId}`;

    return this.request(endpoint);
  }

  async getAllReviews(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/admin/reviews?${queryString}` : '/api/admin/reviews';

    return this.request(endpoint);
  }

  async updateReviewStatus(reviewId: string, status: 'pending' | 'approved' | 'rejected') {
    return this.request(`/api/admin/reviews/${reviewId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteReview(reviewId: string) {
    return this.request(`/api/admin/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  async createReview(productId: string, reviewData: {
    rating: number;
    comment?: string | null;
    customer_name?: string;
  }) {
    return this.request(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Carousel methods
  async getCarouselItems() {
    return this.request('/api/carousel');
  }

  // Announcement methods
  async getActiveAnnouncements() {
    return this.request('/api/announcements/active');
  }

  async getHomepageAnnouncements() {
    return this.request('/api/announcements/homepage');
  }

  async trackAnnouncementClick(announcementId: string) {
    return this.request(`/api/announcements/${announcementId}/click`, {
      method: 'POST',
    });
  }

  // Admin announcement methods
  async createAnnouncement(data: {
    message: string;
    is_active: boolean;
    bg_color: string;
    text_color: string;
    font_size: number;
    link_url?: string | null;
    show_in_header: boolean;
  }) {
    return this.request('/api/announcements/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(announcementId: string, data: {
    message: string;
    is_active: boolean;
    bg_color: string;
    text_color: string;
    font_size: number;
    link_url?: string | null;
    show_in_header: boolean;
  }) {
    return this.request(`/api/announcements/admin/${announcementId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Admin methods
  async getDashboardStats() {
    return this.request('/api/admin/dashboard');
  }

  async getAllUsers(params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/admin/users?${queryString}` : '/api/admin/users';

    return this.request(endpoint);
  }

  async updateUserRole(userId: string, role: string) {
    return this.request(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getAllOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/orders/admin/all?${queryString}` : '/api/orders/admin/all';

    return this.request(endpoint);
  }

  async updateOrderStatus(orderId: string, status: string, notes?: string) {
    return this.request(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }

  async getOrderStats() {
    return this.request('/api/orders/admin/stats');
  }

  // OTP methods
  async sendOtp(email: string) {
    return this.request('/api/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(name: string, email: string, password: string, otp: string) {
    const response = await this.request('/api/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, otp }),
    });

    if (response.success && response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('jwt_token', this.token);
    }

    return response;
  }

  async resendOtp(email: string) {
    return this.request('/api/otp/resend', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Cart methods
  async getCart() {
    return this.request('/api/cart');
  }

  async addToCart(cartData: {
    productId: string;
    quantity: number;
    variant_size?: string;
    variant_price?: number;
  }) {
    return this.request('/api/cart', {
      method: 'POST',
      body: JSON.stringify(cartData),
    });
  }

  async updateCartItem(cartItemId: string, quantity: number) {
    return this.request(`/api/cart/${cartItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(cartItemId: string) {
    return this.request(`/api/cart/${cartItemId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    return this.request('/api/cart', {
      method: 'DELETE',
    });
  }

  // Settings methods
  async getShippingSettings() {
    return this.request('/api/settings/shipping');
  }

  async updateShippingSettings(settings: {
    cod_enabled: boolean;
    delivery_charges: number;
    free_delivery_threshold: number;
    delivery_time: string;
    applicable_cities: string[];
  }) {
    return this.request('/api/settings/shipping', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getPaymentSettings() {
    return this.request('/api/settings/payment');
  }

  async updatePaymentSettings(settings: {
    cod_enabled: boolean;
    mobile_payment_enabled: boolean;
    account_title: string;
    account_number: string;
    iban: string;
    bank_name: string;
    contact_email: string;
    contact_whatsapp: string;
    instructions: string;
  }) {
    return this.request('/api/settings/payment', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Address methods
  async getAddresses() {
    return this.request('/api/addresses');
  }

  async addAddress(addressData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    floor?: string;
    apartment?: string;
    is_default: boolean;
  }) {
    return this.request('/api/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  }

  async updateAddress(addressId: string, addressData: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    floor: string;
    apartment: string;
    is_default: boolean;
  }>) {
    return this.request(`/api/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  }

  async deleteAddress(addressId: string) {
    return this.request(`/api/addresses/${addressId}`, {
      method: 'DELETE',
    });
  }

  async setDefaultAddress(addressId: string) {
    return this.request(`/api/addresses/${addressId}/set-default`, {
      method: 'POST',
    });
  }

  // Order Management - New APIs
  async getOrderByNumber(orderNumber: string) {
    return this.request(`/api/orders/number/${orderNumber}`);
  }

  async getOrderByPublicToken(orderNumber: string, token: string) {
    return this.request(`/api/orders/public/${orderNumber}?token=${token}`);
  }

  // Product Variants Management
  async getProductVariants(productId: string) {
    return this.request(`/api/products/${productId}/variants`);
  }

  async addProductVariant(productId: string, variantData: {
    name: string;
    price: number;
    stock: number;
    sku?: string;
    attributes?: Record<string, any>;
  }) {
    return this.request(`/api/products/${productId}/variants`, {
      method: 'POST',
      body: JSON.stringify(variantData),
    });
  }

  async updateProductVariant(productId: string, variantId: string, variantData: {
    name?: string;
    price?: number;
    stock?: number;
    sku?: string;
    attributes?: Record<string, any>;
  }) {
    return this.request(`/api/products/${productId}/variants/${variantId}`, {
      method: 'PUT',
      body: JSON.stringify(variantData),
    });
  }

  async deleteProductVariant(productId: string, variantId: string) {
    return this.request(`/api/products/${productId}/variants/${variantId}`, {
      method: 'DELETE',
    });
  }

  // Featured Products Management
  async toggleFeaturedProducts(productId: string, isFeatured: boolean) {
    return this.request(`/api/products/${productId}/featured`, {
      method: 'PUT',
      body: JSON.stringify({ is_featured: isFeatured }),
    });
  }

  // Homepage Categories Management
  async getHomepageCategories() {
    return this.request('/api/admin/homepage-categories');
  }

  async updateHomepageCategories(categoryId: string, data: {
    order?: number;
    homepageOrder?: number;
    image_url?: string | null;
    description?: string | null;
    show_on_homepage?: boolean;
    showOnHomepage?: boolean;
  }) {
    // The backend endpoint might be /api/admin/categories/:id instead of /api/admin/homepage-categories/:id
    // Try categories endpoint first since homepage-categories endpoint returns 404
    const url = `${this.baseURL}/api/admin/categories/${categoryId}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // If categories endpoint also fails, try homepage-categories as fallback
        if (response.status === 404) {
          console.log('Categories endpoint not found, trying homepage-categories endpoint');
          return this.request(`/api/admin/homepage-categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          });
        }
        return {
          success: false,
          message: result.message || 'Request failed',
          data: result.data,
        };
      }

      return {
        success: true,
        message: result.message || 'Success',
        data: result.data || result,
      };
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // File Upload APIs
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/upload/file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  async uploadFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });

    const response = await fetch(`${this.baseURL}/api/upload/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  async getFileInfo(fileId: string) {
    return this.request(`/api/upload/file/${fileId}`);
  }

  async deleteFile(fileId: string) {
    return this.request(`/api/upload/file/${fileId}`, {
      method: 'DELETE',
    });
  }

  async uploadProductImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/upload/product-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  async uploadBlogImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/upload/blog-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  async uploadCarouselMedia(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/api/upload/carousel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export a singleton instance
export const apiService = new ApiService(API_BASE_URL);
export default apiService;
