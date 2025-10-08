# Facebook Login Setup Guide

This guide will help you set up Facebook authentication for your LocalPro application.

## Prerequisites

- Firebase project already configured
- Facebook Developer account
- Access to Firebase Console

## Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"Create App"**
3. Choose **"Consumer"** as the app type
4. Fill in the required information:
   - **App Name**: Your app name (e.g., "LocalPro")
   - **App Contact Email**: Your email address
   - **App Purpose**: Select appropriate purpose
5. Click **"Create App"**

## Step 2: Configure Facebook App

1. In your Facebook App dashboard, go to **"Settings"** > **"Basic"**
2. Note down your **App ID** and **App Secret** (you'll need these for Firebase)
3. Add your app domains:
   - **App Domains**: Add your production domain (e.g., `localpro.asia`)
   - **Privacy Policy URL**: Add your privacy policy URL
   - **Terms of Service URL**: Add your terms of service URL

## Step 3: Add Facebook Login Product

1. In your Facebook App dashboard, go to **"Products"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Choose **"Web"** as the platform
4. Enter your website URL (e.g., `https://localpro.asia`)
5. Click **"Save"**

## Step 4: Configure Facebook Login Settings

1. Go to **"Facebook Login"** > **"Settings"**
2. Add these **Valid OAuth Redirect URIs**:
   ```
   https://your-project-id.firebaseapp.com/__/auth/handler
   http://localhost:3000/__/auth/handler
   ```
   Replace `your-project-id` with your actual Firebase project ID.

## Step 5: Configure Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **"Authentication"** > **"Sign-in method"**
4. Click on **"Facebook"** provider
5. Toggle **"Enable"**
6. Enter your Facebook **App ID** and **App Secret**
7. Click **"Save"**

## Step 6: Test Facebook Login

1. Start your development server: `npm run dev`
2. Go to your login page
3. Click **"Login with Facebook"**
4. You should see the Facebook login popup
5. Complete the login process

## Troubleshooting

### Common Issues

1. **"App Not Setup" Error**
   - Make sure your Facebook app is in **Development** mode
   - Add your Facebook account as a developer/tester

2. **"Invalid OAuth Redirect URI" Error**
   - Check that your redirect URIs in Facebook app settings match exactly
   - Make sure you've added both production and development URLs

3. **"App Domain Mismatch" Error**
   - Ensure your app domain in Facebook settings matches your website domain
   - For development, you may need to add `localhost` to app domains

4. **"Permissions Error"**
   - Make sure your Facebook app has the necessary permissions
   - Check that `email` and `public_profile` permissions are requested

### Development vs Production

**Development Mode:**
- Only developers and testers can use the app
- Limited to 25 users
- No app review required

**Production Mode:**
- Available to all users
- Requires Facebook app review for certain permissions
- Must have privacy policy and terms of service

## Security Considerations

1. **App Secret**: Never expose your Facebook App Secret in client-side code
2. **Domain Validation**: Always validate domains in Facebook app settings
3. **HTTPS**: Use HTTPS in production for secure authentication
4. **Permissions**: Only request necessary permissions from users

## Required Permissions

The Facebook login implementation requests these permissions:
- `email`: To get user's email address
- `public_profile`: To get user's basic profile information

## Additional Resources

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/web)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/facebook-login)
- [Facebook App Review Process](https://developers.facebook.com/docs/app-review)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Facebook app configuration
3. Ensure Firebase authentication is properly set up
4. Check that all URLs and domains are correctly configured
