
# Downloading Your Expo Project

## Method 1: Export Static Bundle

To export your project as static files:

```bash
# Export for production
npx expo export

# Export for specific platform
npx expo export --platform ios
npx expo export --platform android
npx expo export --platform web
```

This creates a `dist` folder with your bundled app that can be:
- Uploaded to hosting services
- Embedded in native apps
- Used for offline distribution

## Method 2: Download Source Code

If you're working in a cloud environment and want the source code locally:

### Using Git (Recommended)
```bash
# Clone your repository
git clone <your-repo-url>
cd your-project

# Install dependencies
npm install
# or
yarn install

# Start development server
npx expo start
```

### Manual Download
1. Download all project files as a ZIP
2. Extract to your local machine
3. Open terminal in project directory
4. Run `npm install` to install dependencies
5. Run `npx expo start` to begin development

## Method 3: Create Development Build

For testing on physical devices:

```bash
# Install EAS CLI globally
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for Android (APK)
eas build --platform android --profile preview

# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile preview
```

## Method 4: Web Export

For web deployment:

```bash
# Export for web
npx expo export --platform web

# The web files will be in dist folder
# Upload dist folder contents to your web hosting service
```

## Testing Your Downloaded Project

After downloading:

1. **Install Dependencies**: `npm install`
2. **Start Development Server**: `npx expo start`
3. **Test on Device**: 
   - Scan QR code with Expo Go app
   - Or use `npx expo start --android` / `npx expo start --ios`
4. **Build for Production**: Use EAS Build for app store deployment

## File Structure You'll Get

```
your-project/
├── app/                 # Your app screens and navigation
├── components/          # Reusable UI components
├── contexts/           # React contexts (like InventoryContext)
├── utils/              # Utility functions (like excelExport)
├── types/              # TypeScript type definitions
├── styles/             # Styling files
├── assets/             # Images, fonts, etc.
├── package.json        # Dependencies and scripts
├── app.json           # Expo configuration
├── tsconfig.json      # TypeScript configuration
└── babel.config.js    # Babel configuration
```

## Next Steps After Download

1. **Development**: Use `npx expo start` for local development
2. **Testing**: Test on physical devices or simulators
3. **Building**: Use EAS Build for production builds
4. **Deployment**: Submit to app stores or deploy web version
