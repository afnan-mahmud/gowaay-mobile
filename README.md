# GoWaay Mobile App

React Native mobile app for GoWaay - Find Your Perfect Stay in Bangladesh.

## 📱 Features

### Guest Features
- ✅ User authentication (Login/Register)
- ✅ Browse featured properties
- ✅ Search and filter rooms
- ✅ View room details
- ✅ Book accommodations
- ✅ View booking history
- ✅ Chat with hosts
- ✅ Leave reviews
- ✅ User profile management

### Host Features
- 🏠 Host dashboard
- 📋 Manage listings
- 📅 View reservations
- 💰 Track earnings
- 💬 Chat with guests

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **React Native development environment**:
   - For iOS: Xcode (Mac only)
   - For Android: Android Studio

### Installation

```bash
# Navigate to mobile app directory
cd gowaay-mobile

# Install dependencies
npm install

# For iOS only (Mac required)
cd ios && pod install && cd ..
```

### Configuration

1. **Update API URLs** (if needed):
   - Edit `src/constants/config.ts`
   - For physical device testing, replace `localhost` with your computer's local IP

2. **Backend Server**:
   - Make sure the backend server is running at `http://localhost:8080`
   - Or update the API_BASE_URL in config.ts

### Running the App

#### Android

```bash
# Start Metro bundler
npm start

# In another terminal, run Android app
npm run android
```

#### iOS (Mac only)

```bash
# Start Metro bundler
npm start

# In another terminal, run iOS app
npm run ios
```

### Testing on Physical Device

#### Android
1. Enable USB Debugging on your phone:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable USB Debugging
2. Connect phone via USB
3. Run `npm run android`

#### iOS
1. Open `ios/GoWaay.xcworkspace` in Xcode
2. Select your device
3. Click Run (or Cmd + R)

## 📁 Project Structure

```
gowaay-mobile/
├── src/
│   ├── api/              # API client and endpoints
│   │   └── client.ts
│   ├── components/       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Loading.tsx
│   ├── constants/        # App constants and theme
│   │   ├── config.ts
│   │   ├── colors.ts
│   │   └── theme.ts
│   ├── context/          # React Context (Auth, etc.)
│   │   └── AuthContext.tsx
│   ├── navigation/       # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/          # App screens
│   │   ├── auth/         # Login, Register
│   │   ├── home/         # Home screen
│   │   ├── search/       # Search & filters
│   │   ├── bookings/     # Booking list
│   │   ├── messages/     # Chat
│   │   └── profile/      # User profile
│   └── types/            # TypeScript types
│       └── index.ts
├── App.tsx               # Main app component
├── package.json
└── tsconfig.json
```

## 🔧 Development

### Hot Reload
- Save files to see changes instantly
- Shake device or press Cmd/Ctrl + M for developer menu

### Debugging
- **React Native Debugger**: Install from GitHub
- **Chrome DevTools**: Enable "Debug JS Remotely" from dev menu
- **Console Logs**: View in Metro bundler terminal

### API Integration
All API calls go through the centralized client in `src/api/client.ts`:

```typescript
import { api } from '../api/client';

// Example: Load rooms
const response = await api.rooms.list({ page: 1, limit: 20 });
if (response.success) {
  setRooms(response.data.rooms);
}
```

## 🎨 Customization

### Theme
Edit `src/constants/theme.ts` and `src/constants/colors.ts` to customize:
- Colors
- Spacing
- Typography
- Shadows

### Components
Reusable components in `src/components/`:
- `Button` - Customizable button with variants
- `Input` - Text input with validation
- `Card` - Container component
- `Loading` - Loading indicator

## 📦 Building for Production

### Android APK/AAB

```bash
cd android

# Build Release APK
./gradlew assembleRelease

# Build App Bundle (for Play Store)
./gradlew bundleRelease

# Output locations:
# APK: android/app/build/outputs/apk/release/app-release.apk
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

### iOS IPA

1. Open Xcode: `open ios/GoWaay.xcworkspace`
2. Select "Any iOS Device"
3. Product → Archive
4. Distribute App → Upload to App Store

## 🐛 Troubleshooting

### Metro Bundler Issues
```bash
# Clear Metro cache
npm start -- --reset-cache
```

### Android Build Issues
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS Build Issues
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

### Network Issues
- For physical devices, use your computer's local IP instead of localhost
- Check firewall settings
- Ensure phone and computer are on same WiFi network

## 📝 TODO

- [ ] Room details screen
- [ ] Booking flow
- [ ] Payment integration (SSLCommerz)
- [ ] Push notifications
- [ ] Deep linking
- [ ] Offline support
- [ ] Image caching
- [ ] Host dashboard
- [ ] Chat functionality
- [ ] Reviews system

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Follow React Native best practices
4. Test on both iOS and Android
5. Update documentation

## 📄 License

Private - All rights reserved

## 📞 Support

For issues or questions, contact the development team.

---

**Happy Coding! 🚀**