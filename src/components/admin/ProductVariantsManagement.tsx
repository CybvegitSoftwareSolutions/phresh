import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductVariant {
  id?: string;
  size: string;
  price: number;
  stock_quantity: number;
}

interface ProductVariantsManagementProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

const ProductVariantsManagement = ({ variants, onChange }: ProductVariantsManagementProps) => {
  const [newVariant, setNewVariant] = useState<ProductVariant>({
    size: "",
    price: 0,
    stock_quantity: 0
  });

  const addVariant = () => {
    if (!newVariant.size || newVariant.price <= 0) return;
    
    const variant = {
      ...newVariant,
      id: `temp_${Date.now()}` // Temporary ID for new variants
    };
    
    onChange([...variants, variant]);
    setNewVariant({ size: "", price: 0, stock_quantity: 0 });
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value
    };
    onChange(updatedVariants);
  };

  const removeVariant = (index: number) => {
    const updatedVariants = variants.filter((_, i) => i !== index);
    onChange(updatedVariants);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Product Sizes & Pricing</Label>
        <Badge variant="outline" className="text-xs">
          {variants.length} variant{variants.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Existing Variants */}
      {variants.length > 0 && (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <Card key={variant.id || index} className="shadow-soft">
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-3 items-end">
                  <div>
                    <Label className="text-sm">Size</Label>
                    <Input
                      value={variant.size}
                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      placeholder="e.g., 50ml"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Price (Rs)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Stock</Label>
                    <Input
                      type="number"
                      min="0"
                      value={variant.stock_quantity}
                      onChange={(e) => updateVariant(index, 'stock_quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeVariant(index)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Variant */}
      <Card className="shadow-soft border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Add New Size</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-sm">Size</Label>
              <Input
                value={newVariant.size}
                onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                placeholder="e.g., 100ml"
              />
            </div>
            <div>
              <Label className="text-sm">Price (Rs)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newVariant.price}
                onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label className="text-sm">Stock</Label>
              <Input
                type="number"
                min="0"
                value={newVariant.stock_quantity}
                onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <Button
                onClick={addVariant}
                disabled={!newVariant.size || newVariant.price <= 0}
                className="gradient-luxury"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {variants.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No size variants added yet.</p>
          <p className="text-sm">Add different sizes and prices for this product above.</p>
        </div>
      )}
    </div>
  );
};

export default ProductVariantsManagement;
