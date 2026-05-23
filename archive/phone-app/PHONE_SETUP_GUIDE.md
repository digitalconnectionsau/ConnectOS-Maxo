# Android Phone Development Setup Guide

## Step 1: Enable Developer Options on Your Phone

1. **Open Settings** on your Android phone
2. **Scroll down** to "About phone" or "About device"
3. **Find "Build number"** (might be under "Software information")
4. **Tap "Build number" 7 times** rapidly
5. You'll see a message: "You are now a developer!"

## Step 2: Enable USB Debugging

1. **Go back** to main Settings
2. **Find "Developer options"** (usually under System → Advanced)
3. **Toggle on "Developer options"** if it's off
4. **Enable "USB debugging"** 
5. **Enable "Install via USB"** (if available)
6. **Optional**: Enable "Stay awake" to keep screen on while charging

## Step 3: Connect Phone to Computer

1. **Connect your phone** to Mac with USB cable
2. **Select "File Transfer" or "MTP"** mode when prompted
3. **Allow USB debugging** when the dialog appears on your phone
4. **Check "Always allow from this computer"** for future convenience

## Step 4: Verify Connection

Run this command to check if your phone is detected:
```bash
export PATH=$PATH:~/Library/Android/sdk/platform-tools && adb devices
```

You should see something like:
```
List of devices attached
ABC123DEF456    device
```

## Step 5: Build and Install App

Once your phone is detected, we can build and install:
```bash
cd /Users/craigparker/Development/projects/phone-system/phone-app/android
./gradlew assembleDebug
./gradlew installDebug
```

## Troubleshooting

### Phone Not Detected
- Try different USB cable
- Try different USB port
- Restart ADB: `adb kill-server && adb start-server`
- Check USB connection mode (should be File Transfer/MTP)
- Revoke USB debugging authorizations in Developer Options and reconnect

### Permission Denied
- Make sure USB debugging is enabled
- Check the authorization dialog on your phone
- Try: `adb kill-server && sudo adb start-server`

### Build Errors
- Make sure you have Java 8+ installed
- Check Gradle permissions: `chmod +x gradlew`
- Clean build: `./gradlew clean`

## Next Steps After Installation

1. **Open the Phone System app** on your phone
2. **Grant required permissions** (microphone, phone, storage)
3. **Configure settings**:
   - Choose Twilio as provider
   - Enter your credentials or login to web platform
4. **Test connection** and make a test call

Your phone will now be a mobile extension of your Phone System! 📞