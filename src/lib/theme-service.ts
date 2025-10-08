'use client';

import { UserSettingsService } from './user-settings-service';

export interface ThemeConfig {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'system' | 'serif' | 'monospace';
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface LanguageConfig {
  language: 'en' | 'tl' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  timezone: string;
  currency: 'PHP' | 'USD' | 'EUR' | 'GBP' | 'JPY';
  numberFormat: 'US' | 'EU' | 'IN';
}

export class ThemeService {
  private static readonly THEME_STORAGE_KEY = 'localpro-theme';
  private static readonly LANGUAGE_STORAGE_KEY = 'localpro-language';
  private static readonly THEME_CHANGE_EVENT = 'theme-change';
  private static readonly LANGUAGE_CHANGE_EVENT = 'language-change';

  /**
   * Initialize theme from user settings
   */
  static async initializeTheme(userId: string): Promise<void> {
    try {
      const userSettings = await UserSettingsService.getUserSettings(userId);
      const themeConfig: ThemeConfig = {
        theme: userSettings.appearance.theme.theme === 'auto' ? 'system' : userSettings.appearance.theme.theme as 'light' | 'dark' | 'system',
        primaryColor: userSettings.appearance.theme.primaryColor,
        accentColor: userSettings.appearance.theme.accentColor,
        fontSize: userSettings.appearance.theme.fontSize,
        fontFamily: userSettings.appearance.theme.fontFamily,
        highContrast: userSettings.appearance.theme.highContrast,
        reducedMotion: userSettings.appearance.theme.reducedMotion
      };
      await this.applyTheme(themeConfig);
      await this.applyLanguage(userSettings.appearance.language);
    } catch (error) {
      console.error('Error initializing theme:', error);
      // Fallback to system theme
      this.applySystemTheme();
    }
  }

  /**
   * Apply theme configuration
   */
  static async applyTheme(themeConfig: ThemeConfig): Promise<void> {
    try {
      const root = document.documentElement;
      
      // Apply theme mode
      this.applyThemeMode(themeConfig.theme);
      
      // Apply colors
      this.applyColors(themeConfig.primaryColor, themeConfig.accentColor);
      
      // Apply font settings
      this.applyFontSettings(themeConfig.fontSize, themeConfig.fontFamily);
      
      // Apply accessibility settings
      this.applyAccessibilitySettings(themeConfig.highContrast, themeConfig.reducedMotion);
      
      // Store in localStorage for persistence
      localStorage.setItem(this.THEME_STORAGE_KEY, JSON.stringify(themeConfig));
      
      // Dispatch theme change event
      this.dispatchThemeChangeEvent(themeConfig);
      
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }

  /**
   * Apply language configuration
   */
  static async applyLanguage(languageConfig: LanguageConfig): Promise<void> {
    try {
      // Set document language
      document.documentElement.lang = languageConfig.language;
      
      // Apply date and time formatting
      this.applyDateTimeFormatting(languageConfig);
      
      // Apply currency formatting
      this.applyCurrencyFormatting(languageConfig.currency, languageConfig.numberFormat);
      
      // Store in localStorage
      localStorage.setItem(this.LANGUAGE_STORAGE_KEY, JSON.stringify(languageConfig));
      
      // Dispatch language change event
      this.dispatchLanguageChangeEvent(languageConfig);
      
    } catch (error) {
      console.error('Error applying language:', error);
    }
  }

  /**
   * Get current theme from localStorage
   */
  static getCurrentTheme(): ThemeConfig | null {
    try {
      const stored = localStorage.getItem(this.THEME_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting current theme:', error);
      return null;
    }
  }

  /**
   * Get current language from localStorage
   */
  static getCurrentLanguage(): LanguageConfig | null {
    try {
      const stored = localStorage.getItem(this.LANGUAGE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting current language:', error);
      return null;
    }
  }

  /**
   * Toggle between light and dark theme
   */
  static async toggleTheme(): Promise<void> {
    try {
      const currentTheme = this.getCurrentTheme();
      const newTheme = currentTheme?.theme === 'light' ? 'dark' : 'light';
      
      const updatedTheme = {
        ...currentTheme,
        theme: newTheme
      } as ThemeConfig;
      
      await this.applyTheme(updatedTheme);
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  }

  /**
   * Set system theme preference
   */
  static setSystemTheme(): void {
    this.applySystemTheme();
  }

  /**
   * Apply theme mode (light/dark/system)
   */
  private static applyThemeMode(theme: 'light' | 'dark' | 'system'): void {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      });
    } else {
      root.classList.add(theme);
    }
  }

  /**
   * Apply custom colors
   */
  private static applyColors(primaryColor: string, accentColor: string): void {
    const root = document.documentElement;
    
    if (primaryColor) {
      root.style.setProperty('--primary', primaryColor);
      root.style.setProperty('--primary-foreground', this.getContrastColor(primaryColor));
    }
    
    if (accentColor) {
      root.style.setProperty('--accent', accentColor);
      root.style.setProperty('--accent-foreground', this.getContrastColor(accentColor));
    }
  }

  /**
   * Apply font settings
   */
  private static applyFontSettings(fontSize: string, fontFamily: string): void {
    const root = document.documentElement;
    
    // Apply font size
    switch (fontSize) {
      case 'small':
        root.style.fontSize = '14px';
        break;
      case 'large':
        root.style.fontSize = '18px';
        break;
      default:
        root.style.fontSize = '16px';
    }
    
    // Apply font family
    switch (fontFamily) {
      case 'serif':
        root.style.fontFamily = 'Georgia, serif';
        break;
      case 'monospace':
        root.style.fontFamily = 'Monaco, Consolas, monospace';
        break;
      default:
        root.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    }
  }

  /**
   * Apply accessibility settings
   */
  private static applyAccessibilitySettings(highContrast: boolean, reducedMotion: boolean): void {
    const root = document.documentElement;
    
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }

  /**
   * Apply date and time formatting
   */
  private static applyDateTimeFormatting(languageConfig: LanguageConfig): void {
    // Set timezone
    if (languageConfig.timezone) {
      // This would typically be handled by a date library like date-fns
      // For now, we'll just store the preference
      document.documentElement.setAttribute('data-timezone', languageConfig.timezone);
    }
    
    // Set date format
    document.documentElement.setAttribute('data-date-format', languageConfig.dateFormat);
    
    // Set time format
    document.documentElement.setAttribute('data-time-format', languageConfig.timeFormat);
  }

  /**
   * Apply currency formatting
   */
  private static applyCurrencyFormatting(currency: string, numberFormat: string): void {
    document.documentElement.setAttribute('data-currency', currency);
    document.documentElement.setAttribute('data-number-format', numberFormat);
  }

  /**
   * Apply system theme
   */
  private static applySystemTheme(): void {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const root = document.documentElement;
    
    root.classList.remove('light', 'dark');
    root.classList.add(systemTheme);
  }

  /**
   * Get contrast color for text
   */
  private static getContrastColor(hexColor: string): string {
    // Remove # if present
    const color = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  /**
   * Dispatch theme change event
   */
  private static dispatchThemeChangeEvent(themeConfig: ThemeConfig): void {
    const event = new CustomEvent(this.THEME_CHANGE_EVENT, {
      detail: themeConfig
    });
    window.dispatchEvent(event);
  }

  /**
   * Dispatch language change event
   */
  private static dispatchLanguageChangeEvent(languageConfig: LanguageConfig): void {
    const event = new CustomEvent(this.LANGUAGE_CHANGE_EVENT, {
      detail: languageConfig
    });
    window.dispatchEvent(event);
  }

  /**
   * Listen for theme changes
   */
  static onThemeChange(callback: (themeConfig: ThemeConfig) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener(this.THEME_CHANGE_EVENT, handler as EventListener);
    
    // Return cleanup function
    return () => {
      window.removeEventListener(this.THEME_CHANGE_EVENT, handler as EventListener);
    };
  }

  /**
   * Listen for language changes
   */
  static onLanguageChange(callback: (languageConfig: LanguageConfig) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener(this.LANGUAGE_CHANGE_EVENT, handler as EventListener);
    
    // Return cleanup function
    return () => {
      window.removeEventListener(this.LANGUAGE_CHANGE_EVENT, handler as EventListener);
    };
  }

  /**
   * Format date according to user preferences
   */
  static formatDate(date: Date, languageConfig?: LanguageConfig): string {
    const config = languageConfig || this.getCurrentLanguage();
    if (!config) return date.toLocaleDateString();
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: config.timezone
    };
    
    switch (config.dateFormat) {
      case 'DD/MM/YYYY':
        options.day = '2-digit';
        options.month = '2-digit';
        options.year = 'numeric';
        break;
      case 'YYYY-MM-DD':
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
        break;
      default: // MM/DD/YYYY
        options.month = '2-digit';
        options.day = '2-digit';
        options.year = 'numeric';
    }
    
    return date.toLocaleDateString(config.language, options);
  }

  /**
   * Format time according to user preferences
   */
  static formatTime(date: Date, languageConfig?: LanguageConfig): string {
    const config = languageConfig || this.getCurrentLanguage();
    if (!config) return date.toLocaleTimeString();
    
    const options: Intl.DateTimeFormatOptions = {
      timeZone: config.timezone,
      hour12: config.timeFormat === '12h'
    };
    
    return date.toLocaleTimeString(config.language, options);
  }

  /**
   * Format currency according to user preferences
   */
  static formatCurrency(amount: number, languageConfig?: LanguageConfig): string {
    const config = languageConfig || this.getCurrentLanguage();
    if (!config) return `₱${amount.toFixed(2)}`;
    
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: 2
    };
    
    return new Intl.NumberFormat(config.language, options).format(amount);
  }

  /**
   * Format number according to user preferences
   */
  static formatNumber(number: number, languageConfig?: LanguageConfig): string {
    const config = languageConfig || this.getCurrentLanguage();
    if (!config) return number.toString();
    
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    };
    
    return new Intl.NumberFormat(config.language, options).format(number);
  }
}
