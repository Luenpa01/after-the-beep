# Implementation plan — After the Beep

Window: October 30 to December 4, 2026, closing at 2:00 PM Pacific. Goal: everything working by November 27, leaving the last week to polish, record, and write.

## Week 1 (Oct 30 – Nov 6): foundations and the biggest technical risk

- [ ] 1. Create the monorepo with the layout in `structure.md`, MIT license, and `/.kiro` under version control
  - Confirm `.kiro` is not in `.gitignore`
  - _Requirements: hackathon submission_
- [ ] 2. Voice proof of concept
  - Twilio test number → Media Stream → local gateway via ngrok
  - Test Nova Sonic in English and Spanish; if Spanish isn't supported, set up Transcribe + Claude + Polly
  - Measure per-turn latency and record the decision in `docs/decisions.md`
  - _Requirements: 1.1, 1.2, 11.1_
- [x] 3. Implement `packages/risk-engine` with the Appendix A catalog, rules only
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
- [ ] 4. Write the 6 property tests with fast-check
  - _Requirements: 4.3, 4.4, 3.2, 9.1_
- [ ] 5. Safe word verification with normalization and Levenshtein, max 2 attempts
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Week 2 (Nov 7 – 13): the full call

- [ ] 6. Gateway: call state machine (disclosure, identification, verification, verdict)
  - _Requirements: 1.1–1.4, 5.1–5.4_
- [ ] 7. LLM classifier with strict JSON output and a 2 s timeout falling back to rules
  - _Requirements: 4.6_
- [ ] 8. Automatic reply when asked for codes or PINs
  - _Requirements: 4.5_
- [ ] 9. Contact list and strict mode
  - _Requirements: 2.1, 2.2, 2.3_
- [ ] 10. Persistence in DynamoDB and recordings in S3 with SSE-KMS and a 30-day lifecycle
  - _Requirements: 9.1, 9.2, 9.5_
- [ ] 11. Infrastructure in AWS CDK: Fargate, DynamoDB, S3, KMS, EventBridge, Lambda, Cognito
  - _Requirements: 9.3_

## Week 3 (Nov 14 – 20): the family and grandma

- [ ] 12. Notifier Lambda with alert template and retries
  - _Requirements: 6.1, 6.2, 6.3, 6.4_
- [ ] 13. `design-tokens` package with the tokens from `design.md` and light/dark mode
- [ ] 14. Family dashboard: 5-step guided setup with explicit consent
  - _Requirements: 7.1, 7.4, 9.4_
- [ ] 15. Family dashboard: history, call detail, and verdict correction
  - _Requirements: 7.2, 7.3_
- [ ] 16. Grandma's phone with Twilio Voice JS, pre-connect announcement, and LED counter
  - _Requirements: 5.2, 8.1–8.4_

## Week 4 (Nov 21 – 27): judge mode and evaluation

- [ ] 17. Judge mode: browser call to the demo household, with the machine, meter, and live transcript
  - Reuse the components from the HTML demo
  - _Requirements: 10.1–10.4_
- [ ] 18. Evaluation set of 60+ scripts in English and Spanish based on IC3 and FTC typologies
  - _Requirements: 12.1_
- [ ] 19. `npm run eval` script and the hook that runs it when rules or prompts change
  - _Requirements: 12.2, 12.3, 12.4_
- [ ] 20. Tune weights until ≥ 90% detection and < 5% false positives
- [ ] 21. End-to-end latency test in staging
  - _Requirements: 11.1, 11.2_
- [ ] 22. Feature freeze on November 27

## Week 5 (Nov 28 – Dec 4): polish and submit

- [ ] 23. Accessibility review: AAA contrast, visible focus, reduced motion, screen reader
- [ ] 24. Script and record the 3-minute video
  - 0:00–0:20 the IC3 numbers and the "grandson" call
  - 0:20–1:30 live call blocked, with the meter and the alert arriving on the caregiver's phone
  - 1:30–2:15 the daughter verified with the safe word, grandma's phone rings
  - 2:15–2:45 how it was built with Kiro: specs, hooks, steering, MCP, property tests
  - 2:45–3:00 evaluation results and close, with 10 seconds of the same call in Spanish
- [ ] 25. Kiro usage write-up on Devpost
- [ ] 26. Public blog post and social post starting with #KiroweenHackathon26 for the bonus prizes
- [ ] 27. Final submission check: public repo, license, working URL, test credentials in the README, category selected
- [ ] 28. Submit before December 3 to keep a day of margin
