---
inclusion: always
---
# Stack técnico

- Lenguaje: TypeScript estricto en todo el repo, Node 20.
- Telefonía: Twilio Voice (PSTN y Voice JS SDK), Media Streams por WebSocket.
- Voz: Amazon Nova Sonic en Bedrock; respaldo Transcribe streaming + Claude en Bedrock + Polly neural.
- Infraestructura: AWS CDK. ECS Fargate (gateway), Lambda (notificador), DynamoDB tabla única, S3 con SSE-KMS, KMS, EventBridge, Cognito, CloudFront.
- Frontend: React + Vite, sin librerías de componentes; estilos con los tokens de `packages/design-tokens`.
- Pruebas: Vitest, fast-check para propiedades, `npm run eval` para el conjunto de guiones.

Reglas:
- `packages/risk-engine` no importa nada de red ni del SDK de AWS; es una función pura.
- Nunca subir secretos; se leen de AWS Secrets Manager o variables de entorno locales en `.env` ignorado.
- Toda salida del LLM se valida con un esquema (zod) antes de usarse.
- Montos y números de cuentas se enmascaran antes de persistir.
