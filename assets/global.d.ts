export {};

declare global {
  interface Shopify {
    country: string;
    currency: {
      active: string;
      rate: string;
    };
    designMode: boolean;
    locale: string;
    shop: string;
    loadFeatures(features: ShopifyFeature[], callback?: LoadCallback): void;
    ModelViewerUI?: ModelViewer;
    visualPreviewMode: boolean;
    PaymentButton?: {
      init(): void;
    };
  }

  interface Theme {
    translations: Record<string, string>;
    placeholders: {
      general: string[];
      product: string[];
    };
    routes: {
      cart_add_url: string;
      cart_change_url: string;
      cart_update_url: string;
      cart_url: string;
      predictive_search_url: string;
      search_url: string;
    };
    utilities: {
      scheduler: {
        schedule: (task: () => void) => void;
      };
    };
    template: {
      name: string;
    };
  }

  interface SPAConfig {
    enabled: boolean;
    viewTransitions: boolean;
    debug: boolean;
    template: string;
    currentUrl: string;
    cacheSize: number;
    prefetchEnabled: boolean;
    animationStyle: string;
  }

  interface Window {
    Shopify: Shopify;
    SPA_CONFIG: SPAConfig;
    horizonSPARouter: any;
  }

  interface Document {
    startViewTransition?: (callback: () => Promise<void>) => Promise<void>;
  }

  interface HTMLElement {
    connectedCallback?: () => void;
    init?: () => void;
    closest(selector: string): HTMLElement | null;
    dataset: DOMStringMap;
  }

  interface EventTarget {
    closest?(selector: string): HTMLElement | null;
  }

  declare const Shopify: Shopify;
  declare const Theme: Theme;

  type LoadCallback = (error: Error | undefined) => void;

  // Refer to https://github.com/Shopify/shopify/blob/main/areas/core/shopify/app/assets/javascripts/storefront/load_feature/load_features.js
  interface ShopifyFeature {
    name: string;
    version: string;
    onLoad?: LoadCallback;
  }

  // Refer to https://github.com/Shopify/model-viewer-ui/blob/main/src/js/model-viewer-ui.js
  interface ModelViewer {
    new (
      element: Element,
      options?: {
        focusOnPlay?: boolean;
      }
    ): ModelViewer;
    play(): void;
    pause(): void;
    toggleFullscreen(): void;
    zoom(amount: number): void;
    destroy(): void;
  }
}
