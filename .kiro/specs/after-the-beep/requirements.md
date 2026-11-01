# Requirements — After the Beep

## Introduction

After the Beep resurrects the 1980s answering machine as a shield against phone scams targeting older adults. Every call from an unknown number is answered first by a voice agent that identifies the caller, verifies anyone claiming to be family with a safe word, and scores scam signals live. If the call is a scam, the protected person's phone never rings and the family gets an alert.

The problem: in 2025, people aged 60 and older filed 201,266 complaints with the FBI's IC3 and reported USD 7.748 billion in losses (+59% vs. 2024), with an average loss of USD 38,500 per victim. Voice-clone and family-impersonation scams are growing because a familiar voice is no longer proof of identity.

Users:
- **Protected person** ("Grandma Gloria"): older adult, low tolerance for complex interfaces.
- **Family caregiver** ("Camila"): sets up the system, receives alerts, reviews history.
- **Caller**: legitimate or scammer.
- **Hackathon judge**: must be able to test the system without a real phone.

Kiroween category: Resurrection (answering machine + voice agent).

## Requirement 1 — Screening and opening disclosure

**User story:** As a caregiver, I want every unknown call answered by the machine first, so my mom doesn't have to decide alone whether it's a scam.

### Acceptance criteria
1. WHEN a call arrives from a number not in the contact list, THE SYSTEM SHALL answer it without ringing the protected person's phone.
2. WHEN the system answers a call, THE SYSTEM SHALL state within the first 5 seconds that an automated assistant is answering and that the call is recorded.
3. WHEN the system answers a call, THE SYSTEM SHALL ask who is calling and why.
4. IF the caller hangs up before identifying themselves, THEN THE SYSTEM SHALL log the call as "hung up without identifying" without alerting the family.

## Requirement 2 — Trusted contacts

**User story:** As a caregiver, I want known contacts to go straight through, so the system doesn't get in the family's way.

### Acceptance criteria
1. WHEN a call arrives from a number in the contact list, THE SYSTEM SHALL transfer it immediately to the protected person's phone.
2. WHERE the household enables strict mode, THE SYSTEM SHALL also apply signal detection to trusted contacts, because caller ID can be spoofed.
3. THE SYSTEM SHALL allow up to 50 contacts per household.

## Requirement 3 — Safe word verification

**User story:** As a caregiver, I want anyone claiming to be family to prove they know our safe word, so a cloned voice can't fool my mom.

### Acceptance criteria
1. WHEN a caller claims to be a relative or known contact from an unknown number, THE SYSTEM SHALL ask for the household safe word.
2. WHEN the spoken safe word matches the configured one (tolerating transcription errors of up to one edit per 6 characters, ignoring accents and case), THE SYSTEM SHALL subtract 45 points from the suspicion score.
3. IF the caller doesn't know the safe word or dodges the question, THEN THE SYSTEM SHALL add 30 points to the suspicion score.
4. THE SYSTEM SHALL NOT reveal the safe word, hints about it, or whether an attempt was "close".
5. THE SYSTEM SHALL allow at most 2 attempts per call.

## Requirement 4 — Live signal detection and scoring

**User story:** As a caregiver, I want the system to detect known scam tactics during the conversation, so it blocks the call before any harm is done.

### Acceptance criteria
1. THE SYSTEM SHALL start every call with a suspicion score of 10 out of 100.
2. WHEN a caller turn contains a signal from the catalog (Appendix A), THE SYSTEM SHALL add its weight to the score and store the text fragment that evidences it.
3. THE SYSTEM SHALL keep the score between 0 and 100.
4. THE SYSTEM SHALL count each signal type only once per call.
5. WHEN the caller asks for a verification code, password, or PIN, THE SYSTEM SHALL reply that no legitimate institution asks for those over the phone.
6. THE SYSTEM SHALL combine deterministic rules with a language-model classifier, and IF the model fails or takes longer than 2 seconds, THEN THE SYSTEM SHALL decide using rules only.

## Requirement 5 — Verdict

**User story:** As a protected person, I want my phone to ring only when it's worth it, so I never have to deal with scammers.

### Acceptance criteria
1. WHEN the score reaches 60 or more, THE SYSTEM SHALL end the call with a neutral message and mark it as blocked.
2. WHEN the conversation ends with a score below 30 and the call needs a live answer (verified relative, legitimate urgency), THE SYSTEM SHALL ring the protected person and announce who is calling and why before connecting.
3. WHEN the conversation ends with a score below 60 and no live answer is needed, THE SYSTEM SHALL save the message without interrupting.
4. THE SYSTEM SHALL reach a verdict within 90 seconds of conversation; IF it hasn't, THEN it SHALL save the message.

## Requirement 6 — Family alert

**User story:** As a caregiver, I want to know right away when a scam is blocked, so I can call my mom and check she's okay.

### Acceptance criteria
1. WHEN the system blocks a call, THE SYSTEM SHALL send a message (SMS or WhatsApp) to the household caregivers within 30 seconds.
2. The alert SHALL include who was impersonated, what was requested, the signals detected, and one concrete action (e.g., "call Andrés on his usual number").
3. The alert SHALL NOT include the safe word or financial data.
4. The alert SHALL include a link to the call detail in the family dashboard.

## Requirement 7 — Family dashboard

**User story:** As a caregiver, I want to configure the system and review what happened, so I can trust its decisions and correct them.

### Acceptance criteria
1. THE SYSTEM SHALL offer a guided setup of at most 5 steps: protected person, safe word, contacts, caregivers, test call.
2. THE SYSTEM SHALL show call history with date, number, verdict, score, signals, transcript, and recording.
3. WHEN a caregiver marks a call as misclassified, THE SYSTEM SHALL store the correction and add it to the evaluation set.
4. THE SYSTEM SHALL allow changing the safe word at any time.

## Requirement 8 — Protected person's phone

**User story:** As a protected person, I want a screen I understand without help, so I only answer when it's meant for me.

### Acceptance criteria
1. WHEN the system rings, THE INTERFACE SHALL show who is calling, whether they were verified, and why, in text of at least 28 px.
2. THE INTERFACE SHALL have a single primary button per screen, at least 72 px tall.
3. THE INTERFACE SHALL meet WCAG 2.2 AAA contrast for primary text.
4. WHEN there are saved messages, THE INTERFACE SHALL show them with a large LED-style counter, like the original answering machine.

## Requirement 9 — Privacy and security

**User story:** As a caregiver, I want recordings and the safe word protected, so the system doesn't create a new risk.

### Acceptance criteria
1. THE SYSTEM SHALL encrypt the safe word with a managed key (KMS) and never write it to logs or transcripts; transcripts SHALL show it as "[safe word]".
2. THE SYSTEM SHALL encrypt recordings and transcripts at rest and delete them after 30 days by default.
3. THE SYSTEM SHALL isolate data per household and SHALL NOT let a user read another household's data.
4. THE SYSTEM SHALL require explicit consent from the protected person or their representative during setup.
5. WHEN the system detects card numbers, account numbers, or ID numbers in the conversation, THE SYSTEM SHALL mask them before storing.

## Requirement 10 — Judge mode

**User story:** As a judge, I want to try After the Beep from my browser, so I can evaluate it without an international phone call.

### Acceptance criteria
1. THE SYSTEM SHALL offer a public page where anyone can "call" a demo household from the browser using their microphone.
2. The page SHALL show the live transcript, the suspicion meter, and the signals, with the same design as the demo.
3. The page SHALL include 4 suggested scripts (grandson in trouble, fake bank, verified relative, doctor's appointment) for the judge to act out.
4. The demo household SHALL use fictional data and its safe word SHALL be published on the page.

## Requirement 11 — Performance

### Acceptance criteria
1. THE SYSTEM SHALL respond to each caller turn with p50 latency under 1.5 s and p95 under 2.5 s.
2. THE SYSTEM SHALL update the score in the interface within 500 ms of the turn ending.

## Requirement 12 — Evaluation

### Acceptance criteria
1. THE PROJECT SHALL include an evaluation set of at least 60 scripts (30 scams and 30 legitimate) based on IC3 and FTC typologies.
2. THE SYSTEM SHALL detect at least 90% of the scams in the set.
3. THE SYSTEM SHALL block fewer than 5% of the legitimate calls in the set.
4. WHEN rules, weights, or prompts change, THE EVALUATION SHALL run automatically and report both metrics.

## Appendix A — Initial signal catalog

| Signal | Weight | Example |
|---|---|---|
| Claims to be family from an unknown number | +15 | "Grandma, it's me" |
| Impersonates an institution (bank, government, utility) | +15 | "This is the fraud department" |
| Sudden emergency | +15 | "I had an accident" |
| Asks for urgent money | +20 | "I need four thousand dollars now" |
| Asks for a code, password, or PIN | +35 | "Read me the code we just texted you" |
| Unusual payment method (gift cards, crypto, wire to third parties) | +25 | "Buy some gift cards" |
| Asks to keep it secret | +20 | "Don't tell mom" |
| Time pressure | +15 | "You have five minutes" |
| Dodges simple questions | +15 | "That doesn't matter right now" |
| Fear or threats | +10 | "You'll lose your money" |
| Doesn't know the safe word | +30 | "What word?" |
| New number for a supposed acquaintance | +10 | "I'm calling from a borrowed phone" |
| Correct safe word | −45 | "Tamarind" |
| Asks for no money or data | −15 | "Just confirming the appointment" |
| Offers an official verification channel | −10 | "You can call the appointments line" |
