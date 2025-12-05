# Phone System Android App

A professional Android dialer application with dual voice provider support (Twilio and MaxoTel PBX) integrated with the Phone System web platform.

## Features

- **Dual Provider Support**: Connect to either Twilio Voice or MaxoTel PBX
- **Professional Dialer Interface**: Material Design 3 components with number pad
- **Call Management**: Make, receive, hold, mute, and transfer calls
- **Secure Settings**: Encrypted storage of provider credentials
- **Real-time Status**: Live connection status and call duration tracking
- **Permissions Management**: Automatic audio and phone permission handling

## Prerequisites

- Android Studio Arctic Fox or later
- Android SDK API 21+ (Android 5.0 Lollipop)
- Java 8 or later
- Gradle 8.2+

## Setup Instructions

### 1. Open Project in Android Studio

1. Open Android Studio
2. Select "Open an existing Android Studio project"
3. Navigate to `phone-app/android/` directory
4. Click "OK" to open the project

### 2. Provider Configuration

#### Twilio Setup
1. Create a Twilio account at [twilio.com](https://www.twilio.com)
2. Get your Account SID and Auth Token from the console
3. Purchase a Twilio phone number
4. Configure the app settings with these credentials

#### MaxoTel PBX Setup
1. Get your MaxoTel server address from your administrator
2. Obtain your username, password, and extension
3. Configure the app settings with these credentials

### 3. Build and Install

#### Using Android Studio
1. Connect your Android device or start an emulator
2. Click the "Run" button or press Shift+F10
3. Select your target device
4. The app will build and install automatically

#### Using Command Line
```bash
cd phone-app/android
./gradlew assembleDebug
./gradlew installDebug
```

## App Configuration

### First Time Setup
1. Launch the app
2. Tap the settings icon (⚙️) in the top right
3. Select your preferred voice provider (Twilio or MaxoTel)
4. Enter your provider credentials:

#### For Twilio:
- Account SID
- Auth Token  
- From Phone Number

#### For MaxoTel PBX:
- Server Address
- Username
- Password
- Extension

5. Tap "Save Settings"
6. Tap "Test Connection" to verify setup

### Making Calls
1. Enter the phone number using the dialer pad
2. Tap the green call button
3. The app will connect through your configured provider
4. Use the call controls (mute, speaker, hold) as needed
5. Tap the red hang up button to end the call

## Project Structure

```
android/
├── app/
│   ├── src/main/
│   │   ├── java/com/digitalconnections/phonesystem/
│   │   │   ├── MainActivity.kt          # Main dialer interface
│   │   │   ├── CallActivity.kt          # Active call management
│   │   │   ├── SettingsActivity.kt      # Provider configuration
│   │   │   ├── VoiceService.kt          # Twilio integration
│   │   │   ├── SettingsManager.kt       # Secure preferences
│   │   │   └── viewmodel/               # MVVM ViewModels
│   │   ├── res/
│   │   │   ├── layout/                  # UI layouts
│   │   │   ├── values/                  # Strings, colors, styles
│   │   │   ├── drawable/                # Icons and shapes
│   │   │   └── menu/                    # Menu definitions
│   │   └── AndroidManifest.xml          # App permissions and components
│   ├── build.gradle                     # App-level build configuration
│   └── proguard-rules.pro              # Code obfuscation rules
├── gradle/wrapper/                      # Gradle wrapper files
├── build.gradle                         # Project-level build configuration
├── settings.gradle                      # Project settings
└── gradlew                             # Gradle wrapper script
```

## Key Components

### MainActivity
- Number pad interface for dialing
- Provider status display
- Call initiation
- Settings access

### CallActivity
- Active call interface
- Call controls (mute, speaker, hold)
- Call duration tracking
- Contact information display

### SettingsActivity
- Provider selection (Twilio/MaxoTel)
- Credential configuration
- Connection testing
- Settings validation

### VoiceService
- Twilio Voice SDK integration
- Call state management
- Audio handling
- Provider switching

### SettingsManager
- Encrypted credential storage
- Provider configuration
- Security best practices

## Integration with Web Platform

The Android app integrates seamlessly with the Phone System web platform:

- **Shared Authentication**: Uses the same billing system and user accounts
- **Call History**: Syncs with web platform call logs
- **Contact Management**: Accesses the same contact database
- **Billing Integration**: Calls are billed through the same Stripe system

## Permissions

The app requires the following permissions:

- `RECORD_AUDIO`: For voice calls
- `MODIFY_AUDIO_SETTINGS`: For call audio management
- `USE_SIP`: For VoIP functionality (MaxoTel)
- `INTERNET`: For network connectivity
- `ACCESS_NETWORK_STATE`: For connection status
- `WAKE_LOCK`: To keep device awake during calls

## Security Features

- **Encrypted Storage**: All credentials stored using Android Keystore
- **Secure Communications**: TLS encryption for all network traffic
- **Permission Validation**: Runtime permission checks
- **Input Sanitization**: Phone number and credential validation

## Troubleshooting

### Connection Issues
1. Verify internet connectivity
2. Check provider credentials in settings
3. Test connection using the "Test Connection" button
4. Ensure firewall/network allows VoIP traffic

### Audio Issues
1. Check microphone permissions
2. Verify audio settings (speaker/earpiece)
3. Test with different audio sources
4. Check device volume levels

### Build Issues
1. Ensure Android SDK is up to date
2. Clean and rebuild project: `./gradlew clean build`
3. Check Gradle wrapper permissions: `chmod +x gradlew`
4. Verify all dependencies are downloaded

## API Integration

The app communicates with the web platform APIs:

- **Authentication**: `/api/auth/login`
- **Call History**: `/api/calls`
- **Contacts**: `/api/contacts`
- **Billing**: `/api/billing/usage`

## Development

### Adding New Features
1. Follow MVVM architecture pattern
2. Use Material Design 3 components
3. Add appropriate unit tests
4. Update documentation

### Testing
```bash
# Unit tests
./gradlew test

# Instrumented tests
./gradlew connectedAndroidTest

# Build release APK
./gradlew assembleRelease
```

## Support

For support with the Android app:
1. Check the troubleshooting section above
2. Review logs in Android Studio
3. Contact your system administrator for provider configuration
4. Submit issues through your organization's support channel

## License

This application is part of the Phone System platform. All rights reserved.