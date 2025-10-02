"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { PartnerAccessGuard } from "@/components/partner-access-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Wrench, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Truck,
  AlertTriangle,
  Star,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface SupplyProduct {
  id: string;
  name: string;
  description: string;
  category: 'office_supplies' | 'hardware' | 'tools' | 'electronics' | 'safety' | 'cleaning' | 'industrial';
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  brand?: string;
  model?: string;
  isAvailable: boolean;
  isInStock: boolean;
  supplier?: string;
  sku: string;
  weight?: number; // in kg
  dimensions?: string; // L x W x H
  warranty?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SuppliesProductsPage() {
  const { user, userRole, partnerData } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<SupplyProduct[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplyProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stockQuantity: '',
    minStockLevel: '',
    unit: '',
    brand: '',
    model: '',
    supplier: '',
    sku: '',
    weight: '',
    dimensions: '',
    warranty: '',
    notes: ''
  });

  // Mock data for supply products
  useEffect(() => {
    const loadProducts = async () => {
      if (user && userRole === 'partner') {
        try {
          setLoading(true);
          
          // Mock data for supply products
          const mockProducts: SupplyProduct[] = [
            {
              id: "SUP-001",
              name: "A4 Copy Paper (Ream)",
              description: "High-quality white copy paper, 20lb weight, 500 sheets per ream",
              category: "office_supplies",
              price: 250,
              stockQuantity: 50,
              minStockLevel: 10,
              unit: "ream",
              brand: "Canon",
              isAvailable: true,
              isInStock: true,
              supplier: "Office Depot",
              sku: "A4-CAN-500",
              weight: 2.5,
              dimensions: "21.6 x 27.9 x 5.1 cm",
              warranty: "N/A",
              notes: "Best seller, always keep in stock",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "SUP-002",
              name: "Black Ink Cartridge",
              description: "Compatible black ink cartridge for HP LaserJet printers",
              category: "office_supplies",
              price: 1200,
              stockQuantity: 5,
              minStockLevel: 3,
              unit: "piece",
              brand: "HP",
              model: "CF410A",
              isAvailable: true,
              isInStock: true,
              supplier: "Tech Supplies Inc",
              sku: "HP-CF410A-BLK",
              weight: 0.3,
              dimensions: "10 x 5 x 3 cm",
              warranty: "1 year",
              notes: "High yield cartridge, prints up to 1200 pages",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "SUP-003",
              name: "Cordless Drill",
              description: "18V cordless drill with lithium-ion battery and LED light",
              category: "tools",
              price: 3500,
              stockQuantity: 2,
              minStockLevel: 1,
              unit: "piece",
              brand: "DeWalt",
              model: "DCD791D2",
              isAvailable: true,
              isInStock: true,
              supplier: "Hardware Central",
              sku: "DW-DCD791D2",
              weight: 1.8,
              dimensions: "25 x 8 x 20 cm",
              warranty: "3 years",
              notes: "Professional grade, includes 2 batteries and charger",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "SUP-004",
              name: "Safety Helmet",
              description: "ANSI Z89.1 Type I Class C safety helmet with adjustable suspension",
              category: "safety",
              price: 450,
              stockQuantity: 0,
              minStockLevel: 5,
              unit: "piece",
              brand: "3M",
              model: "H-700",
              isAvailable: false,
              isInStock: false,
              supplier: "Safety First Supply",
              sku: "3M-H700-WHT",
              weight: 0.4,
              dimensions: "30 x 25 x 15 cm",
              warranty: "2 years",
              notes: "Out of stock - urgent reorder needed",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "SUP-005",
              name: "Industrial Cleaning Solution",
              description: "Concentrated multi-purpose cleaner for industrial use",
              category: "cleaning",
              price: 800,
              stockQuantity: 12,
              minStockLevel: 5,
              unit: "liter",
              brand: "CleanPro",
              isAvailable: true,
              isInStock: true,
              supplier: "Cleaning Solutions Co",
              sku: "CP-IND-1L",
              weight: 1.2,
              dimensions: "10 x 10 x 25 cm",
              warranty: "N/A",
              notes: "Dilute 1:10 with water for regular cleaning",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            }
          ];
          
          setProducts(mockProducts);
        } catch (error) {
          console.error('Error loading products:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load supply products. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadProducts();
  }, [user, userRole, toast]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'office_supplies': return 'Office Supplies';
      case 'hardware': return 'Hardware';
      case 'tools': return 'Tools';
      case 'electronics': return 'Electronics';
      case 'safety': return 'Safety Equipment';
      case 'cleaning': return 'Cleaning Supplies';
      case 'industrial': return 'Industrial';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'office_supplies': return 'bg-blue-100 text-blue-800';
      case 'hardware': return 'bg-gray-100 text-gray-800';
      case 'tools': return 'bg-orange-100 text-orange-800';
      case 'electronics': return 'bg-purple-100 text-purple-800';
      case 'safety': return 'bg-red-100 text-red-800';
      case 'cleaning': return 'bg-green-100 text-green-800';
      case 'industrial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStockStatus = (product: SupplyProduct) => {
    if (product.stockQuantity === 0) {
      return { status: 'out_of_stock', color: 'text-red-600', icon: XCircle };
    } else if (product.stockQuantity <= product.minStockLevel) {
      return { status: 'low_stock', color: 'text-yellow-600', icon: AlertTriangle };
    } else {
      return { status: 'in_stock', color: 'text-green-600', icon: CheckCircle };
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newProduct: SupplyProduct = {
        id: editingProduct ? editingProduct.id : `SUP-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        category: formData.category as any,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        minStockLevel: parseInt(formData.minStockLevel),
        unit: formData.unit,
        brand: formData.brand,
        model: formData.model,
        isAvailable: true,
        isInStock: parseInt(formData.stockQuantity) > 0,
        supplier: formData.supplier,
        sku: formData.sku,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        dimensions: formData.dimensions,
        warranty: formData.warranty,
        notes: formData.notes,
        createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        setProducts(prev => prev.map(product => 
          product.id === editingProduct.id ? newProduct : product
        ));
        toast({
          title: "Product Updated",
          description: "Supply product has been updated successfully.",
        });
      } else {
        setProducts(prev => [...prev, newProduct]);
        toast({
          title: "Product Added",
          description: "New supply product has been added successfully.",
        });
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        stockQuantity: '',
        minStockLevel: '',
        unit: '',
        brand: '',
        model: '',
        supplier: '',
        sku: '',
        weight: '',
        dimensions: '',
        warranty: '',
        notes: ''
      });
      setShowAddForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save product. Please try again.",
      });
    }
  };

  const handleEdit = (product: SupplyProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      stockQuantity: product.stockQuantity.toString(),
      minStockLevel: product.minStockLevel.toString(),
      unit: product.unit,
      brand: product.brand || '',
      model: product.model || '',
      supplier: product.supplier || '',
      sku: product.sku,
      weight: product.weight?.toString() || '',
      dimensions: product.dimensions || '',
      warranty: product.warranty || '',
      notes: product.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId: string) => {
    try {
      setProducts(prev => prev.filter(product => product.id !== productId));
      toast({
        title: "Product Deleted",
        description: "Supply product has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product. Please try again.",
      });
    }
  };

  const toggleProductAvailability = async (productId: string) => {
    try {
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, isAvailable: !product.isAvailable, updatedAt: new Date().toISOString() }
          : product
      ));
      
      const product = products.find(p => p.id === productId);
      toast({
        title: "Availability Updated",
        description: `Product ${product?.name} has been ${product?.isAvailable ? 'made unavailable' : 'made available'}.`,
      });
    } catch (error) {
      console.error('Error updating product availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update product availability. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PartnerAccessGuard>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Supplies & Products</h1>
            <p className="text-muted-foreground">
              Manage your supplies and hardware products for customer orders
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Add/Edit Product Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </CardTitle>
              <CardDescription>
                {editingProduct ? 'Update the supply product details' : 'Create a new supply product for your customers'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., A4 Copy Paper (Ream)"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office_supplies">Office Supplies</SelectItem>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="tools">Tools</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="safety">Safety Equipment</SelectItem>
                        <SelectItem value="cleaning">Cleaning Supplies</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the product specifications and features..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (PHP) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="250"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                      placeholder="50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStockLevel">Min Stock Level *</Label>
                    <Input
                      id="minStockLevel"
                      type="number"
                      value={formData.minStockLevel}
                      onChange={(e) => handleInputChange('minStockLevel', e.target.value)}
                      placeholder="10"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      placeholder="piece, ream, liter, kg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="Canon, HP, DeWalt"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      placeholder="CF410A, DCD791D2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => handleInputChange('supplier', e.target.value)}
                      placeholder="Office Depot, Tech Supplies Inc"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="A4-CAN-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="2.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input
                      id="dimensions"
                      value={formData.dimensions}
                      onChange={(e) => handleInputChange('dimensions', e.target.value)}
                      placeholder="21.6 x 27.9 x 5.1 cm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warranty">Warranty</Label>
                    <Input
                      id="warranty"
                      value={formData.warranty}
                      onChange={(e) => handleInputChange('warranty', e.target.value)}
                      placeholder="1 year, 3 years, N/A"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes, special handling instructions, or supplier information..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingProduct(null);
                      setFormData({
                        name: '',
                        description: '',
                        category: '',
                        price: '',
                        stockQuantity: '',
                        minStockLevel: '',
                        unit: '',
                        brand: '',
                        model: '',
                        supplier: '',
                        sku: '',
                        weight: '',
                        dimensions: '',
                        warranty: '',
                        notes: ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Products List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const stockStatus = getStockStatus(product);
            const StatusIcon = stockStatus.icon;
            
            return (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(product.category)}>
                          {getCategoryLabel(product.category)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {product.sku}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${stockStatus.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{formatCurrency(product.price)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Stock: {product.stockQuantity} {product.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Min Level: {product.minStockLevel} {product.unit}
                      </span>
                    </div>
                  </div>

                  {(product.brand || product.model) && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Product Details:</p>
                      <p className="text-sm text-muted-foreground">
                        {product.brand && `Brand: ${product.brand}`}
                        {product.brand && product.model && ' • '}
                        {product.model && `Model: ${product.model}`}
                      </p>
                    </div>
                  )}

                  {product.supplier && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Supplier:</p>
                      <p className="text-sm text-muted-foreground">{product.supplier}</p>
                    </div>
                  )}

                  {(product.weight || product.dimensions) && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Physical Specs:</p>
                      <p className="text-sm text-muted-foreground">
                        {product.weight && `Weight: ${product.weight}kg`}
                        {product.weight && product.dimensions && ' • '}
                        {product.dimensions && `Dimensions: ${product.dimensions}`}
                      </p>
                    </div>
                  )}

                  {product.warranty && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Warranty:</p>
                      <p className="text-sm text-muted-foreground">{product.warranty}</p>
                    </div>
                  )}

                  {product.notes && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Notes:</p>
                      <p className="text-sm text-muted-foreground">{product.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleProductAvailability(product.id)}
                    >
                      {product.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {products.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first supply product to begin accepting orders.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PartnerAccessGuard>
  );
}
