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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Utensils, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Users,
  Clock,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface FoodProduct {
  id: string;
  name: string;
  description: string;
  category: 'appetizer' | 'main_course' | 'dessert' | 'beverage' | 'catering' | 'specialty';
  price: number;
  servingSize: number;
  preparationTime: number; // in minutes
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  allergens: string[];
  ingredients: string[];
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function FoodProductsPage() {
  const { user, userRole, partnerData } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FoodProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    servingSize: '',
    preparationTime: '',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    allergens: '',
    ingredients: '',
    notes: ''
  });

  // Mock data for food products
  useEffect(() => {
    const loadProducts = async () => {
      if (user && userRole === 'partner') {
        try {
          setLoading(true);
          
          // Mock data for food products
          const mockProducts: FoodProduct[] = [
            {
              id: "PROD-001",
              name: "Corporate Lunch Box",
              description: "Complete lunch box with main dish, rice, vegetables, and dessert",
              category: "catering",
              price: 350,
              servingSize: 1,
              preparationTime: 30,
              isAvailable: true,
              isVegetarian: false,
              isVegan: false,
              isGlutenFree: false,
              allergens: ["gluten", "dairy"],
              ingredients: ["chicken", "rice", "vegetables", "sauce", "dessert"],
              notes: "Minimum order: 10 boxes",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "PROD-002",
              name: "Birthday Cake",
              description: "Custom birthday cake with chocolate or vanilla flavor",
              category: "dessert",
              price: 2500,
              servingSize: 20,
              preparationTime: 120,
              isAvailable: true,
              isVegetarian: true,
              isVegan: false,
              isGlutenFree: false,
              allergens: ["gluten", "eggs", "dairy"],
              ingredients: ["flour", "sugar", "eggs", "butter", "chocolate", "cream"],
              notes: "48-hour advance notice required",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "PROD-003",
              name: "Fresh Fruit Smoothie",
              description: "Blend of fresh fruits with yogurt and honey",
              category: "beverage",
              price: 120,
              servingSize: 1,
              preparationTime: 10,
              isAvailable: true,
              isVegetarian: true,
              isVegan: false,
              isGlutenFree: true,
              allergens: ["dairy"],
              ingredients: ["mixed fruits", "yogurt", "honey", "ice"],
              notes: "Available in mango, strawberry, or mixed berry",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "PROD-004",
              name: "Vegetarian Pasta",
              description: "Creamy pasta with seasonal vegetables and herbs",
              category: "main_course",
              price: 280,
              servingSize: 1,
              preparationTime: 25,
              isAvailable: false,
              isVegetarian: true,
              isVegan: true,
              isGlutenFree: false,
              allergens: ["gluten"],
              ingredients: ["pasta", "seasonal vegetables", "olive oil", "herbs", "nutritional yeast"],
              notes: "Currently out of stock",
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
            description: "Failed to load food products. Please try again.",
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
      case 'appetizer': return 'Appetizer';
      case 'main_course': return 'Main Course';
      case 'dessert': return 'Dessert';
      case 'beverage': return 'Beverage';
      case 'catering': return 'Catering';
      case 'specialty': return 'Specialty';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'appetizer': return 'bg-orange-100 text-orange-800';
      case 'main_course': return 'bg-red-100 text-red-800';
      case 'dessert': return 'bg-pink-100 text-pink-800';
      case 'beverage': return 'bg-blue-100 text-blue-800';
      case 'catering': return 'bg-purple-100 text-purple-800';
      case 'specialty': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatPreparationTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newProduct: FoodProduct = {
        id: editingProduct ? editingProduct.id : `PROD-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        category: formData.category as any,
        price: parseFloat(formData.price),
        servingSize: parseInt(formData.servingSize),
        preparationTime: parseInt(formData.preparationTime),
        isAvailable: true,
        isVegetarian: formData.isVegetarian,
        isVegan: formData.isVegan,
        isGlutenFree: formData.isGlutenFree,
        allergens: formData.allergens.split(',').map(a => a.trim()).filter(a => a),
        ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(i => i),
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
          description: "Food product has been updated successfully.",
        });
      } else {
        setProducts(prev => [...prev, newProduct]);
        toast({
          title: "Product Added",
          description: "New food product has been added successfully.",
        });
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        servingSize: '',
        preparationTime: '',
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        allergens: '',
        ingredients: '',
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

  const handleEdit = (product: FoodProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      servingSize: product.servingSize.toString(),
      preparationTime: product.preparationTime.toString(),
      isVegetarian: product.isVegetarian,
      isVegan: product.isVegan,
      isGlutenFree: product.isGlutenFree,
      allergens: product.allergens.join(', '),
      ingredients: product.ingredients.join(', '),
      notes: product.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId: string) => {
    try {
      setProducts(prev => prev.filter(product => product.id !== productId));
      toast({
        title: "Product Deleted",
        description: "Food product has been deleted successfully.",
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
            <h1 className="text-3xl font-bold tracking-tight">Food Products</h1>
            <p className="text-muted-foreground">
              Manage your food and catering products for customer orders
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
                {editingProduct ? 'Update the food product details' : 'Create a new food product for your customers'}
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
                      placeholder="e.g., Corporate Lunch Box"
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
                        <SelectItem value="appetizer">Appetizer</SelectItem>
                        <SelectItem value="main_course">Main Course</SelectItem>
                        <SelectItem value="dessert">Dessert</SelectItem>
                        <SelectItem value="beverage">Beverage</SelectItem>
                        <SelectItem value="catering">Catering</SelectItem>
                        <SelectItem value="specialty">Specialty</SelectItem>
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
                    placeholder="Describe what this product includes..."
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
                      placeholder="350"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="servingSize">Serving Size *</Label>
                    <Input
                      id="servingSize"
                      type="number"
                      value={formData.servingSize}
                      onChange={(e) => handleInputChange('servingSize', e.target.value)}
                      placeholder="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preparationTime">Prep Time (minutes) *</Label>
                    <Input
                      id="preparationTime"
                      type="number"
                      value={formData.preparationTime}
                      onChange={(e) => handleInputChange('preparationTime', e.target.value)}
                      placeholder="30"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Dietary Information</Label>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isVegetarian"
                        checked={formData.isVegetarian}
                        onCheckedChange={(checked) => handleInputChange('isVegetarian', checked as boolean)}
                      />
                      <Label htmlFor="isVegetarian">Vegetarian</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isVegan"
                        checked={formData.isVegan}
                        onCheckedChange={(checked) => handleInputChange('isVegan', checked as boolean)}
                      />
                      <Label htmlFor="isVegan">Vegan</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isGlutenFree"
                        checked={formData.isGlutenFree}
                        onCheckedChange={(checked) => handleInputChange('isGlutenFree', checked as boolean)}
                      />
                      <Label htmlFor="isGlutenFree">Gluten-Free</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="allergens">Allergens</Label>
                    <Input
                      id="allergens"
                      value={formData.allergens}
                      onChange={(e) => handleInputChange('allergens', e.target.value)}
                      placeholder="gluten, dairy, nuts (comma-separated)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ingredients">Ingredients</Label>
                    <Input
                      id="ingredients"
                      value={formData.ingredients}
                      onChange={(e) => handleInputChange('ingredients', e.target.value)}
                      placeholder="chicken, rice, vegetables (comma-separated)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Special instructions, minimum orders, advance notice requirements..."
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
                        servingSize: '',
                        preparationTime: '',
                        isVegetarian: false,
                        isVegan: false,
                        isGlutenFree: false,
                        allergens: '',
                        ingredients: '',
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
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <Badge className={getCategoryColor(product.category)}>
                      {getCategoryLabel(product.category)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.isAvailable ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
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
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Serves {product.servingSize}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{formatPreparationTime(product.preparationTime)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {product.isVegetarian && <Badge variant="secondary" className="text-xs">Vegetarian</Badge>}
                  {product.isVegan && <Badge variant="secondary" className="text-xs">Vegan</Badge>}
                  {product.isGlutenFree && <Badge variant="secondary" className="text-xs">Gluten-Free</Badge>}
                </div>

                {product.allergens.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Allergens:
                    </p>
                    <p className="text-sm text-muted-foreground">{product.allergens.join(', ')}</p>
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
          ))}
        </div>

        {products.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first food product to begin accepting orders.
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
