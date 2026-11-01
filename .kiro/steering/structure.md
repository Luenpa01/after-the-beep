---
inclusion: always
---
# Repo structure

```
/apps
  /voice-gateway      Twilio Media Streams WebSocket server, call state machine
  /notifier           Lambda that sends alerts to the family
  /family-panel       React: guided setup, history, corrections
  /grandma-phone      React: protected person's phone (Twilio Voice JS)
  /judge-mode         React: live demo for judges
/packages
  /risk-engine        Signal and scoring engine (pure, with property tests)
  /design-tokens      Color, type, and motion tokens
/prompts              Agent and classifier prompts
/evals                Labeled scripts (JSONL) and evaluation script
/infra                AWS CDK
/docs                 Technical decisions, original HTML demo
/.kiro                Specs, steering, and hooks (version-controlled, hackathon requirement)
```

Conventions: one component per file; code, comments, and commits in English; UI copy in English and Spanish.
