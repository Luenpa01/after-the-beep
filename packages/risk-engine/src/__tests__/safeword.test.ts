import { describe, it, expect } from "vitest";
import {
  createInitialAssessment,
  assess,
  type HouseholdContext,
  type Turn,
} from "../index";

function callerTurn(text: string): Turn {
  return { speaker: "caller", text, atMs: 0 };
}

describe("safe word verification (task 5)", () => {
  // 1. Exact match
  it("detects the safe word on exact match and masks the evidence", () => {
    const ctx: HouseholdContext = { safeWord: "Tamarindo" };
    const a = assess(createInitialAssessment(), callerTurn("tamarindo"), ctx);

    const sw = a.signals.find((s) => s.id === "correct_safe_word");
    expect(sw).toBeDefined();
    expect(sw!.evidence).toBe("[safe word]");
    expect(a.score).toBe(0); // 10 - 45 = -35 → clamped to 0
  });

  // 2. Match with accents and different case
  it("matches despite accents and different case", () => {
    const ctx: HouseholdContext = { safeWord: "Tamarindo" };
    const a = assess(createInitialAssessment(), callerTurn("TAMARÍNDO"), ctx);
    expect(a.signals.some((s) => s.id === "correct_safe_word")).toBe(true);
  });

  // 3. One typo within tolerance
  it("matches with one typo within Levenshtein tolerance", () => {
    const ctx: HouseholdContext = { safeWord: "Tamarindo" };
    // "tomarindo" → 1 substitution (o→a), tolerance = floor(9/6) = 1
    const a = assess(createInitialAssessment(), callerTurn("tomarindo"), ctx);
    expect(a.signals.some((s) => s.id === "correct_safe_word")).toBe(true);
  });

  // 4. A typo beyond tolerance
  it("does not match when the typo exceeds tolerance", () => {
    const ctx: HouseholdContext = { safeWord: "Tamarindo" };
    // "tomarinda" → 2 substitutions (o→a, a→o), tolerance = 1
    const a = assess(createInitialAssessment(), callerTurn("tomarinda"), ctx);
    expect(a.signals.some((s) => s.id === "correct_safe_word")).toBe(false);
    expect(a.score).toBe(10); // base only, no signals
  });

  // 5. A short safe word with zero tolerance
  it("matches a short safe word exactly but rejects a single typo", () => {
    const ctx: HouseholdContext = { safeWord: "sol" };
    // "sol" → 3 chars, tolerance = floor(3/6) = 0
    const exact = assess(createInitialAssessment(), callerTurn("sol"), ctx);
    expect(exact.signals.some((s) => s.id === "correct_safe_word")).toBe(true);

    // "sos" → 1 substitution, 1 > 0
    const typo = assess(createInitialAssessment(), callerTurn("sos"), ctx);
    expect(typo.signals.some((s) => s.id === "correct_safe_word")).toBe(false);
  });

  // 6. A multi-word safe word
  it("detects a multi-word safe word via sliding window", () => {
    const ctx: HouseholdContext = { safeWord: "gato negro" };
    const a = assess(createInitialAssessment(), callerTurn("gato negro"), ctx);
    expect(a.signals.some((s) => s.id === "correct_safe_word")).toBe(true);
    expect(a.score).toBe(0); // 10 - 45 = -35 → clamped to 0
  });

  it("detects a multi-word safe word with one typo in the window", () => {
    const ctx: HouseholdContext = { safeWord: "gato negro" };
    // "gato negra" → 1 substitution (o→a), tolerance = floor(10/6) = 1
    const a = assess(createInitialAssessment(), callerTurn("gato negra"), ctx);
    expect(a.signals.some((s) => s.id === "correct_safe_word")).toBe(true);
  });

  // 7. The attempt counter stopping at 2
  it("stops accepting safe word attempts after 2 failures", () => {
    const ctx: HouseholdContext = { safeWord: "Tamarindo", expectingSafeWord: true };
    let a = createInitialAssessment();

    // Attempt 1: wrong word
    a = assess(a, callerTurn("tomate"), ctx);
    expect(a.safeWordAttempts).toBe(1);
    expect(a.signals.some((s) => s.id === "correct_safe_word")).toBe(false);

    // Attempt 2: wrong word
    a = assess(a, callerTurn("pera"), ctx);
    expect(a.safeWordAttempts).toBe(2);
    expect(a.signals.some((s) => s.id === "correct_safe_word")).toBe(false);

    // Attempt 3: correct word, but attempts exhausted → must NOT detect
    a = assess(a, callerTurn("tamarindo"), ctx);
    expect(a.safeWordAttempts).toBe(2);
    expect(a.signals.some((s) => s.id === "correct_safe_word")).toBe(false);
  });

  // 8. Masking of a multi-word safe word in evidence
  it("masks a multi-word safe word in all signal evidence", () => {
    const ctx: HouseholdContext = { safeWord: "gato negro" };
    // Triggers both correct_safe_word and sudden_emergency
    const a = assess(
      createInitialAssessment(),
      callerTurn("gato negro tuvo un accidente"),
      ctx,
    );

    const sw = a.signals.find((s) => s.id === "correct_safe_word");
    expect(sw).toBeDefined();
    expect(sw!.evidence).toBe("[safe word]");

    const emergency = a.signals.find((s) => s.id === "sudden_emergency");
    expect(emergency).toBeDefined();
    expect(emergency!.evidence).toBe("[safe word] tuvo un accidente");

    // The safe word must not appear anywhere in any evidence
    for (const signal of a.signals) {
      expect(signal.evidence).not.toContain("gato");
      expect(signal.evidence).not.toContain("negro");
    }
  });
});
