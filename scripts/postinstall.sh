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

# Patch react-native-screens: fix Kotlin removeLast()/removeFirst() crash on Android < 15
# These Kotlin stdlib extension functions conflict with java.util.List methods added in Android 15,
# causing NoSuchMethodError on older devices.
SCREEN_STACK_KT="node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStack.kt"
if [ -f "$SCREEN_STACK_KT" ]; then
  PATCHED=false
  if grep -q '\.removeLast()' "$SCREEN_STACK_KT"; then
    sed -i '' 's/drawingOpPool\.removeLast()/drawingOpPool.removeAt(drawingOpPool.size - 1)/' "$SCREEN_STACK_KT"
    PATCHED=true
    echo "Patched react-native-screens: removeLast() → removeAt(size - 1)"
  fi
  if grep -q '\.removeFirst()' "$SCREEN_STACK_KT"; then
    sed -i '' 's/drawingOpPool\.removeFirst()/drawingOpPool.removeAt(0)/' "$SCREEN_STACK_KT"
    PATCHED=true
    echo "Patched react-native-screens: removeFirst() → removeAt(0)"
  fi
  if grep -q 'removeAt(lastIndex)' "$SCREEN_STACK_KT"; then
    sed -i '' 's/removeAt(lastIndex)/removeAt(drawingOpPool.size - 1)/' "$SCREEN_STACK_KT"
    PATCHED=true
    echo "Patched react-native-screens: removeAt(lastIndex) → removeAt(size - 1)"
  fi
  if [ "$PATCHED" = false ]; then
    echo "react-native-screens: already patched or no changes needed"
  fi
fi

echo "Post-install patches complete"
