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
import { Package, Plus, Edit2, Trash2, Star, StarOff, X, Upload, Loader2, MessageSquarePlus, Download } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import ProductVariantsManagement from "./ProductVariantsManagement";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import * as XLSX from "xlsx";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  is_featured: boolean;
  image_url: string;
  image_urls: string[];
  discount: number | null;
  discount_amount?: number | null;
  discount_type?: "percentage" | "amount" | null;
  category: string;
  selling_points?: string[] | null;
  shipping_information?: string | null;
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
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
  });
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [variants, setVariants] = useState<ProductVariant[]>([]);
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
        const categoryName = product.categories?.name ?? "";
        return (
          product.title.toLowerCase().includes(normalizedSearch) ||
          categoryName.toLowerCase().includes(normalizedSearch) ||
          product.id.toLowerCase().includes(normalizedSearch)
        );
      })
    : products;

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
      const response = await apiService.getAllProducts();
      console.log('Products response:', response);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to fetch products");
      }

      // Handle different possible data structures
      const productsData = response.data.products || response.data.data || response.data;
      const products = Array.isArray(productsData) ? productsData : [];
      
      // Transform products to match expected structure
      const transformedProducts = products.map((product: any) => ({
        _id: product._id || product.id,
        name: product.name || product.title,
        title: product.title || product.name,
        description: product.description || '',
        price: product.price || 0,
        stock: product.stock || product.stock_quantity || 0,
        is_featured: product.is_featured || false,
        image_url: product.image_url || product.images?.[0]?.url || '',
        image_urls: product.image_urls || product.images?.map((img: any) => img.url || img) || [],
        discount: product.discount || null,
        discount_amount: product.discount_amount || null,
        discount_type: product.discount_type || null,
        category: product.category?._id || product.category || product.category_id || '',
        selling_points: product.selling_points || null,
        shipping_information: product.shipping_information || null,
        tags: product.tags || null,
        createdAt: product.createdAt || product.created_at || '',
        updatedAt: product.updatedAt || product.updated_at || ''
      }));
      
      setProducts(transformedProducts);

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
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
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

      if (selectedDiscountType === "amount" && !supportsDiscountType) {
        toast({
          title: "Fixed amount discount unavailable",
          description: "Fixed amount discounts are now supported. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (variants.length === 0) {
        toast({
          title: "Variants required",
          description: "Please add at least one size with a price before saving.",
          variant: "destructive"
        });
        return;
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

      const parsedSellingPoints = Array.from(new Set(
        formData.selling_points
          .split('\n')
          .map(point => point.trim())
          .filter(Boolean)
      ));

      const productData: Record<string, any> = {
        name: formData.title,
        description: formData.description,
        price: Number.isFinite(derivedPrice) ? derivedPrice : 0,
        stock: Number.isFinite(stockValue) ? stockValue : 0,
        category: formData.category_id.trim(),
        image_url: imageUrls[0] || formData.image_url,
        image_urls: imageUrls.length > 0 ? imageUrls : [formData.image_url].filter(Boolean),
        is_featured: formData.is_featured,
        selling_points: parsedSellingPoints.length ? parsedSellingPoints : null,
        shipping_information: formData.shipping_information.trim() || null,
      };

      if (supportsDiscountType) {
        productData.discount_type = selectedDiscountType;
        if (selectedDiscountType === "percentage") {
          productData.discount = normalizedPercent;
          productData.discount_amount = 0;
        } else {
          productData.discount = 0;
          productData.discount_amount = normalizedAmount;
        }
      } else {
        productData.discount = normalizedPercent;
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
      if (variants.length > 0 && productId) {
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
      const response = await apiService.toggleFeaturedProducts(product._id, !product.is_featured);

      if (!response.success) {
        throw new Error(response.message || "Failed to update product");
      }

      toast({
        title: "Success",
        description: `Product ${!product.is_featured ? 'featured' : 'unfeatured'} successfully`
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
    const derivedType: DiscountFormType =
      supportsDiscountType && (product.discount_type === "amount" || (!product.discount_type && (Number(product.discount_amount) || 0) > 0))
        ? "amount"
        : "percentage";
    setFormData({
      title: product.title,
      description: product.description || "",
      stock_quantity: product.stock_quantity?.toString() || "0",
      category_id: product.category_id || "",
      image_url: product.image_url || "",
      discountPercent: product.discount?.toString() || "0",
      discountAmount: supportsDiscountType && derivedType === "amount" ? (product.discount_amount?.toString() || "0") : "",
      discountType: derivedType,
      is_featured: product.is_featured,
      selling_points: (product.selling_points || []).join('\n'),
      shipping_information: product.shipping_information || "",
    });
    
    // Load existing images and variants
    setImageUrls(product.image_urls || [product.image_url].filter(Boolean));
    
    // Fetch existing variants
    try {
      const response = await apiService.getProductVariants(product._id);
      
      if (response.success && response.data) {
        // Map backend variant structure to frontend structure
        const mappedVariants = response.data.map((v: any) => ({
          _id: v._id,
          size: v.name || v.size,
          price: v.price,
          stock_quantity: v.stock || v.stock_quantity
        }));
        setVariants(mappedVariants);
      }
    } catch (error) {
      console.error('Error loading variants:', error);
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
    });
    setImageUrls([]);
    setNewImageUrl("");
    setVariants([]);
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

    const worksheetData = products.map((product) => ({
      ID: product.id,
      Title: product.title,
      Category: product.categories?.name ?? "",
      Price: Math.round(Number(product.price ?? 0)),
      "Discount Type": product.discount_type ?? "percentage",
      "Discount %": product.discount ?? 0,
      "Discount Amount": product.discount_amount ?? 0,
      Stock: product.stock_quantity ?? 0,
      Featured: product.is_featured ? "Yes" : "No",
      "Primary Image": product.image_url ?? "",
      "Image URLs": (product.image_urls || []).join(", "),
      "Selling Points": (product.selling_points || []).join(" | "),
      "Shipping Information": product.shipping_information ?? "",
    }));

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
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    placeholder="0"
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
                        Fixed Amount (Rs)
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

              {/* Product Variants Section */}
              <ProductVariantsManagement
                variants={variants}
                onChange={setVariants}
              />
              
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
                    placeholder="Delivery within 2-3 business days. Free shipping on orders above Rs. 2500."
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
          filteredProducts.map((product) => (
            <Card key={product.id} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{product.title}</h3>
                        {product.is_featured && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground select-all">ID: {product.id}</p>
                      <p className="text-sm text-muted-foreground">{product.categories?.name}</p>
                      <p className="text-sm font-medium">Rs {Number(product.price ?? 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Stock: {product.stock_quantity}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReviewDialog(product)}
                    >
                      <MessageSquarePlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFeatured(product)}
                    >
                      {product.is_featured ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(product)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
