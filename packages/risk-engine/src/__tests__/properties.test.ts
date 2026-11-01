import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  createInitialAssessment,
  assess,
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
