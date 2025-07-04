// @ts-nocheck
/**
 * Horizon SPA Router for Shopify Liquid Theme
 * Provides fast client-side navigation with AJAX content loading
 */
class HorizonSPARouter {
  constructor() {
    this.config = window.SPA_CONFIG || {};
    this.cache = new Map();
    this.currentUrl = this.config.currentUrl || window.location.pathname;
    this.isNavigating = false;
    this.prefetchQueue = new Set();
    this.debug = this.config.debug || false;
    
    this.init();
  }

  init() {
    // Check if SPA is enabled in theme settings
    if (!this.config.enabled) {
      this.log('SPA navigation is disabled in theme settings');
      return;
    }

    if (!this.isSupported()) {
      this.log('SPA not supported in this browser');
      return;
    }

    this.log('Initializing Horizon SPA Router');
    
    this.interceptLinks();
    this.handlePopState();
    this.initPrefetching();
    this.setupViewTransitions();
    
    this.log('SPA Router initialized successfully');
  }

  isSupported() {
    return window.fetch && 
           window.DOMParser && 
           window.history && 
           window.history.pushState &&
           document.querySelector('#MainContent');
  }

  log() {
    if (this.debug) {
      console.log.apply(console, ['[SPA Router]'].concat(Array.prototype.slice.call(arguments)));
    }
  }

  interceptLinks() {
    const self = this;
    
    document.addEventListener('click', function(e) {
      let target = e.target;
      let link = null;
      
      // Find closest link element
      while (target && target !== document) {
        if (target.tagName === 'A' && target.href) {
          link = target;
          break;
        }
        target = target.parentNode;
      }
      
      if (!link || !self.shouldInterceptLink(link)) {
        return;
      }

      e.preventDefault();
      self.navigateTo(link.href);
    });
  }

  shouldInterceptLink(link) {
    if (!link || !link.href) return false;
    
    const href = link.href;
    const url = new URL(href, window.location.origin);
    
    // Skip if explicitly disabled
    if (link.hasAttribute('data-no-spa')) return false;
    
    // Skip external links
    if (url.hostname !== window.location.hostname) return false;
    
    // Skip special links
    if (href.includes('#') || 
        href.includes('mailto:') || 
        href.includes('tel:') ||
        link.target === '_blank') return false;
    
    // Skip file downloads
    if (href.match(/\.(pdf|zip|jpg|jpeg|png|gif|svg|ico|mp4|mp3|doc|docx|xls|xlsx)$/i)) return false;
    
    // Skip admin/system paths
    if (url.pathname.includes('/admin') ||
        url.pathname.includes('/cart') ||
        url.pathname.includes('/checkout') ||
        url.pathname.includes('/account/login') ||
        url.pathname.includes('/account/register')) return false;
    
    return true;
  }

  async navigateTo(url, pushState = true) {
    if (url === this.currentUrl || this.isNavigating) {
      return;
    }

    this.isNavigating = true;
    const startTime = performance.now();

    try {
      this.log('Navigating to:', url);
      
      this.showLoadingState();
      
      // Use View Transitions API if available
      if (this.config.viewTransitions && document.startViewTransition) {
        await this.navigateWithViewTransition(url, pushState);
      } else {
        await this.navigateTraditional(url, pushState);
      }

      this.currentUrl = url;
      
      const loadTime = performance.now() - startTime;
      this.log('Navigation completed in', Math.round(loadTime) + 'ms');
      
    } catch (error) {
      this.log('Navigation failed:', error);
      // Fallback to normal navigation
      window.location.href = url;
    } finally {
      this.isNavigating = false;
      this.hideLoadingState();
    }
  }

  async navigateWithViewTransition(url, pushState) {
    const self = this;
    
    await document.startViewTransition(async function() {
      const content = await self.getContent(url);
      await self.updateMainContent(content);
      
      if (pushState) {
        history.pushState({ spa: true }, '', url);
      }
    });
  }

  async navigateTraditional(url, pushState) {
    const content = await this.getContent(url);
    await this.updateMainContent(content);
    
    if (pushState) {
      history.pushState({ spa: true }, '', url);
    }
  }

  async getContent(url) {
    // Check cache first
    if (this.cache.has(url)) {
      this.log('Loading from cache:', url);
      return this.cache.get(url);
    }

    this.log('Fetching:', url);
    
    // Make AJAX request with SPA headers
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'text/html'
      }
    });
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    }

    const html = await response.text();
    this.cacheContent(url, html);
    
    return html;
  }

  cacheContent(url, html) {
    // Limit cache size
    if (this.cache.size >= (this.config.cacheSize || 50)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(url, html);
    this.log('Cached:', url);
  }

  async updateMainContent(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Check if this is a SPA response (from theme.liquid)
    const spaData = doc.querySelector('#spa-response-data');
    
    let newTitle = null;
    let newMain = null;
    
    if (spaData) {
      // SPA response format
      newTitle = spaData.getAttribute('data-title');
      newMain = spaData.querySelector('#MainContent');
    } else {
      // Regular page response
      const titleEl = doc.querySelector('title');
      newTitle = titleEl ? titleEl.textContent : null;
      newMain = doc.querySelector('#MainContent');
    }
    
    // Update page title
    if (newTitle) {
      document.title = newTitle;
    }
    
    // Update main content
    if (newMain) {
      this.replaceMainContent(newMain);
    }

    // Re-initialize components and scroll to top
    this.reinitializeComponents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  replaceMainContent(newMain) {
    const currentMain = document.querySelector('#MainContent');
    
    if (!currentMain) return;

    // Copy content
    currentMain.innerHTML = newMain.innerHTML;
    
    // Copy data attributes
    for (let i = 0; i < newMain.attributes.length; i++) {
      const attr = newMain.attributes[i];
      if (attr.name.startsWith('data-')) {
        currentMain.setAttribute(attr.name, attr.value);
      }
    }
  }

  reinitializeComponents() {
    // Dispatch SPA navigation event
    document.dispatchEvent(new CustomEvent('spa:navigation', {
      detail: { url: this.currentUrl }
    }));

    // Re-initialize Shopify components
    this.reinitializeShopifyComponents();
    
    // Re-initialize theme components
    this.reinitializeThemeComponents();
  }

  reinitializeShopifyComponents() {
    // Re-initialize Shopify payment buttons
    if (window.Shopify && window.Shopify.PaymentButton) {
      window.Shopify.PaymentButton.init();
    }

    // Re-initialize product forms
    const productForms = document.querySelectorAll('form[action*="/cart/add"]');
    productForms.forEach(function(form) {
      // Re-attach form handlers if needed
      if (form.addEventListener) {
        // Form will be handled by existing scripts
      }
    });
  }

  reinitializeThemeComponents() {
    // Re-initialize theme-specific components
    const componentSelectors = [
      'cart-discount',
      'blog-posts-list', 
      'accordion-custom',
      'show-more',
      'quick-add',
      'product-form',
      'variant-picker',
      'predictive-search',
      'slideshow'
    ];

    componentSelectors.forEach(function(selector) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(function(element) {
        // Try different initialization methods
        if (element.connectedCallback) {
          element.connectedCallback();
        } else if (element.init) {
          element.init();
        }
      });
    });

    // Re-run any global initialization scripts
    if (window.theme && window.theme.init) {
      window.theme.init();
    }
  }

  handlePopState() {
    const self = this;
    window.addEventListener('popstate', function(e) {
      if (e.state && e.state.spa) {
        self.navigateTo(window.location.href, false);
      }
    });
  }

  showLoadingState() {
    document.body.classList.add('spa-loading');
  }

  hideLoadingState() {
    document.body.classList.remove('spa-loading');
  }

  initPrefetching() {
    if (!this.config.prefetchEnabled) return;

    const self = this;

    // Prefetch on hover
    document.addEventListener('mouseover', function(e) {
      let target = e.target;
      let link = null;
      
      // Find closest link
      while (target && target !== document) {
        if (target.tagName === 'A' && target.href) {
          link = target;
          break;
        }
        target = target.parentNode;
      }
      
      if (link && self.shouldPrefetch(link.href)) {
        self.prefetch(link.href);
      }
    });

    // Prefetch visible links
    if (window.IntersectionObserver) {
      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            const link = entry.target;
            if (link.href && self.shouldPrefetch(link.href)) {
              self.prefetch(link.href);
            }
          }
        });
      }, { rootMargin: '100px' });

      // Observe product and collection links
      setTimeout(function() {
        const links = document.querySelectorAll('a[href*="/products/"], a[href*="/collections/"], a[href*="/pages/"]');
        links.forEach(function(link) {
          observer.observe(link);
        });
      }, 1000);
    }
  }

  shouldPrefetch(url) {
    if (!url) return false;
    
    return url !== this.currentUrl &&
           !this.cache.has(url) &&
           !this.prefetchQueue.has(url);
  }

  async prefetch(url) {
    if (this.prefetchQueue.has(url)) return;
    
    this.prefetchQueue.add(url);
    this.log('Prefetching:', url);
    
    try {
      await this.getContent(url);
    } catch (error) {
      this.log('Prefetch failed:', url, error);
    } finally {
      this.prefetchQueue.delete(url);
    }
  }

  setupViewTransitions() {
    if (!document.startViewTransition) return;

    const mainContent = document.querySelector('#MainContent');
    if (mainContent && mainContent.style) {
      mainContent.style.viewTransitionName = 'main-content';
    }
  }
}

// Initialize SPA Router
function initSPARouter() {
  if (!window.horizonSPARouter) {
    window.horizonSPARouter = new HorizonSPARouter();
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSPARouter);
} else {
  initSPARouter();
}