---
description: Bug fix etmək üçün strukturlaşdırılmış yanaşma
---

# Bug Fix Workflow

Bu workflow bug-ları sistemli şəkildə həll etmək üçündür.

## 1. Problemi Anla

- Bug-ın tam təsvirini oxu
- Hansı səhifə/komponentdə olduğunu müəyyən et
- Gözlənilən davranış vs faktiki davranış

## 2. Reproduksiyon

- Dev server-i başlat
  // turbo
  ```bash
  npm run dev
  ```
  
- http://localhost:3000 adresində bug-ı reproduksiya et
- Console errors yoxla (DevTools → Console)
- Network requests yoxla (DevTools → Network)

## 3. Araşdırma

- Əlaqədar fayl(lar)ı tap
- Kod flow-nu izlə
- Console.log və ya breakpoints istifadə et

## 4. Fix Implementasiyası

- Ən kiçik mümkün dəyişikliyi et
- Yan təsirlərdən qaçın
- Mövcud kod stilinə uy

## 5. Yoxlama

- Bug düzəldildimi yoxla
  // turbo
  ```bash
  npm run lint
  ```

  // turbo
  ```bash
  npx tsc --noEmit
  ```

- Başqa şeylər pozulmadımı yoxla
- Edge cases test et

## 6. Commit

```bash
git add .
git commit -m "fix(component-name): bug-ın qısa təsviri"
```

## Debug Tips

### Console Logging
```typescript
console.log('Variable:', variable);
console.log('Props:', { ...props });
console.log('State:', state);
```

### Network Issues
```typescript
// API response yoxla
const response = await fetch('/api/endpoint');
console.log('Response:', await response.json());
```

### State Issues
```typescript
// useEffect ilə state dəyişikliklərini izlə
useEffect(() => {
  console.log('State changed:', state);
}, [state]);
```

## Ümumi Bug Kateqoriyaları

### TypeScript Errors
- Type mismatch
- Missing properties
- Null/undefined handling

### React Issues
- Infinite re-renders
- Stale closures
- Missing dependencies in useEffect

### API/Data Issues
- Wrong endpoint
- Missing authentication
- Data format mismatch

### Styling Issues
- CSS specificity
- Dark mode inconsistency
- Responsive breakpoints
