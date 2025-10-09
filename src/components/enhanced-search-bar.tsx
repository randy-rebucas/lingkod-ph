"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Search, 
    MapPin, 
    Filter, 
    X, 
    Loader2, 
    Star, 
    Clock, 
    DollarSign,
    CheckCircle,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";

interface SearchFilters {
    location?: string;
    priceRange?: {
        min: number;
        max: number;
    };
    rating?: number;
    availability?: 'today' | 'thisWeek' | 'thisMonth' | 'anytime';
    serviceType?: string[];
}

interface EnhancedSearchBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onSearch: (term: string, filters?: SearchFilters) => void;
    onLocationChange?: (location: string) => void;
    isLoading?: boolean;
    placeholder?: string;
    className?: string;
}

export default function EnhancedSearchBar({
    searchTerm,
    onSearchChange,
    onSearch,
    onLocationChange,
    isLoading = false,
    placeholder = "e.g., 'I need a plumber for a clogged kitchen sink'",
    className
}: EnhancedSearchBarProps) {
    const t = useTranslations('EnhancedSearch');
    const [location, setLocation] = useState("");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const locationRef = useRef<HTMLInputElement>(null);

    // Popular search suggestions
    const popularSearches = [
        "house cleaning",
        "plumber for kitchen sink",
        "web design",
        "tutoring",
        "photography",
        "home repair",
        "gardening",
        "pet grooming"
    ];

    // Service types for filtering
    const serviceTypes = [
        "House Cleaning",
        "Plumbing",
        "Web Design",
        "Tutoring",
        "Photography",
        "Home Repair",
        "Gardening",
        "Pet Services",
        "IT Support",
        "Graphic Design"
    ];

    useEffect(() => {
        // Filter suggestions based on current search term
        if (searchTerm.length > 1) {
            const filtered = popularSearches.filter(search => 
                search.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [searchTerm]);

    const handleSearch = () => {
        onSearch(searchTerm, filters);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        onSearchChange(suggestion);
        setShowSuggestions(false);
        handleSearch();
    };

    const handleLocationChange = (value: string) => {
        setLocation(value);
        onLocationChange?.(value);
        setFilters(prev => ({ ...prev, location: value }));
    };

    const handleFilterChange = (key: keyof SearchFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({});
        setLocation("");
        onLocationChange?.("");
    };

    const hasActiveFilters = Object.keys(filters).length > 0 || location.length > 0;

    return (
        <div className={cn("space-y-4", className)}>
            {/* Main Search Bar */}
            <div className="relative">
                <div className="flex gap-2">
                    {/* Location Input */}
                    <div className="relative flex-1 max-w-xs">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            ref={locationRef}
                            placeholder={t('locationPlaceholder')}
                            value={location}
                            onChange={(e) => handleLocationChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-10 border-2 focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            ref={searchRef}
                            placeholder={placeholder}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setShowSuggestions(suggestions.length > 0)}
                            className="pl-10 pr-20 border-2 focus:border-primary transition-colors"
                        />
                        <Button
                            onClick={handleSearch}
                            disabled={isLoading}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>

                    {/* Advanced Filters Toggle */}
                    <Button
                        variant="outline"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={cn(
                            "border-2 transition-colors",
                            showAdvancedFilters ? "border-primary bg-primary/10" : "border-border"
                        )}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        {t('filters')}
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                                {Object.keys(filters).length + (location ? 1 : 0)}
                            </Badge>
                        )}
                        {showAdvancedFilters ? (
                            <ChevronUp className="h-4 w-4 ml-2" />
                        ) : (
                            <ChevronDown className="h-4 w-4 ml-2" />
                        )}
                    </Button>
                </div>

                {/* Search Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
                        <CardContent className="p-2">
                            <div className="space-y-1">
                                {suggestions.map((suggestion, index) => (
                                    <Button
                                        key={index}
                                        variant="ghost"
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="w-full justify-start text-left h-auto p-2"
                                    >
                                        <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                                        {suggestion}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
                <Card className="border-2 border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{t('advancedFilters')}</CardTitle>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    {t('clearFilters')}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Price Range */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">{t('priceRange')}</label>
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    placeholder={t('minPrice')}
                                    value={filters.priceRange?.min || ""}
                                    onChange={(e) => handleFilterChange('priceRange', {
                                        ...filters.priceRange,
                                        min: e.target.value ? parseInt(e.target.value) : undefined
                                    })}
                                    className="w-24"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                    type="number"
                                    placeholder={t('maxPrice')}
                                    value={filters.priceRange?.max || ""}
                                    onChange={(e) => handleFilterChange('priceRange', {
                                        ...filters.priceRange,
                                        max: e.target.value ? parseInt(e.target.value) : undefined
                                    })}
                                    className="w-24"
                                />
                            </div>
                        </div>

                        {/* Rating Filter */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">{t('minimumRating')}</label>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <Button
                                        key={rating}
                                        variant={filters.rating === rating ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleFilterChange('rating', filters.rating === rating ? undefined : rating)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Star className={cn(
                                            "h-4 w-4",
                                            filters.rating && filters.rating >= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                        )} />
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Availability */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">{t('availability')}</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { key: 'today', label: t('today') },
                                    { key: 'thisWeek', label: t('thisWeek') },
                                    { key: 'thisMonth', label: t('thisMonth') },
                                    { key: 'anytime', label: t('anytime') }
                                ].map((option) => (
                                    <Button
                                        key={option.key}
                                        variant={filters.availability === option.key ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleFilterChange('availability', 
                                            filters.availability === option.key ? undefined : option.key as any
                                        )}
                                        className="text-xs"
                                    >
                                        <Clock className="h-3 w-3 mr-1" />
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Service Types */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">{t('serviceTypes')}</label>
                            <div className="flex flex-wrap gap-2">
                                {serviceTypes.map((service) => (
                                    <Button
                                        key={service}
                                        variant={filters.serviceType?.includes(service) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            const currentTypes = filters.serviceType || [];
                                            const newTypes = currentTypes.includes(service)
                                                ? currentTypes.filter(t => t !== service)
                                                : [...currentTypes, service];
                                            handleFilterChange('serviceType', newTypes.length > 0 ? newTypes : undefined);
                                        }}
                                        className="text-xs"
                                    >
                                        {filters.serviceType?.includes(service) && (
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                        )}
                                        {service}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {location && (
                        <Badge variant="secondary" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {location}
                            <X 
                                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                onClick={() => handleLocationChange("")}
                            />
                        </Badge>
                    )}
                    {filters.priceRange && (
                        <Badge variant="secondary" className="gap-1">
                            <DollarSign className="h-3 w-3" />
                            {filters.priceRange.min || 0} - {filters.priceRange.max || "∞"}
                            <X 
                                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                onClick={() => handleFilterChange('priceRange', undefined)}
                            />
                        </Badge>
                    )}
                    {filters.rating && (
                        <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {filters.rating}+ stars
                            <X 
                                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                onClick={() => handleFilterChange('rating', undefined)}
                            />
                        </Badge>
                    )}
                    {filters.availability && (
                        <Badge variant="secondary" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {t(filters.availability)}
                            <X 
                                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                onClick={() => handleFilterChange('availability', undefined)}
                            />
                        </Badge>
                    )}
                    {filters.serviceType?.map((service) => (
                        <Badge key={service} variant="secondary" className="gap-1">
                            {service}
                            <X 
                                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                onClick={() => {
                                    const newTypes = filters.serviceType?.filter(t => t !== service);
                                    handleFilterChange('serviceType', newTypes && newTypes.length > 0 ? newTypes : undefined);
                                }}
                            />
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
