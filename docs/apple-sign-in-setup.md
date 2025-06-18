# Apple Sign In Setup Guide

This guide will help you set up Sign in with Apple for the Stock Pick Game application.

## Prerequisites

- Apple Developer Account
- Vercel Account
- Domain verification for `stockpickgame.tideye.com`

## Apple Developer Portal Setup

1. Log in to [Apple Developer Portal](https://developer.apple.com)
2. Go to "Certificates, Identifiers & Profiles"
3. Under "Identifiers", click "+" to add a new identifier
4. Select "Services IDs" and click "Continue"
5. Enter the following details:
   - Description: Stock Pick Game
   - Identifier: com.apple.stockpickgame
6. Click "Continue" and then "Register"
7. Select the newly created Services ID and click "Configure"
8. Under "Sign In with Apple", check "Enable as a primary App ID"
9. Add the domain `stockpickgame.tideye.com` and return URL `https://stockpickgame.tideye.com/api/apple-auth`
10. Click "Save"

## Vercel Environment Variables

Set up the following environment variables in your Vercel project:

```bash
APPLE_TEAM_ID=FVSY7CFC3S
APPLE_CLIENT_ID=com.apple.stockpickgame
APPLE_KEY_ID=HT9H537F36
APPLE_PRIVATE_KEY=<contents of your .p8 file>
APPLE_REDIRECT_URI=https://stockpickgame.tideye.com/api/apple-auth
```

To set up the environment variables:

1. Go to your Vercel project dashboard
2. Click on "Settings"
3. Go to "Environment Variables"
4. Add each variable listed above
5. For `APPLE_PRIVATE_KEY`, paste the entire contents of your .p8 file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines

## Local Development

1. Create a `.env` file in the project root with the same environment variables
2. Run the development server:

   ```bash
   npm run dev
   ```

## Testing

1. Local Testing:
   - Start the development server
   - Open the application in your browser
   - Click the Apple Sign In button
   - Complete the sign-in flow
   - Check the browser console for any errors
   - Verify the backend logs for successful token verification

2. Production Testing:
   - Deploy to Vercel
   - Test the sign-in flow on the production domain
   - Verify that the environment variables are correctly set
   - Check Vercel logs for any errors

## Troubleshooting

Common issues and solutions:

1. "Invalid client" error:
   - Verify the Services ID in Apple Developer Portal
   - Check that the client ID matches exactly

2. Token verification failures:
   - Ensure the private key is correctly formatted in environment variables
   - Verify the Team ID and Key ID are correct

3. Redirect URI errors:
   - Confirm the domain is verified in Apple Developer Portal
   - Check that the redirect URI matches exactly

4. SDK loading issues:
   - Check browser console for script loading errors
   - Verify the domain is allowed in your Content Security Policy

## Security Considerations

1. Always use HTTPS in production
2. Keep your private key secure and never commit it to version control
3. Regularly rotate your private key
4. Monitor for suspicious activity
5. Implement rate limiting on the auth endpoint

## Support

For issues or questions:

1. Check the Apple Developer documentation
2. Review the Vercel deployment logs
3. Contact the development team
