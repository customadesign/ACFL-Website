# Square Credentials Configuration Guide

## Issue Found
Your current credentials appear to be mixing sandbox and production values, which is causing the `InvalidApplicationIdError`.

## How to Get Correct Square Sandbox Credentials

### Step 1: Go to Square Developer Dashboard
Visit: https://developer.squareup.com/apps

### Step 2: Select Your Application
Click on your application name

### Step 3: Get Sandbox Credentials

#### For Backend (.env in /backend):
```bash
# Square Configuration
SQUARE_ACCESS_TOKEN=EAAA... (Sandbox Access Token - from "Credentials" > "Sandbox" tab)
SQUARE_APPLICATION_ID=sandbox-sq0idb-XXXXXXXXXX (Sandbox Application ID)
SQUARE_ENVIRONMENT=sandbox
SQUARE_WEBHOOK_SECRET=sq0csb-... (Sandbox Webhook Signature Key)
```

#### For Frontend (.env in /frontend):
```bash
# Square Configuration (Frontend)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sandbox-sq0idb-XXXXXXXXXX (Same as backend)
NEXT_PUBLIC_SQUARE_LOCATION_ID=LXXXXXXXXXX (Get from Locations page in sandbox)
NEXT_PUBLIC_SQUARE_ENVIRONMENT=sandbox
```

## Finding Your Location ID

### Option 1: Square Dashboard
1. Go to https://squareup.com/dashboard/locations (make sure you're in Sandbox mode)
2. Click on your location
3. The Location ID will be in the URL or on the page

### Option 2: API Request
Run this command to get your sandbox location:

```bash
curl https://connect.squareupsandbox.com/v2/locations \
  -H "Authorization: Bearer YOUR_SANDBOX_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

Look for the "id" field in the response - that's your Location ID.

## Important Notes

### Sandbox vs Production

**Sandbox Application ID:**
- Format: `sandbox-sq0idb-XXXXXXXXXX`
- Used for: Testing
- Environment: sandbox

**Production Application ID:**
- Format: `sq0idb-XXXXXXXXXX` (no "sandbox-" prefix)
- Used for: Live payments
- Environment: production

### Access Token

**Sandbox Access Token:**
- Format: Starts with `EAAA` or `EAAAl`
- Used with: Sandbox Application ID
- Endpoint: https://connect.squareupsandbox.com

**Production Access Token:**
- Format: Starts with `EAAA` or similar
- Used with: Production Application ID
- Endpoint: https://connect.squareup.com

## Current Configuration Issues

Based on your error, here's what needs to be fixed:

1. ❌ Application ID `sq0idb-y8_HhxHrjtkaSophsubtxg` is missing the `sandbox-` prefix
2. ⚠️ Need to verify Access Token matches the sandbox environment
3. ⚠️ Need to verify Location ID is from sandbox locations

## Quick Fix

Replace your Square credentials in both `.env` files with values from:
**Square Developer Dashboard > Your App > Credentials > Sandbox tab**

Make sure:
- Application ID starts with `sandbox-`
- Access Token is from Sandbox section
- Location ID is from a sandbox location
- Environment is set to `sandbox`
