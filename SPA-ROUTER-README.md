# Horizon SPA Router - Implementation Guide

## Overview
This SPA (Single Page Application) router provides fast client-side navigation for the Horizon Shopify theme without full page reloads. It uses AJAX to fetch content and smoothly transitions between pages using modern web APIs.

## Features
- ⚡ Fast client-side navigation
- 🎨 Smooth page transitions with View Transitions API
- 📱 Mobile-friendly
- 🔄 Intelligent prefetching
- 💾 Smart caching system
- 🎯 SEO-friendly (fallback to regular navigation)
- 🛠️ Easy to configure via theme settings

## How It Works

### 1. Link Interception
The router intercepts clicks on internal links and loads content via AJAX instead of full page navigation.

### 2. Content Loading
- Makes AJAX requests with `X-Requested-With: XMLHttpRequest` header
- Server detects SPA request and returns minimal HTML response
- Caches responses for faster subsequent visits

### 3. Content Replacement
- Replaces main content area (`#MainContent`) with new content
- Updates page title and URL
- Re-initializes JavaScript components

## Theme Settings

Access these settings in **Theme Settings > SPA Navigation**:

### Enable SPA Navigation
- **Default**: `true`
- **Description**: Master switch for SPA functionality

### Enable Link Prefetching
- **Default**: `true`
- **Description**: Preloads pages on hover/viewport for instant navigation

### Cache Size
- **Options**: 20, 50, 100 pages
- **Default**: 50 pages
- **Description**: Number of pages to keep in memory

### Page Transition Style
- **Options**: Fade, Slide, None
- **Default**: Fade
- **Description**: Animation style for page transitions

## Server Response Format

The theme automatically detects SPA requests and returns optimized responses:

```html
<!-- SPA Response -->
<div id="spa-response-data" 
     data-title="Page Title"
     data-url="/current-path"
     data-template="page">
  <main id="MainContent" class="content-for-layout" role="main">
    <!-- New page content -->
  </main>
</div>
```

## Debugging

### Console Logging
Enable debug mode by setting `debug: true` in theme settings or manually:

```javascript
window.horizonSPARouter.debug = true;
```

### Debug Messages
- `[SPA Router] Initializing...`
- `[SPA Router] Navigating to: /path`
- `[SPA Router] Loading from cache: /path`
- `[SPA Router] Prefetching: /path`
- `[SPA Router] Navigation completed in 150ms`

### Common Issues & Solutions

#### 1. SPA Not Working
**Check:**
- SPA is enabled in theme settings
- Browser supports required APIs (fetch, history.pushState)
- No JavaScript errors in console

**Fix:**
```javascript
// Manual check
console.log('SPA Config:', window.SPA_CONFIG);
console.log('SPA Router:', window.horizonSPARouter);
```

#### 2. Links Not Intercepted
**Check:**
- Links are internal (same hostname)
- Links don't have `data-no-spa` attribute
- Not admin/cart/checkout links

**Fix:**
```html
<!-- Disable SPA for specific links -->
<a href="/special-page" data-no-spa>Regular Navigation</a>
```

#### 3. Components Not Re-initializing
**Check:**
- Component selectors in `reinitializeThemeComponents()`
- Components have `connectedCallback()` or `init()` methods

**Fix:**
```javascript
// Listen for SPA navigation
document.addEventListener('spa:navigation', function(e) {
  console.log('SPA navigated to:', e.detail.url);
  // Re-initialize your components here
});
```

## Customization

### Exclude Links from SPA
```html
<!-- These links will use regular navigation -->
<a href="/external-site" data-no-spa>External Link</a>
<a href="/cart" data-no-spa>Cart</a>
<a href="#section" data-no-spa>Anchor Link</a>
```

### Add Custom Component Re-initialization
```javascript
// Listen for SPA navigation events
document.addEventListener('spa:navigation', function(e) {
  // Re-initialize your custom components
  initializeCustomSliders();
  initializeCustomForms();
});
```

### Custom Prefetch Rules
```javascript
// Modify prefetch behavior
window.horizonSPARouter.shouldPrefetch = function(url) {
  // Your custom logic here
  return url.includes('/products/') || url.includes('/collections/');
};
```

## Performance Tips

### 1. Optimize Cache Size
- Small sites: 20 pages
- Medium sites: 50 pages  
- Large sites: 100 pages

### 2. Strategic Prefetching
- Enable for product/collection pages
- Disable for content-heavy pages

### 3. Monitor Performance
```javascript
// Check cache usage
console.log('Cache size:', window.horizonSPARouter.cache.size);
console.log('Prefetch queue:', window.horizonSPARouter.prefetchQueue.size);
```

## Browser Support

### Modern Browsers (Full Features)
- Chrome 85+
- Firefox 80+
- Safari 14+
- Edge 85+

### Legacy Browsers (Fallback)
- Falls back to regular navigation
- No SPA functionality
- Full compatibility maintained

## API Reference

### HorizonSPARouter Methods

#### `navigateTo(url, pushState)`
```javascript
// Navigate to a URL
window.horizonSPARouter.navigateTo('/products/example');

// Navigate without updating history
window.horizonSPARouter.navigateTo('/products/example', false);
```

#### `prefetch(url)`
```javascript
// Prefetch a URL
window.horizonSPARouter.prefetch('/collections/featured');
```

#### `isSupported()`
```javascript
// Check if SPA is supported
if (window.horizonSPARouter.isSupported()) {
  console.log('SPA is supported');
}
```

### Events

#### `spa:navigation`
```javascript
document.addEventListener('spa:navigation', function(e) {
  console.log('Navigated to:', e.detail.url);
});
```

## Troubleshooting Checklist

- [ ] SPA enabled in theme settings
- [ ] No JavaScript errors in console
- [ ] `window.SPA_CONFIG` exists
- [ ] `window.horizonSPARouter` exists
- [ ] Links are internal and valid
- [ ] Server returns proper SPA responses
- [ ] Components re-initialize after navigation

## Support

For issues or questions:
1. Check console for error messages
2. Verify theme settings configuration
3. Test with debug mode enabled
4. Check browser compatibility

---

*This SPA router is optimized for Shopify Liquid themes and provides a seamless navigation experience while maintaining SEO compatibility.* 