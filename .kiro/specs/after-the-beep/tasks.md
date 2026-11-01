# Plan de implementación — After the Beep

Ventana: 30 de octubre al 4 de diciembre de 2026, cierre a las 2:00 PM hora del Pacífico. Meta: tener todo funcional el 27 de noviembre y dejar la última semana para pulir, grabar y escribir.

## Semana 1 (30 oct – 6 nov): cimientos y el riesgo técnico más grande

- [ ] 1. Crear el monorepo con la estructura de `structure.md`, licencia MIT y `/.kiro` versionado
  - Confirmar que `.kiro` no está en `.gitignore`
  - _Requisitos: entrega del hackathon_
- [ ] 2. Prueba de concepto de voz en español
  - Twilio número de prueba → Media Stream → gateway local con ngrok
  - Probar Nova Sonic en español; si no hay soporte, montar Transcribe + Claude + Polly
  - Medir latencia por turno y anotar la decisión en `docs/decisiones.md`
  - _Requisitos: 1.1, 1.2, 11.1_
- [ ] 3. Implementar `packages/risk-engine` con el catálogo del Anexo A solo con reglas
  - _Requisitos: 4.1, 4.2, 4.3, 4.4_
- [ ] 4. Escribir los 6 tests de propiedades con fast-check
  - _Requisitos: 4.3, 4.4, 3.2, 9.1_
- [ ] 5. Verificación de palabra clave con normalización y Levenshtein, máximo 2 intentos
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5_

## Semana 2 (7 – 13 nov): la llamada completa

- [ ] 6. Gateway: máquina de estados de la llamada (aviso, identificación, verificación, decisión)
  - _Requisitos: 1.1–1.4, 5.1–5.4_
- [ ] 7. Clasificador LLM con salida JSON estricta y timeout de 2 s con respaldo a reglas
  - _Requisitos: 4.6_
- [ ] 8. Respuesta automática ante pedidos de códigos o PIN
  - _Requisitos: 4.5_
- [ ] 9. Lista de contactos y modo estricto
  - _Requisitos: 2.1, 2.2, 2.3_
- [ ] 10. Persistencia en DynamoDB y grabaciones en S3 con SSE-KMS y ciclo de vida de 30 días
  - _Requisitos: 9.1, 9.2, 9.5_
- [ ] 11. Infraestructura en AWS CDK: Fargate, DynamoDB, S3, KMS, EventBridge, Lambda, Cognito
  - _Requisitos: 9.3_

## Semana 3 (14 – 20 nov): la familia y la abuela

- [ ] 12. Lambda notificador con plantilla de alerta y reintentos
  - _Requisitos: 6.1, 6.2, 6.3, 6.4_
- [ ] 13. Paquete `design-tokens` con los tokens de `design.md` y modo claro/oscuro
- [ ] 14. Panel familiar: configuración guiada de 5 pasos con consentimiento explícito
  - _Requisitos: 7.1, 7.4, 9.4_
- [ ] 15. Panel familiar: historial, detalle de llamada y corrección de veredicto
  - _Requisitos: 7.2, 7.3_
- [ ] 16. Teléfono de la abuela con Twilio Voice JS, anuncio previo y contador LED
  - _Requisitos: 5.2, 8.1–8.4_

## Semana 4 (21 – 27 nov): modo jurado y evaluación

- [ ] 17. Modo jurado: llamada desde el navegador al hogar de demostración, con la máquina, el medidor y la transcripción en vivo
  - Reutilizar los componentes del demo HTML
  - _Requisitos: 10.1–10.4_
- [ ] 18. Conjunto de evaluación de 60+ guiones en español basados en tipologías IC3 y FTC
  - _Requisitos: 12.1_
- [ ] 19. Script `npm run eval` y hook que lo ejecuta al cambiar reglas o prompts
  - _Requisitos: 12.2, 12.3, 12.4_
- [ ] 20. Ajustar pesos hasta cumplir ≥ 90% de detección y < 5% de falsos positivos
- [ ] 21. Prueba extremo a extremo de latencia en staging
  - _Requisitos: 11.1, 11.2_
- [ ] 22. Congelar funcionalidades el 27 de noviembre

## Semana 5 (28 nov – 4 dic): pulir y entregar

- [ ] 23. Revisión de accesibilidad: contraste AAA, foco visible, movimiento reducido, lector de pantalla
- [ ] 24. Guion y grabación del video de 3 minutos
  - 0:00–0:20 la cifra del IC3 y la llamada del "nieto"
  - 0:20–1:30 llamada en vivo bloqueada, con el medidor y la alerta llegando al celular de la cuidadora
  - 1:30–2:15 llamada de la hija verificada con palabra clave y timbre a la abuela
  - 2:15–2:45 cómo se construyó con Kiro: specs, hooks, steering, MCP, tests de propiedades
  - 2:45–3:00 resultados de la evaluación y cierre
- [ ] 25. Write-up de uso de Kiro en Devpost
- [ ] 26. Post de blog público y post social con #Kiroween26 para los premios extra
- [ ] 27. Revisión final de la entrega: repo público, licencia, URL funcional, credenciales de prueba en el README, categoría seleccionada
- [ ] 28. Enviar antes del 3 de diciembre para tener un día de margen
