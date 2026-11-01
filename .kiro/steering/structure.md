---
inclusion: always
---
# Estructura del repo

```
/apps
  /voice-gateway      Servidor WebSocket de Twilio Media Streams, máquina de estados de la llamada
  /notifier           Lambda que envía alertas a la familia
  /family-panel       React: configuración guiada, historial, correcciones
  /grandma-phone      React: teléfono de la persona protegida (Twilio Voice JS)
  /judge-mode         React: demo vivo para el jurado
/packages
  /risk-engine        Motor de señales y puntaje (puro, con tests de propiedades)
  /design-tokens      Tokens de color, tipografía y movimiento
/prompts              Prompts del agente y del clasificador, en español
/evals                Guiones etiquetados (JSONL) y script de evaluación
/infra                AWS CDK
/docs                 Decisiones técnicas, demo HTML original
/.kiro                Specs, steering y hooks (versionado, requisito del hackathon)
```

Convenciones: un componente por archivo, nombres en inglés en el código y textos de interfaz en español.
