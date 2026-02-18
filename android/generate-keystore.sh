#!/bin/bash

# Script to generate production keystore for GoWaay Android app
# Run this script from the android/app directory

echo "🔐 Generating production keystore for GoWaay..."
echo ""

# Navigate to android/app directory
cd "$(dirname "$0")/app" || exit 1

# Check if keystore already exists
if [ -f "gowaay-release.keystore" ]; then
    echo "⚠️  WARNING: gowaay-release.keystore already exists!"
    read -p "Do you want to overwrite it? (yes/no): " overwrite
    if [ "$overwrite" != "yes" ]; then
        echo "❌ Keystore generation cancelled."
        exit 1
    fi
    rm -f gowaay-release.keystore
fi

# Prompt for keystore details
echo "Please provide the following information:"
read -p "Keystore Password: " -s storePassword
echo ""
read -p "Key Alias [gowaay-key]: " keyAlias
keyAlias=${keyAlias:-gowaay-key}
read -p "Key Password: " -s keyPassword
echo ""
read -p "Validity (days) [10000]: " validity
validity=${validity:-10000}

echo ""
echo "Generating keystore..."

# Generate keystore
keytool -genkeypair -v \
    -storetype PKCS12 \
    -keystore gowaay-release.keystore \
    -alias "$keyAlias" \
    -keyalg RSA \
    -keysize 2048 \
    -validity "$validity" \
    -storepass "$storePassword" \
    -keypass "$keyPassword" \
    -dname "CN=GoWaay, OU=Mobile, O=GoWaay, L=Dhaka, ST=Dhaka, C=BD"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore generated successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Create keystore.properties file in android/ directory:"
    echo "   storeFile=gowaay-release.keystore"
    echo "   storePassword=$storePassword"
    echo "   keyAlias=$keyAlias"
    echo "   keyPassword=$keyPassword"
    echo ""
    echo "2. Make sure keystore.properties is in .gitignore"
    echo "3. Keep gowaay-release.keystore file safe - you'll need it for all future updates!"
    echo ""
    echo "⚠️  IMPORTANT: Backup this keystore file securely. If you lose it, you cannot update your app!"
else
    echo ""
    echo "❌ Failed to generate keystore. Please check the error above."
    exit 1
fi
