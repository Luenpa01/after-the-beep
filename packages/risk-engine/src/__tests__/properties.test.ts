import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  createInitialAssessment,
  assess,
  normalize,
  type HouseholdContext,
  type Turn,
} from "../index";

function callerTurn(text: string): Turn {
  return { speaker: "caller", text, atMs: 0 };
}

const emptyCtx: HouseholdContext = {};

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

// Phrases that trigger signals (Appendix A examples, both languages).
const signalPhrases: string[] = [
  "Abuela, soy yo", "Grandma, it's me",
  "Le hablamos del área de seguridad", "This is the fraud department",
  "Tuve un accidente", "I had an accident",
  "Necesito cuatro millones ya", "I need four thousand dollars now",
  "Dígame el código que le llegó", "Read me the code we just texted you",
  "Compre tarjetas de regalo", "Buy some gift cards",
  "No le digas a mi mamá", "Don't tell mom",
  "Tiene cinco minutos", "You have five minutes",
  "Eso no importa ahora", "That doesn't matter right now",
  "Va a perder la plata", "You'll lose your money",
  "¿Qué palabra?", "What word?",
  "La llamo de uno prestado", "I'm calling from a borrowed phone",
  "Solo confirmar la cita", "Just confirming the appointment",
  "Puede llamar a la línea de citas", "You can call the appointments line",
];

// Mix of random strings, individual signal phrases, and two-phrase combos
// (the latter can trigger multiple signals in one turn).
const arbText = fc.oneof(
  fc.string({ minLength: 0, maxLength: 200 }),
  fc.constantFrom(...signalPhrases),
  fc
    .tuple(fc.constantFrom(...signalPhrases), fc.constantFrom(...signalPhrases))
    .map(([a, b]) => `${a}. ${b}`),
);

// ---------------------------------------------------------------------------
// Property 1 — Score always in [0, 100]
// Design: "The score is always within [0, 100]."
// ---------------------------------------------------------------------------

describe("property 1 — score bounds", () => {
  it("score stays within [0, 100] for any sequence of caller turns", () => {
    fc.assert(
      fc.property(
        fc.array(arbText, { maxLength: 20 }),
        (texts) => {
          let a = createInitialAssessment();
          for (const text of texts) {
            a = assess(a, callerTurn(text), emptyCtx);
          }
          return a.score >= 0 && a.score <= 100;
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2 — Positive signal never lowers the score
// Design: "Adding a turn with a positive signal never lowers the score."
// ---------------------------------------------------------------------------

describe("property 2 — positive signals are monotonic", () => {
  it("a turn that adds only positive-weight signals never decreases the score", () => {
    fc.assert(
      fc.property(
        fc.array(arbText, { maxLength: 20 }),
        (texts) => {
          let prev = createInitialAssessment();
          for (const text of texts) {
            const next = assess(prev, callerTurn(text), emptyCtx);
            const newSignals = next.signals.filter(
              (s) => !prev.signals.some((p) => p.id === s.id),
            );
            // When every new signal has a positive weight, the score must not drop.
            if (
              newSignals.length > 0 &&
              newSignals.every((s) => s.weight > 0)
            ) {
              if (next.score < prev.score) return false;
            }
            prev = next;
          }
          return true;
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3 — Same signal repeated never counts twice
// Design: "The same signal repeated never counts twice."
// ---------------------------------------------------------------------------

describe("property 3 — deduplication", () => {
  it("repeating the same text does not change the score or signal count", () => {
    fc.assert(
      fc.property(arbText, (text) => {
        let a = createInitialAssessment();
        a = assess(a, callerTurn(text), emptyCtx);
        const scoreAfterFirst = a.score;
        const countAfterFirst = a.signals.length;
        a = assess(a, callerTurn(text), emptyCtx);
        return (
          a.score === scoreAfterFirst && a.signals.length === countAfterFirst
        );
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6 — LLM down = rules only
// Design: "With the LLM down, the result equals the rules-only result."
// ---------------------------------------------------------------------------

describe("property 6 — LLM fallback", () => {
  it("with LLM down, the result equals the rules-only result", () => {
    fc.assert(
      fc.property(arbText, (text) => {
        const prev = createInitialAssessment();
        const rulesOnly = assess(prev, callerTurn(text), emptyCtx);

        // Case 1: empty LLM array must match no-LLM call.
        const withEmpty = assess(prev, callerTurn(text), emptyCtx, []);
        if (
          rulesOnly.score !== withEmpty.score ||
          rulesOnly.signals.length !== withEmpty.signals.length ||
          rulesOnly.action !== withEmpty.action
        ) {
          return false;
        }

        // Case 2: LLM proposing the same signal ids the rules already found
        // must not change the result (deduplication).
        const llmCopy = rulesOnly.signals.map((s) => ({
          id: s.id,
          weight: s.weight,
          evidence: s.evidence,
          source: "llm" as const,
        }));
        const withDup = assess(prev, callerTurn(text), emptyCtx, llmCopy);
        if (
          rulesOnly.score !== withDup.score ||
          rulesOnly.signals.length !== withDup.signals.length ||
          rulesOnly.action !== withDup.action
        ) {
          return false;
        }

        return true;
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Generators for safe-word properties
// ---------------------------------------------------------------------------

// Texts that include the safe word or a close variant, mixed with signal phrases.
const arbTextWithSafeWord = fc.oneof(
  arbText,
  fc.constant("tamarindo"),
  fc.constant("TAMARINDO"),
  fc.constant("tamarindo por favor"),
  fc.constant("tomarindo"), // 1 edit from "tamarindo"
  fc.constant("la palabra es tamarindo"),
);

// ---------------------------------------------------------------------------
// Property 4 — Correct safe word never leaves a call at block
// Design: "Saying the correct safe word never leaves a call at block unless
//          other signals reach ≥ 60."
// ---------------------------------------------------------------------------

describe("property 4 — safe word prevents block", () => {
  it("correct safe word never leaves a call at block unless other signals reach >= 60", () => {
    const safeWord = "Tamarindo";
    const ctx: HouseholdContext = { safeWord };

    fc.assert(
      fc.property(
        fc.array(arbTextWithSafeWord, { maxLength: 20 }),
        (texts) => {
          let a = createInitialAssessment();
          for (const text of texts) {
            a = assess(a, callerTurn(text), ctx);
          }
          // If the safe word was detected and the call is blocked,
          // the other signals alone must reach >= 60.
          if (
            a.signals.some((s) => s.id === "correct_safe_word") &&
            a.action === "block"
          ) {
            const otherWeight = a.signals
              .filter((s) => s.id !== "correct_safe_word")
              .reduce((sum, s) => sum + s.weight, 0);
            return 10 + otherWeight >= 60;
          }
          return true;
        },
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5 — Safe word never appears in any output
// Design: "The safe word never appears in the stored transcript or in any
//          output message."
// ---------------------------------------------------------------------------

describe("property 5 — safe word never leaks", () => {
  it("the safe word never appears in any signal evidence or output", () => {
    const safeWord = "Tamarindo";
    const normalizedSafeWord = normalize(safeWord); // "tamarindo"
    const ctx: HouseholdContext = { safeWord };

    fc.assert(
      fc.property(
        fc.array(arbTextWithSafeWord, { maxLength: 20 }),
        (texts) => {
          let a = createInitialAssessment();
          for (const text of texts) {
            a = assess(a, callerTurn(text), ctx);
          }

          for (const signal of a.signals) {
            // The correct_safe_word signal must use the mask "[safe word]".
            if (signal.id === "correct_safe_word") {
              if (signal.evidence !== "[safe word]") return false;
            }
            // No signal evidence should contain the safe word as a word.
            const words = normalize(signal.evidence).split(/\s+/);
            if (words.includes(normalizedSafeWord)) {
              return false;
            }
          }
          return true;
        },
      ),
    );
  });
});
