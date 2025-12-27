# Deployment Guide for /tms Subdirectory

## Changes Made

1. **vite.config.js** - Added `base: '/tms/'` to configure Vite for subdirectory deployment
2. **src/App.jsx** - Added `basename="/tms"` to BrowserRouter
3. **src/services/api.js** - Updated redirect path to use base path
4. **public/.htaccess** - Created Apache rewrite rules for client-side routing

## Steps to Deploy

1. **Rebuild the application:**
   ```bash
   npm run build
   ```

2. **Upload to Hostinger:**
   - Upload the entire contents of the `dist` folder to `public_html/tms/`
   - Make sure the `.htaccess` file is included in the upload

3. **Verify .htaccess is uploaded:**
   - The `.htaccess` file should be in `public_html/tms/.htaccess`
   - Ensure Apache mod_rewrite is enabled on Hostinger

4. **Test the deployment:**
   - Visit https://intaj-starstechnology.com/tms/
   - Should redirect to https://intaj-starstechnology.com/tms/login if not authenticated
   - All routes should work correctly

## Environment Variables (Optional)

If you want to change the base path without rebuilding, you can set:
```
VITE_BASE_PATH=/tms
```

## Troubleshooting

If routes still don't work:
1. Check that `.htaccess` file exists in `public_html/tms/`
2. Verify Apache mod_rewrite is enabled
3. Check browser console for any 404 errors
4. Ensure all asset paths are loading correctly (check Network tab)


