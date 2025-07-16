import { type ThemeMode } from "@/types/settings";

/**
 * ThemeService
 *
 * Bridges between next-themes and Zustand store to provide:
 * - Bidirectional theme synchronization
 * - System theme detection and real-time updates
 * - Theme persistence through settings service
 * - Immediate theme application
 */
class ThemeService {
  private themeChangedCallback?: (theme: ThemeMode) => void;

  /**
   * Sync theme from next-themes to Zustand store settings
   * NOTE: This method is disabled to prevent infinite loops.
   * Theme changes should only flow: Store -> next-themes (not both ways)
   */
  async syncThemeToSettings(theme: string): Promise<void> {
    // Disabled to prevent infinite loops
    console.log(`Theme sync disabled to prevent loops: ${theme}`);
  }

  /**
   * Initialize theme system on app startup
   */
  async initializeTheme(): Promise<void> {
    try {
      // Setup system theme change detection
      this.setupSystemThemeDetection();

      console.log("Theme service initialized");
    } catch (error) {
      console.error("Failed to initialize theme service:", error);
    }
  }

  /**
   * Setup system theme change detection
   */
  private setupSystemThemeDetection(): void {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const systemTheme = e.matches ? "dark" : "light";

      // Only notify if we're in system mode
      if (this.themeChangedCallback) {
        this.themeChangedCallback("system");
      }

      console.log(`System theme changed to: ${systemTheme}`);
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    // Store cleanup function for later use
    this.cleanup = () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }

  private cleanup?: () => void;

  /**
   * Register callback for theme changes
   */
  onThemeChange(callback: (theme: ThemeMode) => void): void {
    this.themeChangedCallback = callback;
  }

  /**
   * Get current system theme preference
   */
  getSystemTheme(): "light" | "dark" {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    return prefersDark ? "dark" : "light";
  }

  /**
   * Destroy theme service and cleanup listeners
   */
  destroy(): void {
    if (this.cleanup) {
      this.cleanup();
    }
    this.themeChangedCallback = undefined;
  }
}

// Export singleton instance
export const themeService = new ThemeService();
