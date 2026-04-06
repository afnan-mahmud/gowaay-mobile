#!/bin/bash
# Post-install script to patch libraries for compatibility

# Patch react-native-fast-image: add namespace for AGP 8+
FAST_IMAGE_GRADLE="node_modules/react-native-fast-image/android/build.gradle"
if [ -f "$FAST_IMAGE_GRADLE" ]; then
  if ! grep -q 'namespace' "$FAST_IMAGE_GRADLE"; then
    sed -i '' 's/android {/android {\
    namespace "com.dylanvann.fastimage"/' "$FAST_IMAGE_GRADLE"
    echo "Patched react-native-fast-image: added namespace"
  fi
fi

# Patch react-native-screens: fix codegen issue with HeaderSubviewTypes
HEADER_SUBVIEW="node_modules/react-native-screens/src/fabric/ScreenStackHeaderSubviewNativeComponent.ts"
if [ -f "$HEADER_SUBVIEW" ]; then
  if grep -q 'CT.WithDefault<HeaderSubviewTypes' "$HEADER_SUBVIEW"; then
    sed -i '' "s/type?: CT.WithDefault<HeaderSubviewTypes, 'left'>/type?: CT.WithDefault<'back' | 'right' | 'left' | 'title' | 'center' | 'searchBar', 'left'>/" "$HEADER_SUBVIEW"
    echo "Patched react-native-screens: inlined HeaderSubviewTypes for codegen"
  fi
fi

# Patch react-native-screens: add 16KB page alignment flag
RNS_CMAKE="node_modules/react-native-screens/android/CMakeLists.txt"
if [ -f "$RNS_CMAKE" ]; then
  if ! grep -q 'max-page-size' "$RNS_CMAKE"; then
    echo '' >> "$RNS_CMAKE"
    echo '# 16KB page alignment for Android 15+' >> "$RNS_CMAKE"
    echo 'target_link_options(rnscreens PRIVATE "-Wl,-z,max-page-size=16384")' >> "$RNS_CMAKE"
    echo "Patched react-native-screens: added 16KB page alignment"
  fi
fi

echo "Post-install patches complete"
