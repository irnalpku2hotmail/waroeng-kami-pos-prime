
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProductFormProps {
  product?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const ProductForm = ({ product, onSuccess, onCancel }: ProductFormProps) => {
  const queryClient = useQueryClient();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    category_id: '',
    unit_id: '',
    supplier_id: '',
    base_price: 0,
    selling_price: 0,
    current_stock: 0,
    min_stock: 10,
    min_quantity: 1,
    loyalty_points: 1,
    is_active: true,
    image_url: ''
  });

  const [priceVariants, setPriceVariants] = useState([
    { name: 'Tier 1', minimum_quantity: 10, price: 0 },
    { name: 'Tier 2', minimum_quantity: 50, price: 0 },
    { name: 'Tier 3', minimum_quantity: 100, price: 0 }
  ]);

  const [unitConversions, setUnitConversions] = useState([
    { from_unit: '', to_unit: '', conversion_factor: 1 }
  ]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        barcode: product.barcode || '',
        category_id: product.category_id || '',
        unit_id: product.unit_id || '',
        supplier_id: product.supplier_id || '',
        base_price: product.base_price || 0,
        selling_price: product.selling_price || 0,
        current_stock: product.current_stock || 0,
        min_stock: product.min_stock || 10,
        min_quantity: product.min_quantity || 1,
        loyalty_points: product.loyalty_points || 1,
        is_active: product.is_active ?? true,
        image_url: product.image_url || ''
      });

      if (product.image_url) {
        setImagePreview(product.image_url);
      }

      // Set price variants
      setPriceVariants([
        { 
          name: 'Tier 1', 
          minimum_quantity: product.tier1_quantity || 10, 
          price: product.tier1_price || 0 
        },
        { 
          name: 'Tier 2', 
          minimum_quantity: product.tier2_quantity || 50, 
          price: product.tier2_price || 0 
        },
        { 
          name: 'Tier 3', 
          minimum_quantity: product.tier3_quantity || 100, 
          price: product.tier3_price || 0 
        }
      ]);
    }
  }, [product]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase.from('units').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('*');
      if (error) throw error;
      return data;
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.image_url;

    setIsUploading(true);
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile);

    if (uploadError) {
      toast({ title: 'Error uploading image', description: uploadError.message, variant: 'destructive' });
      setIsUploading(false);
      return formData.image_url;
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
    setIsUploading(false);
    return data.publicUrl;
  };

  const createProduct = useMutation({
    mutationFn: async (data: any) => {
      const imageUrl = await uploadImage();
      
      const productData = {
        ...data,
        image_url: imageUrl,
        tier1_quantity: priceVariants[0].minimum_quantity > 0 ? priceVariants[0].minimum_quantity : null,
        tier1_price: priceVariants[0].price > 0 ? priceVariants[0].price : null,
        tier2_quantity: priceVariants[1].minimum_quantity > 0 ? priceVariants[1].minimum_quantity : null,
        tier2_price: priceVariants[1].price > 0 ? priceVariants[1].price : null,
        tier3_quantity: priceVariants[2].minimum_quantity > 0 ? priceVariants[2].minimum_quantity : null,
        tier3_price: priceVariants[2].price > 0 ? priceVariants[2].price : null,
      };

      if (product) {
        const { data: updatedProduct, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .select()
          .single();
        if (error) throw error;
        return updatedProduct;
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        if (error) throw error;

        // Create unit conversions if any
        const validConversions = unitConversions.filter(
          conv => conv.from_unit && conv.to_unit && conv.conversion_factor > 0
        );
        
        if (validConversions.length > 0) {
          const conversionsData = validConversions.map(conv => ({
            product_id: newProduct.id,
            from_unit: conv.from_unit,
            to_unit: conv.to_unit,
            conversion_factor: conv.conversion_factor
          }));

          await supabase.from('unit_conversions').insert(conversionsData);
        }

        return newProduct;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Success', description: 'Product saved successfully' });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct.mutate(formData);
  };

  const addUnitConversion = () => {
    setUnitConversions([...unitConversions, { from_unit: '', to_unit: '', conversion_factor: 1 }]);
  };

  const removeUnitConversion = (index: number) => {
    setUnitConversions(unitConversions.filter((_, i) => i !== index));
  };

  const updateUnitConversion = (index: number, field: string, value: any) => {
    const updated = unitConversions.map((conv, i) => 
      i === index ? { ...conv, [field]: value } : conv
    );
    setUnitConversions(updated);
  };

  const updatePriceVariant = (index: number, field: string, value: any) => {
    const updated = priceVariants.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    );
    setPriceVariants(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Product Image</Label>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="flex-1"
            />
            {imagePreview && (
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-20 h-20 object-cover rounded border"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unit</Label>
            <Select
              value={formData.unit_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {units?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name} ({unit.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select
              value={formData.supplier_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pricing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="base_price">Base Price *</Label>
            <Input
              id="base_price"
              type="number"
              value={formData.base_price}
              onChange={(e) => setFormData(prev => ({ ...prev, base_price: Number(e.target.value) }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="selling_price">Selling Price *</Label>
            <Input
              id="selling_price"
              type="number"
              value={formData.selling_price}
              onChange={(e) => setFormData(prev => ({ ...prev, selling_price: Number(e.target.value) }))}
              required
            />
          </div>
        </div>

        {/* Price Variants */}
        <div className="space-y-3">
          <Label>Price Variants (Wholesale)</Label>
          {priceVariants.map((variant, index) => (
            <div key={index} className="grid grid-cols-3 gap-2 p-3 border rounded">
              <div>
                <Label className="text-sm">{variant.name}</Label>
                <Input
                  type="number"
                  placeholder="Min Quantity"
                  value={variant.minimum_quantity}
                  onChange={(e) => updatePriceVariant(index, 'minimum_quantity', Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-sm">Price</Label>
                <Input
                  type="number"
                  placeholder="Price"
                  value={variant.price}
                  onChange={(e) => updatePriceVariant(index, 'price', Number(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <span className="text-sm text-gray-500">
                  {variant.minimum_quantity > 0 && variant.price > 0 
                    ? `${variant.minimum_quantity}+ items = Rp ${variant.price.toLocaleString()}`
                    : 'Not set'
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Stock & Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Stock & Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="current_stock">Current Stock</Label>
            <Input
              id="current_stock"
              type="number"
              value={formData.current_stock}
              onChange={(e) => setFormData(prev => ({ ...prev, current_stock: Number(e.target.value) }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="min_stock">Minimum Stock</Label>
            <Input
              id="min_stock"
              type="number"
              value={formData.min_stock}
              onChange={(e) => setFormData(prev => ({ ...prev, min_stock: Number(e.target.value) }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="loyalty_points">Loyalty Points</Label>
            <Input
              id="loyalty_points"
              type="number"
              value={formData.loyalty_points}
              onChange={(e) => setFormData(prev => ({ ...prev, loyalty_points: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: Boolean(checked) }))}
          />
          <Label htmlFor="is_active">Active Product</Label>
        </div>
      </div>

      <Separator />

      {/* Unit Conversions */}
      {!product && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Unit Conversions</h3>
            <Button type="button" variant="outline" onClick={addUnitConversion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Conversion
            </Button>
          </div>
          
          {unitConversions.map((conversion, index) => (
            <div key={index} className="grid grid-cols-4 gap-2 p-3 border rounded">
              <div>
                <Label className="text-sm">From Unit</Label>
                <Input
                  placeholder="kg"
                  value={conversion.from_unit}
                  onChange={(e) => updateUnitConversion(index, 'from_unit', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">To Unit</Label>
                <Input
                  placeholder="gram"
                  value={conversion.to_unit}
                  onChange={(e) => updateUnitConversion(index, 'to_unit', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">Factor</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="1000"
                  value={conversion.conversion_factor}
                  onChange={(e) => updateUnitConversion(index, 'conversion_factor', Number(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeUnitConversion(index)}
                  disabled={unitConversions.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createProduct.isPending || isUploading}>
          {createProduct.isPending || isUploading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
