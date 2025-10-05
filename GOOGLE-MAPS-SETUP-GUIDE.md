# Google Maps API Setup Guide

## 🔧 Fixing the injectScript Error

The `injectScript` error you're experiencing is caused by the Google Maps API not being properly configured. This guide will help you set up the Google Maps API key correctly.

## Step 1: Get a Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create or Select a Project**
   - Create a new project or select an existing one
   - Note your project ID

3. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Search for and enable these APIs:
     - **Maps JavaScript API** (for the map display)
     - **Places API** (for address autocomplete)
     - **Geocoding API** (for address lookup)

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

## Step 2: Configure API Key Restrictions (Recommended)

1. **Set Application Restrictions**
   - Click on your API key to edit it
   - Under "Application restrictions", select "HTTP referrers (web sites)"
   - Add your domain(s):
     - `http://localhost:9002/*` (for development)
     - `https://yourdomain.com/*` (for production)

2. **Set API Restrictions**
   - Under "API restrictions", select "Restrict key"
   - Choose only the APIs you enabled:
     - Maps JavaScript API
     - Places API
     - Geocoding API

## Step 3: Set Up Environment Variables

1. **Create `.env.local` file** in your project root:
   ```bash
   # Google Maps API Key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   
   # Other environment variables...
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

2. **Replace `your_actual_api_key_here`** with the API key you copied from Google Cloud Console

## Step 4: Restart Your Development Server

After adding the environment variables:

```bash
# Stop your current development server (Ctrl+C)
# Then restart it
npm run dev
```

## Step 5: Test the Integration

1. **Navigate to the Profile page** (`/profile`)
2. **Check the Address field**:
   - If the API key is working: You'll see an autocomplete input
   - If there's an error: You'll see a message "Google Maps integration is not available"

## Troubleshooting

### Common Issues:

1. **"Google Maps integration is not available"**
   - Check if your API key is correctly set in `.env.local`
   - Verify the API key has the required APIs enabled
   - Make sure you've restarted your development server

2. **"This page can't load Google Maps correctly"**
   - Check your API key restrictions
   - Ensure your domain is added to the HTTP referrers list
   - Verify billing is enabled on your Google Cloud project

3. **"Quota exceeded"**
   - Check your Google Cloud Console for usage limits
   - Consider setting up billing if you haven't already

### Development vs Production:

- **Development**: Use `http://localhost:9002/*` in referrer restrictions
- **Production**: Use your actual domain `https://yourdomain.com/*`

## Cost Considerations

Google Maps API has usage limits:
- **Free tier**: $200 credit per month
- **Maps JavaScript API**: $7 per 1,000 loads
- **Places API**: $17 per 1,000 requests
- **Geocoding API**: $5 per 1,000 requests

For development, you'll likely stay within the free tier limits.

## Security Best Practices

1. **Always restrict your API key** to specific domains
2. **Use different API keys** for development and production
3. **Monitor your usage** in Google Cloud Console
4. **Set up billing alerts** to avoid unexpected charges

## Need Help?

If you're still experiencing issues:

1. Check the browser console for specific error messages
2. Verify your API key in Google Cloud Console
3. Ensure all required APIs are enabled
4. Check that your domain restrictions are correct

The error handling I've added will gracefully fall back to manual address entry if Google Maps is not available, so your application will continue to work even without the API key.
