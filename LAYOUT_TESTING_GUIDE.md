# Layout Testing Guide

## Cách kiểm tra layout đã được cải thiện

### 1. Kiểm tra trên các kích thước màn hình

#### Mobile (< 600px)
- [ ] Sidebar hiển thị dưới dạng drawer overlay
- [ ] Content chiếm toàn bộ width
- [ ] Form và Preview xếp theo column
- [ ] Header responsive với menu button

#### Tablet (600px - 900px)  
- [ ] Sidebar collapsed (64px width)
- [ ] Content centered trong không gian còn lại
- [ ] Layout vẫn responsive

#### Desktop (900px - 1200px)
- [ ] Sidebar mở rộng (280px width)
- [ ] Content centered hoàn hảo
- [ ] Form 500px, Preview flexible

#### Large Desktop (> 1200px)
- [ ] Content max-width 1400px
- [ ] Centered trong viewport
- [ ] Sidebar không ảnh hưởng centering

### 2. Kiểm tra các tính năng

#### Content Creator Layout
- [ ] Form panel có width cố định 500px trên desktop
- [ ] Preview panel chiếm không gian còn lại
- [ ] Gap 24px giữa các panels
- [ ] Mobile: stack vertically

#### Sidebar Behavior
- [ ] Desktop: Fixed position, không ảnh hưởng main content
- [ ] Mobile: Overlay drawer
- [ ] Smooth transitions khi toggle
- [ ] Search functionality hoạt động

#### Header
- [ ] Fixed position, z-index cao nhất
- [ ] Breadcrumbs hiển thị đúng
- [ ] User menu hoạt động
- [ ] Responsive trên mobile

### 3. Kiểm tra CSS Classes

#### Layout Classes
```css
.content-creator-layout - Main layout container
.content-creator-form - Form panel
.content-creator-preview - Preview panel
.content-centered - Centering utility
.layout-stable - Prevent layout shifts
```

#### Responsive Behavior
- [ ] Flexbox layout hoạt động đúng
- [ ] No horizontal scrolling
- [ ] Smooth transitions
- [ ] Proper spacing

### 4. Browser Testing

#### Chrome
- [ ] Layout centered
- [ ] Smooth animations
- [ ] No console errors

#### Firefox  
- [ ] CSS Grid/Flexbox support
- [ ] Proper rendering

#### Safari
- [ ] Webkit prefixes working
- [ ] Mobile Safari responsive

#### Edge
- [ ] Modern CSS features
- [ ] Proper fallbacks

### 5. Performance Checks

#### Layout Performance
- [ ] No layout thrashing
- [ ] Smooth scrolling
- [ ] Fast sidebar toggle
- [ ] Efficient re-renders

#### CSS Performance
- [ ] Hardware acceleration used
- [ ] Minimal repaints
- [ ] Optimized transitions

### 6. Accessibility Testing

#### Keyboard Navigation
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Skip links working

#### Screen Readers
- [ ] Proper ARIA labels
- [ ] Semantic HTML structure
- [ ] Content readable

### 7. Common Issues to Check

#### Layout Shifts
- [ ] No content jumping
- [ ] Stable during loading
- [ ] Consistent spacing

#### Overflow Issues
- [ ] No horizontal scroll
- [ ] Content fits viewport
- [ ] Proper text wrapping

#### Z-index Problems
- [ ] Sidebar below header
- [ ] Modals above everything
- [ ] Proper stacking context

### 8. Testing Tools

#### Browser DevTools
```javascript
// Check content centering
const main = document.querySelector('main');
const content = document.querySelector('.content-wrapper');
console.log('Main width:', main.clientWidth);
console.log('Content width:', content.clientWidth);
console.log('Is centered:', (main.clientWidth - content.clientWidth) / 2);
```

#### Responsive Testing
- Use Chrome DevTools device emulation
- Test on actual devices
- Check orientation changes

#### Performance Testing
- Lighthouse audit
- Performance tab in DevTools
- Check for layout thrashing

### 9. Manual Testing Checklist

#### Desktop Testing
1. Open app in desktop browser
2. Check content is centered
3. Toggle sidebar - content stays centered
4. Resize window - layout responsive
5. Check all breakpoints

#### Mobile Testing  
1. Open on mobile device
2. Check drawer overlay works
3. Test touch interactions
4. Check orientation changes
5. Verify no horizontal scroll

#### Cross-browser Testing
1. Test in Chrome, Firefox, Safari, Edge
2. Check CSS compatibility
3. Verify JavaScript functionality
4. Test on different OS

### 10. Debugging Tips

#### Layout Issues
```css
/* Add temporary borders to debug */
* { border: 1px solid red !important; }

/* Check box-sizing */
* { box-sizing: border-box !important; }

/* Debug flexbox */
.debug-flex {
  background: rgba(255,0,0,0.1) !important;
  border: 2px solid red !important;
}
```

#### JavaScript Debugging
```javascript
// Check viewport dimensions
console.log('Viewport:', window.innerWidth, 'x', window.innerHeight);

// Check element positions
const element = document.querySelector('.content-wrapper');
console.log('Element rect:', element.getBoundingClientRect());

// Check CSS values
const styles = getComputedStyle(element);
console.log('Computed styles:', styles.width, styles.marginLeft);
```

### 11. Expected Results

#### Perfect Centering
- Content should be visually centered in available space
- Equal margins on left and right (accounting for sidebar)
- No content shifting when sidebar toggles

#### Responsive Design
- Smooth transitions between breakpoints
- No horizontal scrolling at any size
- Touch-friendly on mobile

#### Performance
- 60fps animations
- Fast initial load
- Smooth scrolling

### 12. Rollback Plan

If issues are found:

1. **Immediate fixes**: Update CSS classes
2. **Component fixes**: Modify React components  
3. **Rollback**: Revert to previous Layout.tsx
4. **Alternative**: Use CSS Grid instead of Flexbox

### 13. Success Criteria

✅ **Layout is perfectly centered**
✅ **No content shifting with sidebar**  
✅ **Responsive on all devices**
✅ **Smooth animations**
✅ **No horizontal scrolling**
✅ **Accessible navigation**
✅ **Cross-browser compatible**
✅ **Performance optimized**

## Testing Commands

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

## Files to Monitor

- `frontend/src/components/common/Layout.tsx`
- `frontend/src/components/common/Sidebar.tsx`
- `frontend/src/components/content/ContentCreator.tsx`
- `frontend/src/styles/layout-fixes.css`
- `frontend/src/styles/improvements.css`