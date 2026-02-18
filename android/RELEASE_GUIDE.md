# Android Release Build Guide

This guide will help you build a production-ready Android APK/AAB for GoWaay.

## Prerequisites

- Java JDK 8 or higher installed
- Android SDK configured
- `keytool` command available (comes with JDK)

## Step 1: Generate Production Keystore

### Option A: Using the Script (Recommended)

```bash
cd android
./generate-keystore.sh
```

The script will:
- Prompt you for keystore password
- Generate `gowaay-release.keystore` in `android/app/` directory
- Show you the values to put in `keystore.properties`

### Option B: Manual Generation

```bash
cd android/app
keytool -genkeypair -v \
    -storetype PKCS12 \
    -keystore gowaay-release.keystore \
    -alias gowaay-key \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass YOUR_KEYSTORE_PASSWORD \
    -keypass YOUR_KEY_PASSWORD \
    -dname "CN=GoWaay, OU=Mobile, O=GoWaay, L=Dhaka, ST=Dhaka, C=BD"
```

**⚠️ IMPORTANT:** 
- Keep the keystore file and passwords safe
- You'll need this keystore for ALL future app updates
- If you lose it, you cannot update your app on Google Play Store

## Step 2: Create keystore.properties

1. Copy the example file:
```bash
cd android
cp keystore.properties.example keystore.properties
```

2. Edit `keystore.properties` and fill in your actual values:
```properties
storeFile=gowaay-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=gowaay-key
keyPassword=YOUR_KEY_PASSWORD
```

**Note:** `keystore.properties` is already in `.gitignore` - it will NOT be committed to git.

## Step 3: Update Version Numbers

Before each release, update version numbers in `android/app/build.gradle`:

```gradle
versionCode 2        // Increment for each release (1, 2, 3, ...)
versionName "1.0.1"  // Semantic versioning (1.0.0, 1.0.1, 1.1.0, ...)
```

## Step 4: Build Release APK

### Clean Build
```bash
cd android
./gradlew clean
```

### Build APK
```bash
cd android
./gradlew assembleRelease
```

The APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Build AAB (for Google Play Store)
```bash
cd android
./gradlew bundleRelease
```

The AAB will be generated at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## Step 5: Test the Release Build

Before uploading to Play Store, test the release build:

1. Install on a real device:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

2. Test all features:
   - Login/Registration
   - Property search
   - Booking flow
   - Payment
   - Chat/Messaging
   - Push notifications
   - Image uploads

## Step 6: Upload to Google Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing app
3. Upload the AAB file (not APK)
4. Fill in store listing details
5. Complete content rating
6. Submit for review

## Troubleshooting

### Build Fails with "Keystore not found"
- Make sure `gowaay-release.keystore` exists in `android/app/` directory
- Check that `keystore.properties` has correct path

### Build Fails with "Wrong password"
- Verify passwords in `keystore.properties` match the keystore
- Make sure there are no extra spaces or quotes

### App crashes on release build
- Check ProGuard rules if minification is enabled
- Test with `minifyEnabled false` first
- Check logs: `adb logcat`

## Current Configuration

- **Package Name:** `com.gowaay`
- **Min SDK:** 23
- **Target SDK:** 33
- **Version Code:** 1
- **Version Name:** 1.0.0
- **API Base URL (Production):** `https://api.gowaay.com/api`
- **Image Base URL (Production):** `https://images.gowaay.com`

## Security Notes

- ✅ `keystore.properties` is in `.gitignore`
- ✅ `*.keystore` files are in `.gitignore` (except debug.keystore)
- ⚠️ Never commit keystore files or passwords to git
- ⚠️ Store keystore backup in secure location
- ⚠️ Use environment variables or secure vault for CI/CD
