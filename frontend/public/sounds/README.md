# Notification Sounds

This directory should contain the following notification sound files:

- `message.mp3` - Sound for new message notifications
- `appointment.mp3` - Sound for appointment notifications

## Current Status

⚠️ **Sound files are currently missing**. The application will automatically fall back to Web Audio API-generated beep sounds with different tones:
- Message notifications: 800Hz tone
- Appointment notifications: 600Hz tone

## Adding Custom Sound Files

You can add custom notification sounds by placing the files in this directory:

1. **Download sounds** from these free resources:
   - **Zapsplat** (https://www.zapsplat.com/) - Free sounds with registration
   - **Freesound** (https://freesound.org/) - Community-driven sound library
   - **Notification Sounds** (https://notificationsounds.com/) - Dedicated notification sounds

2. **Recommended characteristics**:
   - Duration: 0.5 - 2 seconds
   - Format: MP3 or WAV
   - Size: < 100KB
   - Volume: Normalized to avoid startling users

3. **File names** (must match exactly):
   - `message.mp3` - For chat/message notifications
   - `appointment.mp3` - For appointment notifications

## How It Works

The notification system will:
1. First try to load and play the custom MP3 files
2. If files don't exist or fail to load, automatically fall back to generated audio tones
3. Each notification type has a distinct tone frequency for easy identification

No code changes are needed - just add the sound files and they will be used automatically!