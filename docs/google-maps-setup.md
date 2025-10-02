# Google Maps API Setup Guide

## Issue: Autocomplete Not Working

The autocomplete functionality requires a Google Maps API key to be configured. If autocomplete is not working, it's likely because the API key is missing or not properly configured.

## Setup Steps

### 1. Get Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API** (for fallback functionality)

### 2. Configure API Key

Add the following environment variable to your `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. Restrict API Key (Recommended)

For security, restrict your API key:

1. Go to **APIs & Services** > **Credentials**
2. Click on your API key
3. Under **Application restrictions**, select **HTTP referrers**
4. Add your domain(s):
   - `localhost:9006/*` (for development)
   - `yourdomain.com/*` (for production)

### 4. Restart Development Server

After adding the environment variable, restart your development server:

```bash
npm run dev
```

## Verification

1. Open the browser console
2. Navigate to the deliveries page
3. Look for these console messages:
   - `Google Maps API Key configured: true`
   - `Initializing Google Maps autocomplete...`
   - `Initializing pickup autocomplete...`
   - `Initializing delivery autocomplete...`

## Troubleshooting

### Common Issues

1. **API Key Not Found**
   - Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is in `.env.local`
   - Restart the development server
   - Check console for error messages

2. **API Not Enabled**
   - Ensure Maps JavaScript API and Places API are enabled
   - Check Google Cloud Console for API status

3. **Quota Exceeded**
   - Check your Google Cloud Console billing
   - Verify API quotas and limits

4. **Domain Restrictions**
   - Ensure your domain is added to API key restrictions
   - For development, add `localhost:9006/*`

### Testing Autocomplete

1. Go to `/partners/deliveries`
2. Click "New Delivery"
3. Start typing in the "Pickup Address" field
4. You should see Google Places suggestions appear

## Cost Optimization

The implementation includes several cost optimization features:

- **Session tokens** for grouped requests
- **Country restrictions** (Philippines only)
- **Request delay** to reduce API calls
- **Fallback geocoding** for edge cases
- **Performance monitoring** in development mode

## Support

If you continue to have issues:

1. Check the browser console for error messages
2. Verify API key configuration
3. Ensure all required APIs are enabled
4. Check Google Cloud Console for quota and billing issues

