import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Plus, Edit2, Trash2, Star, StarOff, X, Upload, Loader2, MessageSquarePlus, Download, ImageIcon } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import ProductVariantsManagement from "./ProductVariantsManagement";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import * as XLSX from "xlsx";

interface Product {
  _id: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  stock: number;
  isFeatured?: boolean;
  is_featured?: boolean;
  isActive?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  images?: string[] | Array<{ url?: string; _id?: string }>;
  image_url?: string;
  image_urls?: string[];
  category?: {
    _id: string;
    name: string;
    slug?: string;
  } | string;
  productType?: string;
  bundle?: {
    size?: number;
    price?: number;
    allowedProducts?: string[];
    allowDuplicates?: boolean;
  };
  variants?: Array<{
    _id?: string;
    name: string;
    price: number;
    stock: number;
  }>;
  tags?: string[];
  ingredients?: string[];
  allergens?: string[];
  metaKeywords?: string[];
  sortOrder?: number;
  views?: number;
  sales?: number;
  createdAt?: string;
  updatedAt?: string;
  // Legacy fields for backward compatibility
  discount?: number | null;
  discount_amount?: number | null;
  discount_type?: "percentage" | "amount" | null;
  selling_points?: string[] | null;
  shipping_information?: string | null;
}

interface ProductVariant {
  _id?: string;
  name: string;
  price: number;
  stock: number;
  sku?: string;
  attributes?: Record<string, any>;
}

interface Category {
  _id: string;
  name: string;
}

type DiscountFormType = "percentage" | "amount";

interface ProductFormState {
  title: string;
  description: string;
  stock_quantity: string;
  category_id: string;
  image_url: string;
  discountPercent: string;
  discountAmount: string;
  discountType: DiscountFormType;
  is_featured: boolean;
  selling_points: string;
  shipping_information: string;
  productType: "product" | "bundle";
}

export const ProductsManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedReviewProduct, setSelectedReviewProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<ProductFormState>({
    title: "",
    description: "",
    stock_quantity: "",
    category_id: "",
    image_url: "",
    discountPercent: "",
    discountAmount: "",
    discountType: "percentage",
    is_featured: false,
    selling_points: "",
    shipping_information: "",
    productType: "product",
  });
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [bundleConfig, setBundleConfig] = useState({
    size: "",
    price: "",
    allowDuplicates: true,
    allowedProducts: [] as string[],
  });
  const [bundleSearch, setBundleSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    customer_name: "",
    email: "",
    rating: "5",
    review_text: "",
    is_verified: true,
  });

  const [supportsDiscountType, setSupportsDiscountType] = useState(false);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredProducts = normalizedSearch
    ? products.filter((product) => {
        const categoryName = typeof product.category === 'object' ? product.category?.name ?? "" : "";
        return (
          product.name.toLowerCase().includes(normalizedSearch) ||
          categoryName.toLowerCase().includes(normalizedSearch) ||
          product._id.toLowerCase().includes(normalizedSearch)
        );
      })
    : products;

  const selectableProducts = products.filter((product) => {
    const isBundle = product.productType === "bundle";
    const isSelf = editingProduct ? product._id === editingProduct._id : false;
    return !isBundle && !isSelf;
  });

  const filteredBundleProducts = bundleSearch.trim()
    ? selectableProducts.filter((product) => {
        const query = bundleSearch.trim().toLowerCase();
        const categoryName = typeof product.category === 'object' ? product.category?.name ?? "" : "";
        return (
          product.name.toLowerCase().includes(query) ||
          categoryName.toLowerCase().includes(query) ||
          product._id.toLowerCase().includes(query)
        );
      })
    : selectableProducts;

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!supportsDiscountType && formData.discountType === "amount") {
      setFormData((prev) => ({ ...prev, discountType: "percentage" }));
    }
  }, [supportsDiscountType, formData.discountType]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllProducts({ page: 1, limit: 100 });
      console.log('Products response:', response);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch products");
      }

      // Handle nested data structure: response.data.data contains the array
      const productsData = response.data.data?.data || response.data.data || response.data.products || response.data;
      const products = Array.isArray(productsData) ? productsData : [];
      
      // Use products directly from API (they already match the new structure)
      setProducts(products);

      // Check if discount type is supported (assuming it is for now)
      setSupportsDiscountType(true);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.getAllCategories();
      if (response.success && response.data) {
        // Handle nested data structure: response.data.data contains the array
        const categoriesData = response.data.data?.data || response.data.data || response.data.categories || response.data;
        const categories = Array.isArray(categoriesData) ? categoriesData : [];
        setCategories(categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Set empty array on error to prevent map errors
    }
  };

  const handleSaveProduct = async () => {
    try {
      const stockValue = parseInt(formData.stock_quantity, 10);
      const percentValue = parseFloat(formData.discountPercent);
      const amountValue = parseFloat(formData.discountAmount);
      const normalizedPercent = Number.isFinite(percentValue) ? Math.max(percentValue, 0) : 0;
      const normalizedAmount = Number.isFinite(amountValue) ? Math.max(amountValue, 0) : 0;
      const selectedDiscountType = formData.discountType;
      const isBundle = formData.productType === "bundle";

      if (selectedDiscountType === "amount" && !supportsDiscountType) {
        toast({
          title: "Fixed amount discount unavailable",
          description: "Fixed amount discounts are now supported. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (!isBundle && variants.length === 0) {
        toast({
          title: "Variants required",
          description: "Please add at least one size with a price before saving.",
          variant: "destructive"
        });
        return;
      }

      if (isBundle) {
        const bundleSize = Number(bundleConfig.size);
        const bundlePrice = Number(bundleConfig.price);
        if (!Number.isFinite(bundleSize) || bundleSize <= 0) {
          toast({
            title: "Bundle size required",
            description: "Enter how many items the bundle contains.",
            variant: "destructive"
          });
          return;
        }
        if (!Number.isFinite(bundlePrice) || bundlePrice <= 0) {
          toast({
            title: "Bundle price required",
            description: "Enter the bundle price.",
            variant: "destructive"
          });
          return;
        }
        if (bundleConfig.allowedProducts.length === 0) {
          toast({
            title: "Select allowed products",
            description: "Choose at least one product for this bundle.",
            variant: "destructive"
          });
          return;
        }
      }

      // Validate category is selected
      if (!formData.category_id || formData.category_id.trim() === '') {
        toast({
          title: "Category required",
          description: "Please select a category for this product.",
          variant: "destructive"
        });
        return;
      }

      const variantPrices = variants
        .map((variant) => Number(variant.price))
        .filter((price) => Number.isFinite(price));
      const derivedPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
      const bundlePrice = Number(bundleConfig.price);

      const parsedSellingPoints = Array.from(new Set(
        formData.selling_points
          .split('\n')
          .map(point => point.trim())
          .filter(Boolean)
      ));
      const resolvedImages = imageUrls.length > 0 ? imageUrls : [formData.image_url].filter(Boolean);

      const productData: Record<string, any> = {
        name: formData.title,
        description: formData.description,
        price: isBundle && Number.isFinite(bundlePrice) ? bundlePrice : (Number.isFinite(derivedPrice) ? derivedPrice : 0),
        stock: isBundle ? 0 : (Number.isFinite(stockValue) ? stockValue : 0),
        category: formData.category_id.trim(),
        image_url: resolvedImages[0],
        image_urls: resolvedImages,
        images: resolvedImages.map((url, index) => ({
          url,
          alt: formData.title || "Product image",
          isPrimary: index === 0
        })),
        is_featured: formData.is_featured !== undefined ? formData.is_featured : false,
        selling_points: parsedSellingPoints.length > 0 ? parsedSellingPoints : undefined,
        shipping_information: formData.shipping_information.trim() || undefined,
      };

      if (isBundle) {
        productData.productType = "bundle";
        productData.bundle = {
          size: Number(bundleConfig.size),
          price: Number(bundleConfig.price),
          allowedProducts: bundleConfig.allowedProducts,
          allowDuplicates: bundleConfig.allowDuplicates,
        };
      }

      // Always include discount fields to match API structure
      if (supportsDiscountType) {
        productData.discount_type = selectedDiscountType || 'percentage';
        if (selectedDiscountType === "percentage") {
          productData.discount = normalizedPercent;
          productData.discount_amount = 0;
        } else {
          productData.discount = 0;
          productData.discount_amount = normalizedAmount;
        }
      } else {
        // Default values to match curl command
        productData.discount = normalizedPercent;
        productData.discount_type = 'percentage';
        productData.discount_amount = 0;
      }

      let productId;
      let response;

      if (editingProduct) {
        response = await apiService.updateProduct(editingProduct._id, productData);
        if (!response.success) {
          throw new Error(response.message || "Failed to update product");
        }
        productId = editingProduct._id;
      } else {
        response = await apiService.createProduct(productData);
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to create product");
        }
        productId = response.data._id;
      }

      // Handle variants if any
      if (!isBundle && variants.length > 0 && productId) {
        // Delete existing variants if editing
        if (editingProduct) {
          // Get existing variants and delete them one by one
          const existingVariants = await apiService.getProductVariants(productId);
          if (existingVariants.success && existingVariants.data) {
            for (const variant of existingVariants.data) {
              await apiService.deleteProductVariant(productId, variant._id);
            }
          }
        }

        // Insert new variants
        for (const variant of variants) {
          await apiService.addProductVariant(productId, {
            name: variant.size,
            price: variant.price,
            stock: variant.stock_quantity
          });
        }
      }

      if (isBundle && editingProduct && productId) {
        const existingVariants = await apiService.getProductVariants(productId);
        if (existingVariants.success && existingVariants.data) {
          for (const variant of existingVariants.data) {
            await apiService.deleteProductVariant(productId, variant._id);
          }
        }
      }

      toast({
        title: "Success",
        description: `Product ${editingProduct ? 'updated' : 'created'} successfully`
      });

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error?.message ?? "Failed to save product",
        variant: "destructive"
      });
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      const isFeatured = product.isFeatured || product.is_featured || false;
      const response = await apiService.toggleFeaturedProducts(product._id, !isFeatured);

      if (!response.success) {
        throw new Error(response.message || "Failed to update product");
      }

      toast({
        title: "Success",
        description: `Product ${!isFeatured ? 'featured' : 'unfeatured'} successfully`
      });

      fetchProducts();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      });
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await apiService.deleteProduct(id);

      if (!response.success) {
        throw new Error(response.message || "Failed to delete product");
      }

      toast({
        title: "Success",
        description: "Product deleted successfully"
      });

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = async (product: Product) => {
    setEditingProduct(product);
    const isBundle = product.productType === "bundle";
    const derivedType: DiscountFormType =
      supportsDiscountType && (product.discount_type === "amount" || (!product.discount_type && (Number(product.discount_amount) || 0) > 0))
        ? "amount"
        : "percentage";
    
    // Get category ID from category object or string
    const categoryId = typeof product.category === 'object' ? product.category?._id : (product.category || '');
    
    // Get images from images array or image_url/image_urls
    const getImages = () => {
      if (product.images && product.images.length > 0) {
        return product.images.map((img: any) => typeof img === 'string' ? img : img?.url || '').filter(Boolean);
      }
      return product.image_urls || (product.image_url ? [product.image_url] : []);
    };
    
    setFormData({
      title: product.name || product.title || "",
      description: product.description || "",
      stock_quantity: (product.stock || product.stock_quantity || 0).toString(),
      category_id: categoryId,
      image_url: getImages()[0] || "",
      discountPercent: product.discount?.toString() || "0",
      discountAmount: supportsDiscountType && derivedType === "amount" ? (product.discount_amount?.toString() || "0") : "",
      discountType: derivedType,
      is_featured: product.isFeatured || product.is_featured || false,
      selling_points: (product.selling_points || []).join('\n'),
      shipping_information: product.shipping_information || "",
      productType: isBundle ? "bundle" : "product",
    });

    if (isBundle) {
      setBundleConfig({
        size: product.bundle?.size?.toString() || "",
        price: product.bundle?.price?.toString() || product.price?.toString() || "",
        allowDuplicates: product.bundle?.allowDuplicates ?? true,
        allowedProducts: product.bundle?.allowedProducts || [],
      });
    } else {
      setBundleConfig({
        size: "",
        price: "",
        allowDuplicates: true,
        allowedProducts: [],
      });
    }
    setBundleSearch("");
    
    // Load existing images
    setImageUrls(getImages());
    
    if (!isBundle) {
      // Use variants from product if available, otherwise fetch
      if (product.variants && product.variants.length > 0) {
        // Map variants from product object
        const mappedVariants = product.variants.map((v: any) => ({
          _id: v._id,
          size: v.name || v.size,
          price: v.price,
          stock_quantity: v.stock || v.stock_quantity || 0
        }));
        setVariants(mappedVariants);
      } else {
        // Fetch existing variants if not in product object
        try {
          const response = await apiService.getProductVariants(product._id);
          
          if (response.success && response.data) {
            // Map backend variant structure to frontend structure
            const mappedVariants = response.data.map((v: any) => ({
              _id: v._id,
              size: v.name || v.size,
              price: v.price,
              stock_quantity: v.stock || v.stock_quantity || 0
            }));
            setVariants(mappedVariants);
          }
        } catch (error) {
          console.error('Error loading variants:', error);
          setVariants([]);
        }
      }
    } else {
      setVariants([]);
    }
    
    setDialogOpen(true);
  };

  const openReviewDialog = (product: Product) => {
    setSelectedReviewProduct(product);
    setReviewForm({
      customer_name: "",
      email: "",
      rating: "5",
      review_text: "",
      is_verified: true,
    });
    setReviewDialogOpen(true);
  };

  const handleSaveReview = async () => {
    if (!selectedReviewProduct) return;

    const name = reviewForm.customer_name.trim();
    if (!name) {
      toast({
        title: "Name required",
        description: "Please provide the reviewer's name.",
        variant: "destructive",
      });
      return;
    }

    const ratingValue = Number.parseInt(reviewForm.rating, 10);
    if (Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      toast({
        title: "Invalid rating",
        description: "Rating must be between 1 and 5.",
        variant: "destructive",
      });
      return;
    }

    setSavingReview(true);
    try {
      const response = await apiService.createReview(selectedReviewProduct._id, {
        rating: ratingValue,
        comment: reviewForm.review_text.trim() || null,
        customer_name: name
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to add review");
      }

      toast({
        title: "Review added",
        description: `Review successfully added for ${selectedReviewProduct.name}.`,
      });

      setReviewDialogOpen(false);
      setSelectedReviewProduct(null);
    } catch (error: any) {
      console.error('Failed to create review', error);
      toast({
        title: "Error",
        description: error?.message || 'Failed to add review',
        variant: "destructive",
      });
    } finally {
      setSavingReview(false);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      title: "",
      description: "",
      stock_quantity: "",
      category_id: "",
      image_url: "",
      discountPercent: "",
      discountAmount: "",
      discountType: "percentage",
      is_featured: false,
      selling_points: "",
      shipping_information: "",
      productType: "product",
    });
    setImageUrls([]);
    setNewImageUrl("");
    setVariants([]);
    setBundleConfig({
      size: "",
      price: "",
      allowDuplicates: true,
      allowedProducts: [],
    });
    setBundleSearch("");
  };

  const addImageUrl = () => {
    if (newImageUrl.trim()) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const toggleAllowedProduct = (productId: string, checked: boolean) => {
    setBundleConfig((prev) => {
      const exists = prev.allowedProducts.includes(productId);
      if (checked && !exists) {
        return { ...prev, allowedProducts: [...prev.allowedProducts, productId] };
      }
      if (!checked && exists) {
        return { ...prev, allowedProducts: prev.allowedProducts.filter((id) => id !== productId) };
      }
      return prev;
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const response = await apiService.uploadProductImage(file);
        
        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to upload image");
        }

        return response.data.url || response.data.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImageUrls([...imageUrls, ...uploadedUrls]);

      toast({
        title: "Success",
        description: `Uploaded ${uploadedUrls.length} image(s) successfully`
      });
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload images",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (products.length === 0) {
      toast({ title: "No products", description: "There are no products to export yet." });
      return;
    }

    const worksheetData = products.map((product) => {
      const categoryName = typeof product.category === 'object' ? product.category?.name ?? "" : "";
      const images = product.images?.map((img: any) => typeof img === 'string' ? img : img?.url || '').filter(Boolean) || product.image_urls || [];
      const primaryImage = images[0] || product.image_url || '';
      
      return {
        ID: product._id,
        Title: product.name,
        Category: categoryName,
        Price: Math.round(Number(product.price ?? 0)),
        "Discount Type": product.discount_type ?? "percentage",
        "Discount %": product.discount ?? 0,
        "Discount Amount": product.discount_amount ?? 0,
        Stock: product.stock ?? 0,
        Featured: (product.isFeatured || product.is_featured) ? "Yes" : "No",
        "Primary Image": primaryImage,
        "Image URLs": images.join(", "),
      "Selling Points": (product.selling_points || []).join(" | "),
      "Shipping Information": product.shipping_information ?? "",
      "Variants": product.variants?.length ?? 0,
    };
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    const timestamp = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `products-${timestamp}.xlsx`);

    toast({ title: "Export ready", description: "Product list downloaded successfully." });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Products Management</h2>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, category, or ID"
            className="w-full sm:w-64"
          />
          <Button variant="outline" onClick={handleDownloadExcel} className="sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Download Excel
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="shadow-luxury sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Product name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Product Type</Label>
                  <RadioGroup
                    className="flex flex-col gap-2 sm:flex-row"
                    value={formData.productType}
                    onValueChange={(value) => {
                      const nextType = value as "product" | "bundle";
                      setFormData((prev) => ({
                        ...prev,
                        productType: nextType,
                        stock_quantity: nextType === "bundle" ? "0" : prev.stock_quantity,
                      }));
                      if (nextType === "bundle") {
                        setVariants([]);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="product" id="product-type-product" />
                      <Label htmlFor="product-type-product" className="font-normal">
                        Regular Product
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bundle" id="product-type-bundle" />
                      <Label htmlFor="product-type-bundle" className="font-normal">
                        Bundle
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    placeholder="0"
                    disabled={formData.productType === "bundle"}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>
                    Discount
                    {!supportsDiscountType && (
                      <span className="ml-1 text-xs text-muted-foreground">(fixed amount requires DB update)</span>
                    )}
                  </Label>
                  <RadioGroup
                    className="flex flex-col gap-2 sm:flex-row"
                    value={formData.discountType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, discountType: value as DiscountFormType })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="discount-percentage" />
                      <Label htmlFor="discount-percentage" className="font-normal">
                        Percentage (%)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="amount" id="discount-amount" disabled={!supportsDiscountType} />
                      <Label htmlFor="discount-amount" className="font-normal">
                        Fixed Amount (£)
                      </Label>
                    </div>
                  </RadioGroup>
                  {formData.discountType === "percentage" ? (
                    <Input
                      id="discount-percentage-value"
                      type="number"
                      step="0.01"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                      placeholder="0"
                    />
                  ) : (
                    <Input
                      id="discount-amount-value"
                      type="number"
                      step="0.01"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                      placeholder="0"
                      disabled={!supportsDiscountType}
                    />
                  )}
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label>Mark as Featured Product</Label>
                </div>
              </div>

              {/* Multiple Images Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Product Images</Label>
                
                {/* File Upload */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="image-upload"
                    disabled={uploading}
                  />
                  <label 
                    htmlFor="image-upload" 
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {uploading ? "Uploading..." : "Click to upload images or drag and drop"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG, JPEG up to 10MB each
                    </span>
                  </label>
                </div>

                {/* OR divider */}
                <div className="flex items-center space-x-2">
                  <hr className="flex-1" />
                  <span className="text-xs text-muted-foreground px-2">OR</span>
                  <hr className="flex-1" />
                </div>
                
                {/* Add new image URL */}
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Enter image URL..."
                    className="flex-1"
                  />
                  <Button type="button" onClick={addImageUrl} disabled={!newImageUrl.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Display existing images */}
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => removeImageUrl(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formData.productType === "bundle" && (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-semibold">Bundle Configuration</h4>
                      <p className="text-sm text-muted-foreground">Define the bundle size and allowed products.</p>
                    </div>
                    <Badge variant="outline">Selected {bundleConfig.allowedProducts.length}</Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="bundle-size">Bundle Size</Label>
                      <Input
                        id="bundle-size"
                        type="number"
                        value={bundleConfig.size}
                        onChange={(event) => setBundleConfig((prev) => ({ ...prev, size: event.target.value }))}
                        placeholder="10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bundle-price">Bundle Price</Label>
                      <Input
                        id="bundle-price"
                        type="number"
                        value={bundleConfig.price}
                        onChange={(event) => setBundleConfig((prev) => ({ ...prev, price: event.target.value }))}
                        placeholder="50"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">Allow Duplicates</p>
                        <p className="text-xs text-muted-foreground">Same product can repeat.</p>
                      </div>
                      <Switch
                        checked={bundleConfig.allowDuplicates}
                        onCheckedChange={(checked) => setBundleConfig((prev) => ({ ...prev, allowDuplicates: checked }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Allowed Products</Label>
                      <span className="text-xs text-muted-foreground">{bundleConfig.allowedProducts.length} selected</span>
                    </div>
                    <Input
                      value={bundleSearch}
                      onChange={(event) => setBundleSearch(event.target.value)}
                      placeholder="Search products by name, category, or ID"
                    />
                    <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
                      {filteredBundleProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No products match your search.</p>
                      ) : (
                        filteredBundleProducts.map((product) => {
                          const categoryName = typeof product.category === "object" ? product.category?.name ?? "" : "";
                          const isChecked = bundleConfig.allowedProducts.includes(product._id);
                          return (
                            <label
                              key={product._id}
                              className="flex items-center justify-between rounded-md border border-transparent p-2 transition hover:border-muted/50"
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => toggleAllowedProduct(product._id, Boolean(checked))}
                                />
                                <div>
                                  <p className="text-sm font-medium">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {categoryName ? `${categoryName} • ` : ""}{product._id}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                £{Number(product.price ?? 0).toFixed(2)}
                              </Badge>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Product Variants Section */}
              {formData.productType !== "bundle" && (
                <ProductVariantsManagement
                  variants={variants}
                  onChange={setVariants}
                />
              )}
              {formData.productType === "bundle" && (
                <p className="text-sm text-muted-foreground">
                  Bundle products do not require size variants.
                </p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="selling_points">Key Highlights</Label>
                  <Textarea
                    id="selling_points"
                    value={formData.selling_points}
                    onChange={(e) => setFormData({ ...formData, selling_points: e.target.value })}
                    placeholder="FREE gift packing with every order\n14 Days easy return\nInventory on the way"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">Enter one highlight per line. Leave blank to hide.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping_information">Shipping Information</Label>
                  <Textarea
                    id="shipping_information"
                    value={formData.shipping_information}
                    onChange={(e) => setFormData({ ...formData, shipping_information: e.target.value })}
                    placeholder="Delivery within 2-3 business days. Free shipping on orders above £2500."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">Optional additional shipping notes shown in the product accordion.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
                  id="description"
                  value={formData.description}
                  onChange={(html) => setFormData({ ...formData, description: html })}
                  placeholder="Product description..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProduct}>
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Review{selectedReviewProduct ? ` – ${selectedReviewProduct.title}` : ''}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reviewer-name">Reviewer Name</Label>
              <Input
                id="reviewer-name"
                value={reviewForm.customer_name}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, customer_name: event.target.value }))}
                placeholder="Jane Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewer-email">Reviewer Email (optional)</Label>
              <Input
                id="reviewer-email"
                type="email"
                value={reviewForm.email}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="jane@example.com"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="review-rating">Rating</Label>
                <Select
                  value={reviewForm.rating}
                  onValueChange={(value) => setReviewForm((prev) => ({ ...prev, rating: value }))}
                >
                  <SelectTrigger id="review-rating">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {["5", "4", "3", "2", "1"].map((value) => (
                      <SelectItem key={value} value={value}>
                        {value} Star{value === "1" ? '' : 's'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-verified">Mark as verified</Label>
                <div className="flex items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-2">
                  <span className="text-sm text-muted-foreground">Show badge on product page</span>
                  <Switch
                    id="review-verified"
                    checked={reviewForm.is_verified}
                    onCheckedChange={(checked) => setReviewForm((prev) => ({ ...prev, is_verified: checked }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-text">Review Details</Label>
              <Textarea
                id="review-text"
                value={reviewForm.review_text}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, review_text: event.target.value }))}
                placeholder="Share the review details..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReview} disabled={savingReview}>
              {savingReview ? 'Saving...' : 'Add Review'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {filteredProducts.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center text-muted-foreground">
              No products match your search.
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product) => {
            // Get the first image from images array or use image_url
            const getProductImage = () => {
              if (product.images && product.images.length > 0) {
                const firstImage = product.images[0];
                return typeof firstImage === 'string' ? firstImage : firstImage?.url || '';
              }
              return product.image_url || product.image_urls?.[0] || '';
            };
            
            const productImage = getProductImage();
            const categoryName = typeof product.category === 'object' ? product.category?.name : '';
            const isFeatured = product.isFeatured || product.is_featured || false;
            const productStock = product.stock || 0;
            const variantsCount = product.variants?.length || 0;
            
            return (
              <Card key={product._id} className="shadow-soft hover:shadow-luxury transition-shadow overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-stretch justify-between">
                    {/* Left: Image block, similar to category card */}
                    <div className="w-28 md:w-32 lg:w-40 flex-shrink-0">
                      <div className="h-24 md:h-28 lg:h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to default icon on error
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const icon = document.createElement('div');
                                icon.className = 'flex items-center justify-center';
                                icon.innerHTML = '<svg class="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-5.5L11 5H6a2 2 0 00-2 2z" /></svg>';
                                parent.appendChild(icon);
                              }
                            }}
                          />
                        ) : (
                          <Package className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Right: Details */}
                    <div className="flex-1 min-w-0 pl-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1">
                          <h3 className="font-semibold truncate">{product.name}</h3>
                          {product.productType === "bundle" && (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                              Bundle
                            </Badge>
                          )}
                          {isFeatured && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {product.isBestSeller && (
                            <Badge variant="default" className="bg-orange-500">
                              Best Seller
                            </Badge>
                          )}
                          {product.isNew && (
                            <Badge variant="default" className="bg-blue-500">
                              New
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground select-all mb-1">
                          ID: {product._id}
                        </p>

                        {/* Tag row: category, price, variants, stock */}
                        <div className="flex flex-wrap gap-2 mb-2 text-xs">
                          {categoryName && (
                            <Badge variant="outline" className="text-xs">
                              Category: {categoryName}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Price: £{Number(product.price ?? 0).toFixed(2)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Stock: {productStock}
                          </Badge>
                          {variantsCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {variantsCount} variant{variantsCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewDialog(product)}
                          title="Add Review"
                        >
                          <MessageSquarePlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleFeatured(product)}
                          title={isFeatured ? "Remove from Featured" : "Mark as Featured"}
                        >
                          {isFeatured ? (
                            <StarOff className="h-4 w-4" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                          title="Edit Product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProduct(product._id)}
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
