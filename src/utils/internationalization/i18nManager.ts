/**
 * Comprehensive Internationalization Manager
 * Handles dynamic language switching, RTL support, and localization
 */

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  flag: string;
}

export interface TranslationNamespace {
  [key: string]: string | TranslationNamespace;
}

export interface Translations {
  [namespace: string]: TranslationNamespace;
}

export interface LocaleData {
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
    currency: string;
  };
  currency: {
    code: string;
    symbol: string;
    position: 'before' | 'after';
  };
}

export class I18nManager {
  private static instance: I18nManager;
  private currentLanguage: string = 'en';
  private translations: Map<string, Translations> = new Map();
  private localeData: Map<string, LocaleData> = new Map();
  private fallbackLanguage: string = 'en';
  private loadedLanguages: Set<string> = new Set();
  private changeListeners: Array<(language: string) => void> = [];

  // Supported languages
  private supportedLanguages: Language[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      rtl: false,
      flag: '🇺🇸'
    },
    {
      code: 'vi',
      name: 'Vietnamese',
      nativeName: 'Tiếng Việt',
      rtl: false,
      flag: '🇻🇳'
    },
    {
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      rtl: false,
      flag: '🇨🇳'
    },
    {
      code: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
      rtl: false,
      flag: '🇯🇵'
    },
    {
      code: 'ko',
      name: 'Korean',
      nativeName: '한국어',
      rtl: false,
      flag: '🇰🇷'
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      rtl: true,
      flag: '🇸🇦'
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      rtl: false,
      flag: '🇪🇸'
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      rtl: false,
      flag: '🇫🇷'
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      rtl: false,
      flag: '🇩🇪'
    },
    {
      code: 'pt',
      name: 'Portuguese',
      nativeName: 'Português',
      rtl: false,
      flag: '🇵🇹'
    }
  ];

  private constructor() {
    this.initializeDefaultLocaleData();
    this.detectUserLanguage();
  }

  public static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  /**
   * Initialize default locale data for all supported languages
   */
  private initializeDefaultLocaleData(): void {
    // English (US)
    this.localeData.set('en', {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: 'h:mm A',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        currency: '$'
      },
      currency: {
        code: 'USD',
        symbol: '$',
        position: 'before'
      }
    });

    // Vietnamese
    this.localeData.set('vi', {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      numberFormat: {
        decimal: ',',
        thousands: '.',
        currency: '₫'
      },
      currency: {
        code: 'VND',
        symbol: '₫',
        position: 'after'
      }
    });

    // Chinese
    this.localeData.set('zh', {
      dateFormat: 'YYYY/MM/DD',
      timeFormat: 'HH:mm',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        currency: '¥'
      },
      currency: {
        code: 'CNY',
        symbol: '¥',
        position: 'before'
      }
    });

    // Japanese
    this.localeData.set('ja', {
      dateFormat: 'YYYY/MM/DD',
      timeFormat: 'HH:mm',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        currency: '¥'
      },
      currency: {
        code: 'JPY',
        symbol: '¥',
        position: 'before'
      }
    });

    // Korean
    this.localeData.set('ko', {
      dateFormat: 'YYYY.MM.DD',
      timeFormat: 'HH:mm',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        currency: '₩'
      },
      currency: {
        code: 'KRW',
        symbol: '₩',
        position: 'before'
      }
    });

    // Arabic
    this.localeData.set('ar', {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
      numberFormat: {
        decimal: '.',
        thousands: ',',
        currency: 'ر.س'
      },
      currency: {
        code: 'SAR',
        symbol: 'ر.س',
        position: 'after'
      }
    });

    // Add other languages...
    ['es', 'fr', 'de', 'pt'].forEach(lang => {
      this.localeData.set(lang, {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        numberFormat: {
          decimal: '.',
          thousands: ',',
          currency: '€'
        },
        currency: {
          code: 'EUR',
          symbol: '€',
          position: 'before'
        }
      });
    });
  }

  /**
   * Detect user's preferred language
   */
  private detectUserLanguage(): void {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
      this.currentLanguage = savedLanguage;
      return;
    }

    // Check browser language
    const browserLanguages = navigator.languages || [navigator.language];

    for (const browserLang of browserLanguages) {
      const langCode = browserLang.split('-')[0];
      if (this.isLanguageSupported(langCode)) {
        this.currentLanguage = langCode;
        return;
      }
    }

    // Fallback to default
    this.currentLanguage = this.fallbackLanguage;
  }

  /**
   * Check if language is supported
   */
  private isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.some(lang => lang.code === languageCode);
  }

  /**
   * Load translations for a specific language
   */
  public async loadLanguage(languageCode: string): Promise<void> {
    if (this.loadedLanguages.has(languageCode)) {
      return;
    }

    try {
      // Load translation files dynamically
      const translations = await this.fetchTranslations(languageCode);
      this.translations.set(languageCode, translations);
      this.loadedLanguages.add(languageCode);
    } catch (error) {
      console.error(`Failed to load translations for ${languageCode}:`, error);

      // If it's not the fallback language, try loading fallback
      if (languageCode !== this.fallbackLanguage) {
        await this.loadLanguage(this.fallbackLanguage);
      }
    }
  }

  /**
   * Fetch translations from server or local files
   */
  private async fetchTranslations(languageCode: string): Promise<Translations> {
    try {
      // In a real application, this would fetch from your API or CDN
      // Use absolute path from public directory that works in production
      const response = await fetch(`/locales/${languageCode}.json`);

      if (!response.ok) {
        throw new Error(`Failed to fetch translations: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Fallback to basic translations if file doesn't exist
      console.warn(`Translation file for ${languageCode} not found, using fallback`);
      return this.getFallbackTranslations(languageCode);
    }
  }

  /**
   * Get fallback translations for unsupported languages
   */
  private getFallbackTranslations(languageCode: string): Translations {
    // Basic fallback translations
    return {
      common: {
        dashboard: "Dashboard",
        content: "Content",
        create: "Create",
        library: "Library",
        templates: "Templates",
        social: "Social Media",
        accounts: "Accounts",
        queue: "Publishing Queue",
        calendar: "Calendar",
        analytics: "Analytics",
        media: "Media & Assets",
        generator: "Image Generator",
        brandkit: "Brand Kit",
        settings: "Settings",
        team: "Team",
        profile: "Profile",
        logout: "Logout",
        help: "Help & Support",
        feedback: "Send Feedback",
        notifications: "Notifications",
        search: "Search...",
        loading: "Loading...",
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        view: "View",
        close: "Close",
        refresh: "Refresh"
      },
      header: {
        appTitle: "AI Content Pro",
        createContent: "Create Content",
        schedulePost: "Schedule Post",
        viewAnalytics: "View Analytics",
        switchToDarkMode: "Switch to Dark Mode",
        switchToLightMode: "Switch to Light Mode",
        account: "Account",
        viewAllNotifications: "View all notifications"
      },
      language: {
        switcherLabel: "Change language",
        changing: "Changing language...",
        availableLanguages: "Available languages"
      },
      time: {
        now: "now",
        in_hours: "in {{hours}} hours",
        hours_ago: "{{hours}} hours ago"
      },
      notifications: {
        postPublished: "Post published successfully",
        contentGenerated: "Content generation completed",
        postFailed: "Scheduled post failed",
        teamMemberJoined: "New team member joined"
      },
      workflows: {
        workflowRuns: "Workflow Runs",
        workflowRunDetails: "Workflow Run Details",
        status: "Status",
        workflowKey: "Workflow",
        currentStep: "Current Step",
        startedAt: "Started At",
        duration: "Duration",
        actions: "Actions",
        noWorkflowRuns: "No workflow runs found",
        viewDetails: "View Details",
        connectLiveUpdates: "Connect Live Updates",
        disconnectLiveUpdates: "Disconnect Live Updates",
        runDetails: "Run Details",
        errorMessage: "Error Message",
        currentOutput: "Current Output",
        viewFullDetails: "View Full Details",
        pleaseEnterTitleAndContent: "Please enter both title and content",
        initializingWorkflow: "Initializing workflow...",
        processingContent: "Processing content...",
        workflowCompleted: "Workflow completed successfully",
        workflowFailed: "Workflow failed",
        workflowStartError: "Failed to start workflow",
        sending: "Sending...",
        sendToWorkflow: "Send to Workflow",
        clearForm: "Clear Form",
        workflowProgress: "Workflow Progress",
        enterContentInfo: "Enter Content Information",
        titleRequired: "Title (Required)",
        titlePlaceholder: "Enter your content title...",
        contentRequired: "Content (Required)",
        contentPlaceholder: "Enter your content here...",
        contentSettings: "Content Settings",
        selectIndustry: "Select Industry",
        selectContentType: "Select Content Type",
        styleAndAudience: "Style & Audience",
        selectTone: "Select Tone",
        selectTargetAudience: "Select Target Audience",
        backToContent: "Back to Content",
        loadingWorkflowData: "Loading workflow data...",
        addComment: "Add Comment",
        enterComment: "Enter your comment...",
        cancel: "Cancel"
      },
      sidebar: {
        dashboard: "Dashboard",
        content: "Content",
        createContent: "Create Content",
        workflow: "Workflow",
        workflowRuns: "Workflow Runs",
        workflowTimeline: "Workflow Timeline",
        contentLibrary: "Content Library",
        templates: "Templates",
        versionHistory: "Version History",
        export: "Export",
        socialMedia: "Social Media",
        accounts: "Accounts",
        publishingQueue: "Publishing Queue",
        calendar: "Calendar",
        analytics: "Analytics",
        platformSettings: "Platform Settings",
        contentOptimization: "Content Optimization",
        mediaAssets: "Media & Assets",
        mediaLibrary: "Media Library",
        imageGenerator: "Image Generator",
        brandKit: "Brand Kit",
        assetEditor: "Asset Editor",
        videoProcessor: "Video Processor",
        assetAnalytics: "Asset Analytics",
        team: "Team",
        notifications: "Notifications",
        pricing: "Pricing",
        settings: "Settings",
        helpSupport: "Help & Support"
      }
    };
  }

  /**
   * Change current language
   */
  public async changeLanguage(languageCode: string): Promise<void> {
    if (!this.isLanguageSupported(languageCode)) {
      throw new Error(`Language ${languageCode} is not supported`);
    }

    // Load language if not already loaded
    await this.loadLanguage(languageCode);

    const previousLanguage = this.currentLanguage;
    this.currentLanguage = languageCode;

    // Save to localStorage
    localStorage.setItem('preferred-language', languageCode);

    // Apply RTL/LTR direction
    this.applyTextDirection();

    // Apply locale-specific formatting
    this.applyLocaleFormatting();

    // Notify listeners
    this.changeListeners.forEach(listener => {
      try {
        listener(languageCode);
      } catch (error) {
        console.error('Error in language change listener:', error);
      }
    });

    console.log(`Language changed from ${previousLanguage} to ${languageCode}`);
  }

  /**
   * Apply text direction (RTL/LTR)
   */
  private applyTextDirection(): void {
    const language = this.getCurrentLanguageInfo();
    const htmlElement = document.documentElement;

    if (language?.rtl) {
      htmlElement.setAttribute('dir', 'rtl');
      htmlElement.classList.add('rtl');
      htmlElement.classList.remove('ltr');
    } else {
      htmlElement.setAttribute('dir', 'ltr');
      htmlElement.classList.add('ltr');
      htmlElement.classList.remove('rtl');
    }

    // Update CSS custom properties for RTL support
    const root = document.documentElement;
    root.style.setProperty('--text-align-start', language?.rtl ? 'right' : 'left');
    root.style.setProperty('--text-align-end', language?.rtl ? 'left' : 'right');
    root.style.setProperty('--margin-start', language?.rtl ? 'margin-right' : 'margin-left');
    root.style.setProperty('--margin-end', language?.rtl ? 'margin-left' : 'margin-right');
  }

  /**
   * Apply locale-specific formatting
   */
  private applyLocaleFormatting(): void {
    const locale = this.localeData.get(this.currentLanguage);
    if (!locale) return;

    // Set HTML lang attribute
    document.documentElement.setAttribute('lang', this.currentLanguage);

    // Apply CSS custom properties for locale-specific styling
    const root = document.documentElement;
    root.style.setProperty('--currency-symbol', `"${locale.currency.symbol}"`);
    root.style.setProperty('--currency-position', locale.currency.position);
  }

  /**
   * Get translation for a key
   */
  public t(key: string, params?: Record<string, string | number>): string {
    // Try current language first
    let translation = this.getTranslation(key, this.currentLanguage);

    // If not found, try fallback language
    if (!translation && this.currentLanguage !== this.fallbackLanguage) {
      translation = this.getTranslation(key, this.fallbackLanguage);
    }

    // If still not found, try to get from fallback translations
    if (!translation) {
      const fallbackTranslations = this.getFallbackTranslations(this.currentLanguage);
      translation = this.getTranslationFromObject(key, fallbackTranslations);
    }

    // Final fallback to the key itself
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      translation = key;
    }

    // Replace parameters
    if (params) {
      return this.interpolateParams(translation, params);
    }

    return translation;
  }

  /**
   * Get translation from a translation object
   */
  private getTranslationFromObject(key: string, translations: Translations): string | null {
    const keys = key.split('.');
    let current: any = translations;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Get translation from loaded translations
   */
  private getTranslation(key: string, languageCode: string): string | null {
    const translations = this.translations.get(languageCode);
    if (!translations) return null;

    const keys = key.split('.');
    let current: any = translations;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Interpolate parameters in translation string
   */
  private interpolateParams(translation: string, params: Record<string, string | number>): string {
    return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }

  /**
   * Get current language information
   */
  public getCurrentLanguageInfo(): Language | undefined {
    return this.supportedLanguages.find(lang => lang.code === this.currentLanguage);
  }

  /**
   * Get all supported languages
   */
  public getSupportedLanguages(): Language[] {
    return [...this.supportedLanguages];
  }

  /**
   * Get current language code
   */
  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Check if current language is RTL
   */
  public isRTL(): boolean {
    const language = this.getCurrentLanguageInfo();
    return language?.rtl || false;
  }

  /**
   * Format date according to current locale
   */
  public formatDate(date: Date): string {
    const locale = this.localeData.get(this.currentLanguage);
    if (!locale) return date.toLocaleDateString();

    try {
      return new Intl.DateTimeFormat(this.currentLanguage, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    } catch {
      return date.toLocaleDateString();
    }
  }

  /**
   * Format time according to current locale
   */
  public formatTime(date: Date): string {
    const locale = this.localeData.get(this.currentLanguage);
    if (!locale) return date.toLocaleTimeString();

    try {
      return new Intl.DateTimeFormat(this.currentLanguage, {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return date.toLocaleTimeString();
    }
  }

  /**
   * Format number according to current locale
   */
  public formatNumber(number: number): string {
    try {
      return new Intl.NumberFormat(this.currentLanguage).format(number);
    } catch {
      return number.toString();
    }
  }

  /**
   * Format currency according to current locale
   */
  public formatCurrency(amount: number): string {
    const locale = this.localeData.get(this.currentLanguage);
    if (!locale) return amount.toString();

    try {
      return new Intl.NumberFormat(this.currentLanguage, {
        style: 'currency',
        currency: locale.currency.code
      }).format(amount);
    } catch {
      const symbol = locale.currency.symbol;
      const formatted = this.formatNumber(amount);

      return locale.currency.position === 'before'
        ? `${symbol}${formatted}`
        : `${formatted}${symbol}`;
    }
  }

  /**
   * Add language change listener
   */
  public addLanguageChangeListener(listener: (language: string) => void): () => void {
    this.changeListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.changeListeners.indexOf(listener);
      if (index > -1) {
        this.changeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get locale data for current language
   */
  public getLocaleData(): LocaleData | undefined {
    return this.localeData.get(this.currentLanguage);
  }

  /**
   * Pluralize translation key based on count
   */
  public pluralize(key: string, count: number, params?: Record<string, string | number>): string {
    const pluralKey = count === 1 ? `${key}.singular` : `${key}.plural`;
    const fallbackKey = count === 1 ? key : `${key}s`;

    const translation = this.t(pluralKey) || this.t(fallbackKey) || this.t(key);

    return this.interpolateParams(translation, { ...params, count });
  }

  /**
   * Get relative time format (e.g., "2 hours ago")
   */
  public getRelativeTime(date: Date): string {
    try {
      const rtf = new Intl.RelativeTimeFormat(this.currentLanguage, { numeric: 'auto' });
      const now = new Date();
      const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

      if (Math.abs(diffInSeconds) < 60) {
        return rtf.format(diffInSeconds, 'second');
      } else if (Math.abs(diffInSeconds) < 3600) {
        return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
      } else if (Math.abs(diffInSeconds) < 86400) {
        return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
      } else {
        return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
      }
    } catch {
      // Fallback for unsupported browsers
      const now = new Date();
      const diffInMs = date.getTime() - now.getTime();
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

      if (diffInHours === 0) {
        return this.t('time.now');
      } else if (diffInHours > 0) {
        return this.t('time.in_hours', { hours: diffInHours });
      } else {
        return this.t('time.hours_ago', { hours: Math.abs(diffInHours) });
      }
    }
  }
}

// Export singleton instance
export const i18nManager = I18nManager.getInstance();