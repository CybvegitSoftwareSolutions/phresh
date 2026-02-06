// API Service for Phresh Backend
// TEMP: Force live backend while testing. To re-enable localhost later,
// restore the previous auto-detection or set VITE_API_URL.
// const isBrowser = typeof window !== 'undefined';
// const isLocalhost = isBrowser && (/^localhost$|^127\.0\.0\.1$|^\[::1\]$/.test(window.location.hostname));
// const FALLBACK_BASE_URL = isLocalhost ? 'http://localhost:8712' : 'https://phresh-backend.droptech.io';
const API_BASE_URL = 'https://api.phresh.droptech.io';
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

    const token = this.token ?? localStorage.getItem('jwt_token');
    if (token) {
      this.token = token;
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      console.log('Making API request to:', url);
      console.log('Request config:', { method: config.method, headers: config.headers, body: config.body });
      
      const response = await fetch(url, config);
      
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        let errorData: any = null;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
            console.log('Error response data:', errorData);
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const text = await response.text();
            console.log('Error response text:', text);
            errorMessage = text || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          // If we can't parse the error response, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        
        return {
          success: false,
          message: errorMessage,
          error: errorMessage,
          data: errorData
        };
      }

      // Try to parse JSON response
      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const responseText = await response.text();
        console.log('Response text:', responseText);
        if (responseText) {
          data = JSON.parse(responseText);
        } else {
          console.warn('Empty response body');
          data = { success: false, message: 'Empty response from server' };
        }
      } else {
        // If response is not JSON, return a success response with the text
        const text = await response.text();
        console.log('Non-JSON response:', text);
        data = { success: true, data: text, message: 'Request successful' };
      }

      console.log('Parsed response data:', data);
      return data;
    } catch (error: any) {
      console.error('API Request failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error.message || 'Network error. Please check your connection and try again.',
        error: error.message
      };
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

    if (response.success && response.data && typeof response.data === 'object' && 'token' in response.data) {
      this.token = (response.data as any).token;
      localStorage.setItem('jwt_token', this.token);
    }

    return response;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data && typeof response.data === 'object' && 'token' in response.data) {
      this.token = (response.data as any).token;
      localStorage.setItem('jwt_token', this.token);
    }

    return response;
  }

  async getProfile(userId?: string) {
    // If userId is provided, add it as query parameter
    const endpoint = userId ? `/api/auth/profile?userId=${userId}` : '/api/auth/profile';
    return this.request(endpoint);
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
    images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
    is_featured?: boolean;
    selling_points?: string[] | null;
    shipping_information?: string | null;
    discount?: number;
    discount_type?: 'percentage' | 'amount';
    discount_amount?: number;
    tags?: string[];
    productType?: 'bundle' | string;
    bundle?: {
      size: number;
      price: number;
      allowedProducts: string[];
      allowDuplicates?: boolean;
    };
  }, imageFiles?: File[]) {
    // Category is required - must be a valid ObjectId
    if (!productData.category || (typeof productData.category === 'string' && productData.category.trim() === '')) {
      throw new Error('Category is required and must be a valid ObjectId');
    }

    // Build JSON body matching the curl command structure
    const jsonBody: Record<string, any> = {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock: productData.stock,
      category: productData.category.toString(),
      discount: productData.discount !== undefined ? productData.discount : 0,
      discount_type: productData.discount_type || 'percentage',
      discount_amount: productData.discount_amount !== undefined ? productData.discount_amount : 0,
      is_featured: productData.is_featured !== undefined ? productData.is_featured : false,
    };

    // Add image_url if provided
    if (productData.image_url) {
      jsonBody.image_url = productData.image_url;
    }

    // Add image_urls array (must be an array)
    if (productData.image_urls && productData.image_urls.length > 0) {
      jsonBody.image_urls = productData.image_urls;
    } else if (productData.image_url) {
      // If only image_url is provided, use it as image_urls array
      jsonBody.image_urls = [productData.image_url];
    }

    if (productData.images && productData.images.length > 0) {
      jsonBody.images = productData.images;
    }

    // Add selling_points array if provided
    if (productData.selling_points && productData.selling_points.length > 0) {
      jsonBody.selling_points = productData.selling_points;
    }

    // Add shipping_information if provided
    if (productData.shipping_information) {
      jsonBody.shipping_information = productData.shipping_information;
    }

    // Add tags if provided
    if (productData.tags && productData.tags.length > 0) {
      jsonBody.tags = productData.tags;
    }

    if (productData.productType) {
      jsonBody.productType = productData.productType;
    }

    if (productData.bundle) {
      jsonBody.bundle = productData.bundle;
    }

    // Use the standard request method which sends JSON
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(jsonBody),
    });
  }

  async updateProduct(productId: string, productData: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    category?: string | null;
    image_url?: string;
    image_urls?: string[];
    images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
    is_featured?: boolean;
    selling_points?: string[] | null;
    shipping_information?: string | null;
    discount?: number;
    discount_type?: 'percentage' | 'amount';
    discount_amount?: number;
    tags?: string[];
    productType?: 'bundle' | string;
    bundle?: {
      size: number;
      price: number;
      allowedProducts: string[];
      allowDuplicates?: boolean;
    };
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
      variantId?: string;
      bundleItems?: Array<{
        product: string;
        quantity: number;
        variantId?: string;
      }>;
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
    couponCode?: string;
  }) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async createPaymentIntent(data: {
    orderId: string;
    orderNumber?: string;
    email?: string;
    amount?: number;
    currency: string;
  }) {
    return this.request('/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentStatus(params: {
    paymentIntentId?: string;
    orderId?: string;
    orderNumber?: string;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/payments/status?${queryString}` : '/api/payments/status';

    return this.request(endpoint);
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
    return this.request('/api/products/categories');
  }

  async createCategory(categoryData: {
    name: string;
    description?: string;
    image?: File;
    isActive?: boolean;
    sortOrder?: number;
    showOnHomepage?: boolean;
    homepageOrder?: number;
    parentCategory?: string;
    seoTitle?: string;
    seoDescription?: string;
  }) {
    const formData = new FormData();
    formData.append('name', categoryData.name);
    
    if (categoryData.description) {
      formData.append('description', categoryData.description);
    }
    if (categoryData.image) {
      formData.append('image', categoryData.image);
    }
    if (categoryData.isActive !== undefined) {
      formData.append('isActive', categoryData.isActive.toString());
    }
    if (categoryData.sortOrder !== undefined) {
      formData.append('sortOrder', categoryData.sortOrder.toString());
    }
    if (categoryData.showOnHomepage !== undefined) {
      formData.append('showOnHomepage', categoryData.showOnHomepage.toString());
    }
    if (categoryData.homepageOrder !== undefined) {
      formData.append('homepageOrder', categoryData.homepageOrder.toString());
    }
    if (categoryData.parentCategory) {
      formData.append('parentCategory', categoryData.parentCategory);
    }
    if (categoryData.seoTitle) {
      formData.append('seoTitle', categoryData.seoTitle);
    }
    if (categoryData.seoDescription) {
      formData.append('seoDescription', categoryData.seoDescription);
    }

    const response = await fetch(`${this.baseURL}/api/admin/categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    return response.json();
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
    return this.request(`/api/admin/categories/${categoryId}`, {
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
    name: string;
    email: string;
    phone: string;
    purpose: string;
    address: string;
    number_of_people: number;
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

  async addCorporateOrderNote(orderId: string, noteData: { message: string; isInternal: boolean }) {
    return this.request(`/api/admin/corporate-orders/${orderId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData),
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

  // Instagram media (proxy from backend)
  async getInstagramMedia(params: { limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.limit !== undefined) {
      searchParams.append('limit', String(params.limit));
    }
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/instagram/media?${queryString}` : '/api/instagram/media';
    return this.request(endpoint);
  }

  async createCarouselItem(carouselData: {
    title?: string;
    subtitle?: string;
    image?: File | null;
    image_url?: string;
    link_url?: string;
    product_id?: string | null;
    video_url?: string | null;
    isActive?: boolean;
  }) {
    const formData = new FormData();
    if (carouselData.title) formData.append('title', carouselData.title);
    if (carouselData.subtitle) formData.append('subtitle', carouselData.subtitle);
    if (carouselData.image) formData.append('image', carouselData.image);
    if (carouselData.image_url && !carouselData.image) formData.append('image_url', carouselData.image_url);
    if (carouselData.link_url) formData.append('link_url', carouselData.link_url);
    if (carouselData.product_id) formData.append('product_id', carouselData.product_id);
    if (carouselData.video_url) formData.append('video_url', carouselData.video_url);
    if (carouselData.isActive !== undefined) formData.append('isActive', String(carouselData.isActive));

    return this.request('/api/admin/carousel', {
      method: 'POST',
      body: formData,
      headers: {
        // Do NOT set Content-Type header for FormData, browser sets it automatically with boundary
      },
    });
  }

  async updateCarouselItem(carouselId: string, carouselData: {
    title?: string;
    subtitle?: string;
    image?: File | null;
    image_url?: string;
    link_url?: string;
    product_id?: string | null;
    video_url?: string | null;
    isActive?: boolean;
    order_position?: number;
  }) {
    const formData = new FormData();
    if (carouselData.title !== undefined) formData.append('title', carouselData.title);
    if (carouselData.subtitle !== undefined) formData.append('subtitle', carouselData.subtitle);
    if (carouselData.image) formData.append('image', carouselData.image);
    if (carouselData.image_url && !carouselData.image) formData.append('image_url', carouselData.image_url);
    if (carouselData.link_url !== undefined) formData.append('link_url', carouselData.link_url || '');
    if (carouselData.product_id !== undefined) formData.append('product_id', carouselData.product_id || '');
    if (carouselData.video_url !== undefined) formData.append('video_url', carouselData.video_url || '');
    if (carouselData.isActive !== undefined) formData.append('isActive', String(carouselData.isActive));
    if (carouselData.order_position !== undefined) formData.append('order_position', String(carouselData.order_position));

    return this.request(`/api/admin/carousel/${carouselId}`, {
      method: 'PUT',
      body: formData,
      headers: {
        // Do NOT set Content-Type header for FormData, browser sets it automatically with boundary
      },
    });
  }

  async deleteCarouselItem(carouselId: string) {
    return this.request(`/api/admin/carousel/${carouselId}`, {
      method: 'DELETE',
    });
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
  async getAdminAnnouncements(params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/api/announcements/admin/all?${queryString}`
      : '/api/announcements/admin/all';

    return this.request(endpoint);
  }

  async createAnnouncement(data: {
    title: string;
    message: string;
    type?: string;
    priority?: string;
    isActive?: boolean;
    targetAudience?: string;
    targetUsers?: string[];
    isDismissible?: boolean;
    showOnHomepage?: boolean;
    showInHeader?: boolean;
    startDate?: string | null;
    bgColor?: string;
    textColor?: string;
    fontSize?: number;
    linkUrl?: string | null;
  }) {
    return this.request('/api/announcements/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(announcementId: string, data: {
    title?: string;
    message?: string;
    type?: string;
    priority?: string;
    isActive?: boolean;
    targetAudience?: string;
    targetUsers?: string[];
    isDismissible?: boolean;
    showOnHomepage?: boolean;
    showInHeader?: boolean;
    startDate?: string | null;
    bgColor?: string;
    textColor?: string;
    fontSize?: number;
    linkUrl?: string | null;
  }) {
    return this.request(`/api/announcements/admin/${announcementId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Coupon methods (admin)
  async getCoupons(params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/coupons?${queryString}` : '/api/coupons';
    return this.request(endpoint);
  }

  async createCoupon(data: {
    code: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    appliesTo?: 'subtotal' | 'total';
    isActive?: boolean;
  }) {
    return this.request('/api/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCoupon(couponId: string, data: {
    name?: string;
    type?: 'percentage' | 'fixed';
    value?: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    appliesTo?: 'subtotal' | 'total';
    isActive?: boolean;
  }) {
    return this.request(`/api/coupons/${couponId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCoupon(couponId: string) {
    return this.request(`/api/coupons/${couponId}`, {
      method: 'DELETE',
    });
  }

  async validateCoupon(data: { code: string; subtotal: number }) {
    return this.request('/api/coupons/validate', {
      method: 'POST',
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
    grouped?: boolean;
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

  async deleteOrderAdmin(orderId: string) {
    return this.request(`/api/orders/admin/${orderId}`, {
      method: 'DELETE',
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

    if (response.success && response.data && typeof response.data === 'object' && 'token' in response.data) {
      this.token = (response.data as any).token;
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
