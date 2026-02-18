#!/bin/bash
# Post-install script to patch libraries for AGP 8+ compatibility

# Patch react-native-fast-image: add namespace for AGP 8+
FAST_IMAGE_GRADLE="node_modules/react-native-fast-image/android/build.gradle"
if [ -f "$FAST_IMAGE_GRADLE" ]; then
  if ! grep -q 'namespace' "$FAST_IMAGE_GRADLE"; then
    sed -i '' 's/android {/android {\
    namespace "com.dylanvann.fastimage"/' "$FAST_IMAGE_GRADLE"
    echo "Patched react-native-fast-image: added namespace"
  fi
fi

# Patch react-native-safe-area-context: add namespace for AGP 8+
SAFE_AREA_GRADLE="node_modules/react-native-safe-area-context/android/build.gradle"
if [ -f "$SAFE_AREA_GRADLE" ]; then
  if ! grep -q 'namespace' "$SAFE_AREA_GRADLE"; then
    sed -i '' 's/android {/android {\
    namespace "com.th3rdwave.safeareacontext"/' "$SAFE_AREA_GRADLE"
    echo "Patched react-native-safe-area-context: added namespace"
  fi
fi

# Patch react-native-webview: add namespace for AGP 8+
WEBVIEW_GRADLE="node_modules/react-native-webview/android/build.gradle"
if [ -f "$WEBVIEW_GRADLE" ]; then
  if ! grep -q 'namespace' "$WEBVIEW_GRADLE"; then
    sed -i '' 's/android {/android {\
    namespace "com.reactnativecommunity.webview"/' "$WEBVIEW_GRADLE"
    echo "Patched react-native-webview: added namespace"
  fi
fi

# Patch react-native-image-picker: remove unused JsonSlurper import (breaks Gradle 8+/Groovy 3+)
IMAGE_PICKER_GRADLE="node_modules/react-native-image-picker/android/build.gradle"
if [ -f "$IMAGE_PICKER_GRADLE" ]; then
  if grep -q 'import groovy.json.JsonSlurper' "$IMAGE_PICKER_GRADLE"; then
    sed -i '' '/import groovy.json.JsonSlurper/d' "$IMAGE_PICKER_GRADLE"
    echo "Patched react-native-image-picker: removed unused JsonSlurper import"
  fi
fi

echo "Post-install patches complete"
