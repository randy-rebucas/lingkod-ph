// Design tokens for consistent styling across the app
export const designTokens = {
  // Spacing
  spacing: {
    page: 'space-y-6',
    section: 'space-y-4',
    card: 'p-6',
    cardHeader: 'p-6 pb-4',
    cardContent: 'p-6 pt-0',
    cardFooter: 'p-6 pt-0'
  },
  
  // Typography
  typography: {
    pageTitle: 'text-3xl font-bold font-headline',
    pageSubtitle: 'text-muted-foreground',
    sectionTitle: 'text-xl font-semibold font-headline',
    cardTitle: 'text-lg font-semibold',
    cardDescription: 'text-sm text-muted-foreground'
  },
  
  // Layout
  layout: {
    pageContainer: 'space-y-6',
    pageHeader: 'space-y-2',
    cardGrid: 'grid gap-6',
    cardGrid2: 'grid gap-6 md:grid-cols-2',
    cardGrid3: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
    cardGrid4: 'grid gap-6 md:grid-cols-2 lg:grid-cols-4',
    pageHeaderAction: 'flex justify-end items-center'
  },
  
  // Effects
  effects: {
    cardElevated: 'shadow-soft border-0 bg-background/80 backdrop-blur-sm',
    cardGlass: 'bg-background/50 backdrop-blur-sm border border-border/50',
    cardStandard: 'shadow-sm',
    buttonGlow: 'shadow-glow hover:shadow-glow/50 transition-all duration-300',
    buttonSoft: 'shadow-soft hover:shadow-glow/20 transition-all duration-300'
  },
  
  // Status colors
  status: {
    upcoming: 'default',
    completed: 'secondary',
    cancelled: 'destructive',
    pending: 'outline',
    'pending_payment': 'outline',
    'pending_verification': 'outline',
    'in_progress': 'default',
    'payment_rejected': 'destructive',
    active: 'secondary',
    suspended: 'destructive',
    'pending_approval': 'outline'
  }
};

// Standardized page layout component props
export interface PageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

// Standardized card component props
export interface StandardCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  variant?: 'standard' | 'elevated' | 'glass';
}

// Standardized loading state props
export interface LoadingStateProps {
  title?: string;
  description?: string;
  showSkeleton?: boolean;
}

// Standardized empty state props
export interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}
