---
inclusion: always
---
# Tech stack

- Language: strict TypeScript across the repo, Node 20+.
- Telephony: Twilio Voice (PSTN and Voice JS SDK), Media Streams over WebSocket.
- Speech: Amazon Nova Sonic on Bedrock; fallback Transcribe streaming + Claude on Bedrock + Polly neural voices.
- Infrastructure: AWS CDK. ECS Fargate (gateway), Lambda (notifier), DynamoDB single table, S3 with SSE-KMS, KMS, EventBridge, Cognito, CloudFront.
- Frontend: React + Vite, no component libraries; styling with the tokens in `packages/design-tokens`.
- Testing: Vitest, fast-check for properties, `npm run eval` for the script set.

Rules:
- `packages/risk-engine` imports nothing network-related and nothing from the AWS SDK; it is a pure function.
- Never commit secrets; read them from AWS Secrets Manager or from a local, ignored `.env`.
- Validate every LLM output with a schema (zod) before using it.
- Mask amounts and account numbers before persisting.
