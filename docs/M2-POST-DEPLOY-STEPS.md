# M2 Post-Deployment Steps

After deploying the M2 CDK stack, follow these steps to complete the setup.

## Step 1: Generate CloudFront Key Pair

CloudFront signed URLs require an RSA key pair. Generate one:

```powershell
# Generate private key
openssl genrsa -out cloudfront-private-key.pem 2048

# Generate public key from private key
openssl rsa -pubout -in cloudfront-private-key.pem -out cloudfront-public-key.pem

# Display public key (copy this content)
cat cloudfront-public-key.pem
```

## Step 2: Update CloudFront Public Key in AWS Console

1. **Copy the public key content** from `cloudfront-public-key.pem` (including headers)
2. Go to AWS Console → **CloudFront** → **Public keys**
3. Find the key created by CDK (name: `SigningPublicKey`)
4. **Edit** the key and replace the placeholder with your actual public key
5. Save changes

## Step 3: Store CloudFront Private Key in Secrets Manager

```powershell
# Get the secret ARN from CDK output
$REGION = "us-east-1"
$SECRET_NAME = "/lbc/cf/privateKey-dev-v2"

# Read private key content
$PRIVATE_KEY = Get-Content cloudfront-private-key.pem -Raw

# Update secret
aws secretsmanager put-secret-value `
  --secret-id $SECRET_NAME `
  --secret-string $PRIVATE_KEY `
  --region $REGION
```

## Step 4: Store Telegram Bot Token in Secrets Manager

```powershell
$TELEGRAM_TOKEN = "8313709159:AAHnxnh5l-RLCuhPeANs8OFC-D4SZ4yIoEU"
$SECRET_NAME_BOT = "/lbc/tg_bot_token-dev-v2"

aws secretsmanager put-secret-value `
  --secret-id $SECRET_NAME_BOT `
  --secret-string $TELEGRAM_TOKEN `
  --region $REGION
```

## Step 5: Upload Welcome Videos to S3

The client will provide `welcome_en.mp4` and `welcome_es.mp4`. Upload them to S3:

```powershell
# Get bucket name from CDK output
$ASSETS_BUCKET = "lbc-telegram-onboarding-assets-dev-v2-025066266747"

# Upload welcome videos
aws s3 cp welcome_en.mp4 s3://$ASSETS_BUCKET/media/welcome/v1/welcome_en.mp4 --content-type video/mp4
aws s3 cp welcome_es.mp4 s3://$ASSETS_BUCKET/media/welcome/v1/welcome_es.mp4 --content-type video/mp4

# Verify uploads
aws s3 ls s3://$ASSETS_BUCKET/media/welcome/v1/
```

## Step 6: Test CloudFront Signed URL Generation

After redeploying the Lambda with the updated secrets:

```powershell
# Invoke jobWorker with a test /start command
# This will generate a signed URL and you can verify it works
```

## Step 7: Verify IAM Permissions

Ensure the jobWorker Lambda role has all required permissions:

- ✅ S3 GetObject on assets bucket (`media/welcome/*`)
- ✅ S3 GetObject/PutObject on TTS bucket (`tts/*`)
- ✅ KMS Encrypt/Decrypt on S3 KMS key
- ✅ Polly SynthesizeSpeech
- ✅ Secrets Manager GetSecretValue (both secrets)
- ✅ DynamoDB read/write on users, sessions, events tables

## Step 8: Redeploy Lambda After Secrets Update

After updating secrets, redeploy the Lambda to ensure it picks up the new values:

```powershell
npm run cdk:deploy
```

## CloudFormation Outputs Reference

After deployment, note these outputs:

- **CloudFrontDomain**: `dxxxxx.cloudfront.net` (use in signed URLs)
- **PublicKeyId**: CloudFront key pair ID (use in signed URLs)
- **AssetsBucketName**: Upload welcome videos here
- **TTSBucketName**: TTS cache storage (auto-populated by Lambda)
- **TelegramBotTokenSecretArn**: Where bot token is stored
- **CloudFrontPrivateKeySecretArn**: Where signing key is stored

## Testing Checklist

- [ ] CloudFront public key updated with actual RSA public key
- [ ] CloudFront private key stored in Secrets Manager
- [ ] Telegram bot token stored in Secrets Manager
- [ ] Welcome videos uploaded to S3 assets bucket
- [ ] Lambda redeployed with updated secrets
- [ ] Test `/start` command generates signed CloudFront URL
- [ ] Signed URL is accessible and expires after TTL (10 minutes)
- [ ] TTS audio is generated on first `/start` and cached in S3
- [ ] Second `/start` reuses cached TTS (no Polly call)
- [ ] User state advances: NEW → WELCOME_VIDEO_SENT → TTS_SENT → DONE

## Security Checklist

- [ ] S3 buckets have Block Public Access enabled
- [ ] S3 objects encrypted with KMS CMK
- [ ] CloudFront uses Origin Access Control (OAC)
- [ ] Signed URLs have short TTL (5-10 minutes)
- [ ] Private key is NOT committed to git
- [ ] IAM roles follow least privilege principle

## Troubleshooting

### Signed URL returns 403 Forbidden

- Verify CloudFront public key is updated (not placeholder)
- Check private key in Secrets Manager matches public key
- Verify Lambda has permission to read the secret

### TTS generation fails

- Check Lambda has `polly:SynthesizeSpeech` permission
- Verify Lambda has S3 PutObject permission on TTS bucket
- Check KMS key grants to Lambda role

### Videos not accessible

- Verify files uploaded to correct S3 path: `media/welcome/v1/welcome_<lang>.mp4`
- Check CloudFront distribution is deployed (not "In Progress")
- Verify OAC is configured correctly on both S3 bucket and CloudFront
