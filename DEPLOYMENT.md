# DEPLOYMENT TƏLİMATI

## 1. Vercel env vars yoxla

Aşağıdakı dəyişənlər `Settings → Environment Variables`-də olmalıdır:

```
META_ACCESS_TOKEN
META_AD_ACCOUNT_ID
ODOO_URL
ODOO_DB
ODOO_USERNAME
ODOO_API_KEY
NEXT_PUBLIC_SUPABASE_URL    (vacib: NEXT_PUBLIC_ prefiksi ilə)
NEXT_PUBLIC_SUPABASE_ANON_KEY  (vacib: NEXT_PUBLIC_ prefiksi ilə)
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_SHEETS_API_KEY       (yeni)
CLINIC_SHEET_ID             (yeni)
ACADEMY_SHEET_ID            (yeni)
```

Əgər `SUPABASE_URL`/`SUPABASE_ANON_KEY` adı ilə varsa, eyni dəyərlərlə `NEXT_PUBLIC_` versiyalarını əlavə et (köhnələri silmə).

## 2. GitHub-a upload

1. `meta-ads-dashboard` repo aç
2. Sağ üstdə **Add file → Upload files**
3. ZIP-i extract et, içindəki **bütün faylları və qovluqları** sürüklə (ZIP-i deyil, içindəkiləri)
4. Commit message: `v3 redesign`
5. **Commit changes**

## 3. Vercel auto-deploy

Push olan kimi Vercel build başladır (~2-3 dəq). Status `vercel.com/dashboard`-da görünür.

## 4. Test

`ads-dashboard-six-fawn.vercel.app` aç → login ol → hər dropdown və filteri test et.
