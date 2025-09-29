"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X, Filter, RotateCcw } from 'lucide-react';
import { ProductFilters, ProductCategoryData } from '@/lib/marketplace/types';

interface ProductFiltersProps {
  categories: ProductCategoryData[];
  brands: string[];
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onClearFilters: () => void;
}

export function ProductFiltersComponent({
  categories,
  brands,
  filters,
  onFiltersChange,
  onClearFilters
}: ProductFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      category: filters.category === category ? undefined : category
    });
  };

  const handleSubcategoryChange = (subcategory: string) => {
    onFiltersChange({
      ...filters,
      subcategory: filters.subcategory === subcategory ? undefined : subcategory
    });
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    const currentBrands = filters.brand || [];
    const newBrands = checked
      ? [...currentBrands, brand]
      : currentBrands.filter(b => b !== brand);
    
    onFiltersChange({
      ...filters,
      brand: newBrands.length > 0 ? newBrands : undefined
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: {
        min: values[0],
        max: values[1]
      }
    });
  };

  const handleStockFilterChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      inStock: checked ? true : undefined
    });
  };

  const handleFeaturedFilterChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      isFeatured: checked ? true : undefined
    });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchQuery: value || undefined
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.subcategory) count++;
    if (filters.brand && filters.brand.length > 0) count++;
    if (filters.priceRange) count++;
    if (filters.inStock) count++;
    if (filters.isFeatured) count++;
    if (filters.searchQuery) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="md:hidden"
            >
              {isExpanded ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`space-y-6 ${!isExpanded ? 'hidden md:block' : ''}`}>
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Products</Label>
          <Input
            id="search"
            placeholder="Search by name, brand, or features..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        <Separator />

        {/* Categories */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Categories</Label>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div
                  className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                  onClick={() => handleCategoryChange(category.slug)}
                >
                  <Checkbox
                    checked={filters.category === category.slug}
                    onChange={() => handleCategoryChange(category.slug)}
                  />
                  <Label className="text-sm font-medium cursor-pointer">
                    {category.name}
                  </Label>
                </div>
                
                {/* Subcategories */}
                {filters.category === category.slug && category.subcategories.length > 0 && (
                  <div className="ml-6 space-y-1">
                    {category.subcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-muted/30 p-1 rounded transition-colors"
                        onClick={() => handleSubcategoryChange(subcategory.slug)}
                      >
                        <Checkbox
                          checked={filters.subcategory === subcategory.slug}
                          onChange={() => handleSubcategoryChange(subcategory.slug)}
                        />
                        <Label className="text-xs cursor-pointer">
                          {subcategory.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Brands */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Brands</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {brands.map((brand) => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={filters.brand?.includes(brand) || false}
                  onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                />
                <Label htmlFor={`brand-${brand}`} className="text-sm cursor-pointer">
                  {brand}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Price Range</Label>
          <div className="space-y-4">
            <Slider
              value={[filters.priceRange?.min || 0, filters.priceRange?.max || 10000]}
              onValueChange={handlePriceRangeChange}
              max={10000}
              min={0}
              step={100}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>₱{filters.priceRange?.min || 0}</span>
              <span>₱{filters.priceRange?.max || 10000}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Stock & Featured Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Availability</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={filters.inStock || false}
                onCheckedChange={handleStockFilterChange}
              />
              <Label htmlFor="in-stock" className="text-sm cursor-pointer">
                In Stock Only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={filters.isFeatured || false}
                onCheckedChange={handleFeaturedFilterChange}
              />
              <Label htmlFor="featured" className="text-sm cursor-pointer">
                Featured Products
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
