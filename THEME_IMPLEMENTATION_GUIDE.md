# Theme Implementation Guide - Quick Reference

## 🎨 What's Been Done

### Dark/Light Theme System
- **CSS Variables**: 19 theme-aware variables covering all design aspects
- **Auto Detection**: System theme preference detection via `prefers-color-scheme`
- **Manual Toggle**: Theme toggle button (☀️/🌙) on all pages
- **Persistence**: User's theme choice saved to localStorage

### Pages Updated (6/6)
✅ `index.html` - Landing page with theme toggle
✅ `login.html` - Login page with theme support
✅ `dashboard.html` - Main dashboard with modern cards
✅ `torrents.html` - Torrents list with theme styling
✅ `statistics.html` - Statistics with modern cards
✅ `settings.html` - Settings page with theme awareness

### New Files Created
- `js/theme.js` (2.8 KB) - Complete theme management system
- `css/modern-ui.css` (Enhanced) - Theme variables + glassmorphism

---

## 🎯 Quick Start

### Using Theme Toggle
Users can click the button in the top-right corner of any page:
- **Light Theme Icon**: 🌙 (moon)
- **Dark Theme Icon**: ☀️ (sun)
- Theme preference automatically saved

### Theme Colors at a Glance

| Element | Light Theme | Dark Theme |
|---------|------------|-----------|
| Background | #ffffff | #1a1a2e |
| Text Primary | #1a1a2e | #ffffff |
| Glass Cards | rgba(255,255,255,0.8) | rgba(255,255,255,0.08) |
| Borders | rgba(0,0,0,0.08) | rgba(255,255,255,0.15) |
| Shadows | Soft/subtle | Deep/prominent |

---

## 🛠 Developer Guide

### CSS Variables Available
```css
/* Colors */
--bg-primary          /* Main background */
--bg-secondary        /* Secondary background */
--bg-tertiary         /* Tertiary background */
--text-primary        /* Main text */
--text-secondary      /* Secondary text */
--text-tertiary       /* Tertiary text */
--border-color        /* Border colors */

/* Components */
--glass-bg            /* Glass card background */
--glass-border        /* Glass card border */
--nav-bg              /* Navigation background */
--stat-bg             /* Stat card background */
--input-bg            /* Input background */
--input-border        /* Input border */

/* Effects */
--shadow-sm           /* Small shadow */
--shadow-md           /* Medium shadow */
--shadow-lg           /* Large shadow */
```

### Using Variables in CSS
```css
.my-card {
  background: var(--glass-bg);
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-md);
}
```

### Adding Theme Support to New Pages

1. **Add theme attribute to HTML tag:**
```html
<html lang="en" data-theme="light">
```

2. **Load theme.js before other scripts:**
```html
<script src="/js/theme.js"></script>
```

3. **Load modern-ui.css:**
```html
<link rel="stylesheet" href="/css/modern-ui.css">
```

4. **Add theme toggle button (optional):**
```html
<button class="theme-toggle-btn" onclick="themeManager.toggleTheme()">
  <span x-text="themeManager.isDarkTheme() ? '☀️' : '🌙'"></span>
</button>
```

---

## 🎬 JavaScript API

### Theme Manager Methods

```javascript
// Get current theme
const theme = themeManager.getCurrentTheme();  // Returns 'light' or 'dark'

// Check if dark theme is active
if (themeManager.isDarkTheme()) {
  console.log('Using dark theme');
}

// Toggle between themes
themeManager.toggleTheme();

// Set specific theme
themeManager.setTheme('dark', true);  // true = save to localStorage

// Listen for theme changes
themeManager.onThemeChange((newTheme) => {
  console.log('Theme changed to:', newTheme);
  // Update custom components here
});

// Get saved theme preference
const saved = themeManager.getSavedTheme();

// Get system theme preference
const system = themeManager.getSystemTheme();
```

---

## 📱 Responsive Design Details

### Breakpoints
- **Desktop**: 1024px+ (full layout)
- **Tablet**: 768px - 1023px (medium layout)
- **Mobile**: 480px - 767px (compact layout)
- **Small Mobile**: < 480px (minimal layout)

### Mobile Features
- Touch-friendly 44x44px tap targets
- Vertical stacking on small screens
- Reduced font sizes and padding
- Full-width buttons and inputs
- Landscape mode optimizations

---

## 🎨 Component Highlights

### Glassmorphism Cards
```html
<div class="glass-card">
  <!-- Content here -->
</div>
```

### Stat Cards
```html
<div class="stat-card">
  <div class="stat-label">Label</div>
  <div class="stat-value">42</div>
  <div class="stat-subtitle">Subtitle</div>
</div>
```

### Modern Buttons
```html
<button class="modern-btn modern-btn-primary">Primary Button</button>
<button class="modern-btn modern-btn-secondary">Secondary Button</button>
<button class="modern-btn modern-btn-danger">Danger Button</button>
<button class="modern-btn modern-btn-success">Success Button</button>
```

### Modern Inputs
```html
<input type="text" class="modern-input" placeholder="Enter text...">
```

### Navigation
```html
<nav class="modern-nav">
  <a href="#" class="modern-nav-link active">Active</a>
  <a href="#" class="modern-nav-link">Link</a>
</nav>
```

---

## 🎯 Design System Colors

### Primary Palette
- **Primary Gradient**: #667eea → #764ba2 (Purple-Blue)
- **Secondary Gradient**: #f093fb → #f5576c (Pink-Red)
- **Success Gradient**: #11998e → #38ef7d (Teal-Mint)
- **Warning Color**: #ffa726 (Orange)
- **Error Color**: #f5576c (Red)

### Theme-Specific Colors
**Light Theme:**
- Backgrounds are light and airy
- Text is dark for maximum readability
- Shadows are subtle and soft
- Borders are barely visible

**Dark Theme:**
- Backgrounds are deep and sophisticated
- Text is bright for contrast
- Shadows are more prominent
- Borders have more visibility

---

## 🔍 Testing the Theme

### Manual Testing
1. Open any page in the application
2. Click the theme toggle button (top-right corner)
3. Verify all colors change smoothly
4. Refresh the page - theme preference should persist
5. Check on mobile devices (iPhone, Android)

### Browser DevTools
```javascript
// In console, test theme switching
themeManager.toggleTheme();           // Switch theme
themeManager.setTheme('dark', true);  // Force dark
themeManager.setTheme('light', true); // Force light
```

### CSS Debugging
```javascript
// Check computed theme variables
const root = getComputedStyle(document.documentElement);
console.log(root.getPropertyValue('--bg-primary'));
```

---

## 📋 Checklist for New Features

When adding new UI components:

- [ ] Use `var(--*)` for all colors and effects
- [ ] Test in both light and dark themes
- [ ] Ensure 44x44px touch targets on mobile
- [ ] Check contrast ratios (WCAG AA)
- [ ] Test on 3 screen sizes (mobile, tablet, desktop)
- [ ] Verify no layout shift on theme change
- [ ] Test with reduced motion preferences

---

## 🚀 Performance Notes

- No runtime performance impact
- CSS variables are native (no compilation needed)
- Theme switch is instant (no FOUC)
- localStorage usage: < 1KB
- No unnecessary repaints/reflows

---

## 🐛 Troubleshooting

### Theme not changing
- Ensure `theme.js` loads before other scripts
- Check browser localStorage is enabled
- Clear cache and refresh

### Colors look wrong
- Verify `modern-ui.css` is linked
- Check `data-theme` attribute on `<html>`
- Inspect computed styles in DevTools

### Mobile layout issues
- Check viewport meta tag is present
- Verify CSS media queries are correct
- Test in actual mobile browser (not just DevTools)

---

## 📚 References

- CSS Variables Spec: https://www.w3.org/TR/css-variables-1/
- Prefers Color Scheme: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- Backdrop Filter: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter

---

**Last Updated**: November 6, 2025
**Implementation Status**: ✅ Complete
**Pages Updated**: 6/6
**Theme Variables**: 19
**Responsive Breakpoints**: 4
