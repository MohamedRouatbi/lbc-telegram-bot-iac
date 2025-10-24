# Testing Guide

## 📋 Test Structure

```
tests/
├── lambdas/              # Unit tests for Lambda functions
│   ├── telegramWebhook.test.ts
│   └── jobWorker.test.ts
└── acceptance/           # E2E acceptance tests
    └── webhook-e2e.test.ts
```

## 🧪 Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Acceptance Tests (E2E)

```bash
# Set environment variables
export WEBHOOK_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/telegram/webhook
export AWS_REGION=us-east-1
export EVENTS_TABLE_NAME=lbc-events-dev-v2
export USERS_TABLE_NAME=lbc-users-dev-v2

# Run acceptance tests
npm run test:e2e
```

**⚠️ Important**: Acceptance tests run against your **deployed AWS stack**. Make sure:

1. Stack is deployed (`npm run cdk:deploy`)
2. AWS credentials are configured
3. Environment variables are set correctly

## 📮 Postman Collection

### Import Collection

1. Open Postman
2. Import `postman/collection.json`
3. Collection includes:
   - ✅ POST Message webhook
   - ✅ POST Callback query webhook
   - ✅ GET request (should fail with 405)
   - ✅ POST Invalid body (should fail with 400)

### Configure Environment

The collection uses variable `{{WEBHOOK_URL}}`:

- Current value: `https://1mi1qv7d67.execute-api.us-east-1.amazonaws.com`
- Update if you deploy to a different region/account

### Running Tests in Postman

1. Select the collection
2. Click "Run" to execute all tests
3. View results in the runner

## 🔄 CI/CD Pipeline

### GitHub Actions

The project includes CI pipeline (`.github/workflows/ci.yml`):

**On Push/PR:**

- ✅ Lint code (`npm run lint`)
- ✅ Run unit tests (`npm test`)
- ✅ Build TypeScript (`npm run build`)
- ✅ Test on Node 18.x and 20.x

**On Pull Requests:**

- ✅ Run CDK diff to show infrastructure changes
- ✅ Comment PR with changes

### Setup GitHub Actions

1. Push code to GitHub
2. Add repository secrets:
   ```
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_ACCOUNT_ID=025066266747
   ```
3. CI will run automatically on push/PR

## 🎯 Test Coverage

Current test files:

- ✅ `telegramWebhook.test.ts` - Basic unit tests (expand with SQS mocking)
- ✅ `jobWorker.test.ts` - Basic unit tests (expand with DynamoDB mocking)
- ✅ `webhook-e2e.test.ts` - Full E2E flow tests

**TODO - Expand Coverage:**

- [ ] Mock SQS in webhook tests
- [ ] Mock DynamoDB in worker tests
- [ ] Add integration tests for lib functions
- [ ] Add load testing scenarios
- [ ] Add security/validation tests

## 📊 Test Reports

### View Coverage Report

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### CI Coverage

Coverage is automatically uploaded to Codecov on CI runs (Node 20.x only).

## 🐛 Debugging Tests

### Enable Verbose Logging

```bash
DEBUG=* npm test
```

### Run Single Test File

```bash
npm test -- telegramWebhook.test.ts
```

### Debug in VS Code

1. Set breakpoint in test file
2. Press F5 (Debug: Jest Current File)
3. Step through code

## 🔐 Testing Best Practices

1. **Unit Tests**: Mock all AWS SDK calls
2. **Integration Tests**: Use LocalStack or test stack
3. **E2E Tests**: Run against deployed dev environment
4. **Never**: Test against production
5. **Always**: Clean up test data after E2E tests

## 📝 Adding New Tests

### Unit Test Example

```typescript
import { handler } from '../../src/lambdas/myLambda';

jest.mock('@aws-sdk/client-dynamodb');

describe('myLambda', () => {
  it('should do something', async () => {
    const result = await handler(mockEvent);
    expect(result.statusCode).toBe(200);
  });
});
```

### E2E Test Example

```typescript
describe('E2E: My Feature', () => {
  it('should complete full flow', async () => {
    // 1. Send request
    const response = await axios.post(WEBHOOK_URL, payload);

    // 2. Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Verify in DynamoDB
    const data = await dynamoClient.send(getCommand);
    expect(data.Item).toBeDefined();
  });
});
```
