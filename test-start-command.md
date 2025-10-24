# Testing /start Command Flow

## Test Bot

Your Telegram bot token: `8313709159:AAHnxnh5l-RLCuhPeANs8OFC-D4SZ4yIoEU`

Bot username: **@LBC_test_123_bot** (find this with @BotFather)

## Test Scenarios

### Test 1: Basic /start (no token)

1. Open Telegram
2. Search for your bot: @LBC_test_123_bot
3. Send: `/start`
4. **Expected behavior:**
   - Bot should send welcome message with video link
   - Video link should be a signed CloudFront URL
   - Click the video link to verify it plays
   - Message should have inline button: "I watched the video ✅"
   - Check DynamoDB: user should be in state `WELCOME_VIDEO_SENT`

### Test 2: Continue flow - trigger TTS generation

1. After receiving the video link, click the inline button "I watched the video ✅"
2. **Expected behavior:**
   - Bot should generate personalized TTS greeting (with your first name)
   - Bot should send audio message with signed CloudFront URL
   - Audio should be in your language (or English if no language_code)
   - Message should have inline button: "Continue ▶️"
   - Check DynamoDB: user should be in state `TTS_SENT`
   - Check S3 TTS bucket: audio file should be cached

### Test 3: Complete onboarding

1. After receiving the TTS audio, click the inline button "Continue ▶️"
2. **Expected behavior:**
   - Bot should send completion message
   - Check DynamoDB: user should be in state `DONE`

### Test 4: /start with referral token

1. Generate a referral token:

```javascript
// Create token: base64url(ref_code|utm_source|utm_medium|utm_campaign|nonce|timestamp)
const params = 'PARTNER123|facebook|cpc|spring2025|xyz|' + Date.now();
const token = Buffer.from(params).toString('base64url');
console.log('Token:', token);
```

2. Send to bot: `/start TOKEN`
3. **Expected behavior:**
   - Same flow as Test 1
   - Check DynamoDB: user record should have:
     - `ref_code`: "PARTNER123"
     - `utm.source`: "facebook"
     - `utm.medium`: "cpc"
     - `utm.campaign`: "spring2025"

### Test 5: Resume interrupted flow

1. Send `/start` again (while in WELCOME_VIDEO_SENT or TTS_SENT state)
2. **Expected behavior:**
   - Should resume from current state (not restart)
   - Should execute the next action based on FSM

## Check Lambda Logs

```powershell
# Watch jobWorker logs in real-time
aws logs tail /aws/lambda/jobWorker-dev-v2 --follow
```

## Check DynamoDB

```powershell
# Get user record
aws dynamodb get-item --table-name lbc-users-dev-v2 --key '{"userId":{"S":"YOUR_TELEGRAM_USER_ID"}}'
```

## Check S3 TTS Cache

```powershell
# List TTS audio files
aws s3 ls s3://lbc-telegram-onboarding-tts-dev-v2-025066266747/tts/ --recursive
```

## Troubleshooting

### Bot doesn't respond

1. Check SQS queue has messages:

   ```powershell
   aws sqs get-queue-attributes --queue-url https://sqs.us-east-1.amazonaws.com/025066266747/lbc-telegram-events-dev-v2 --attribute-names ApproximateNumberOfMessages
   ```

2. Check Lambda errors:
   ```powershell
   aws logs filter-log-events --log-group-name /aws/lambda/jobWorker-dev-v2 --filter-pattern "ERROR" --max-items 10
   ```

### Video/Audio links don't work

1. Check CloudFront distribution status:

   ```powershell
   aws cloudfront get-distribution --id EJZVF1YW4OFE8 --query "Distribution.Status"
   ```

2. Verify S3 files exist:
   ```powershell
   aws s3 ls s3://lbc-telegram-onboarding-assets-dev-v2-025066266747/media/welcome/v1/
   ```

### DynamoDB not updating

1. Check Lambda IAM permissions
2. Review CloudWatch logs for DynamoDB errors

## Expected Log Flow

When you send `/start`, you should see logs like:

```
[INFO] Detected /start command
[INFO] Decoding start token...
[INFO] Token attributes: { ref_code: 'PARTNER123', ... }
[INFO] Creating/updating user...
[INFO] Current state: NEW
[INFO] Next state: WELCOME_VIDEO_SENT
[INFO] Signing CloudFront URL for welcome video...
[INFO] Sending welcome message...
[INFO] Message sent successfully
[INFO] Updating user state to WELCOME_VIDEO_SENT
```

## Success Criteria

- ✅ Bot responds to `/start`
- ✅ Video link works and plays the welcome video
- ✅ Inline button click triggers TTS generation
- ✅ TTS audio is generated and sent
- ✅ Audio link works and plays personalized greeting
- ✅ User can complete onboarding flow
- ✅ DynamoDB records user state correctly
- ✅ Referral/UTM tracking works
- ✅ S3 TTS caching works (second greeting is instant)
