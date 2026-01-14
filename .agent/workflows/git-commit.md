---
description: Git commit və push workflow-u
---

# Git Commit Workflow

Bu workflow kod dəyişikliklərini commit və push etmək üçündür.

## Əvvəlcədən Yoxlamalar

1. **Lint yoxla**
   // turbo
   ```bash
   npm run lint
   ```

2. **Type errors yoxla**
   // turbo
   ```bash
   npx tsc --noEmit
   ```

3. **Build yoxla (əsas dəyişikliklər üçün)**
   ```bash
   npm run build
   ```

## Commit Addımları

4. **Status yoxla**
   // turbo
   ```bash
   git status
   ```

5. **Dəyişiklikləri əlavə et**
   ```bash
   git add .
   ```

6. **Commit et (mənalı mesajla)**
   ```bash
   git commit -m "type(scope): qısa təsvir"
   ```
   
   Commit types:
   - `feat`: Yeni xüsusiyyət
   - `fix`: Bug fix
   - `docs`: Sənədləşdirmə
   - `style`: Kod formatı
   - `refactor`: Refactoring
   - `chore`: Maintenance

7. **Push et**
   ```bash
   git push origin main
   ```

## Əgər Conflict Varsa

```bash
git pull origin main
# Conflict-ləri həll et
git add .
git commit -m "resolve: merge conflicts"
git push origin main
```

## Səhv Commit Mesajını Düzəltmək

```bash
# Son commit-i dəyiş (hələ push etməmisənsə)
git commit --amend -m "yeni mesaj"
```
