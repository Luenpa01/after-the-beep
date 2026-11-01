import { describe, it, expect } from "vitest";
import {
  createInitialAssessment,
  assess,
  CATALOG,
  type Assessment,
  type HouseholdContext,
  type Turn,
} from "../index";

function callerTurn(text: string): Turn {
  return { speaker: "caller", text, atMs: Date.now() };
}

function machineTurn(text: string): Turn {
  return { speaker: "machine", text, atMs: Date.now() };
}

const emptyCtx: HouseholdContext = {};

// ---------------------------------------------------------------------------
// Initial state (Req 4.1)
// ---------------------------------------------------------------------------

describe("createInitialAssessment", () => {
  it("starts with a score of 10 and no signals", () => {
    const a = createInitialAssessment();
    expect(a.score).toBe(10);
    expect(a.signals).toHaveLength(0);
    expect(a.action).toBe("continue");
    expect(a.safeWordAttempts).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Scoring and evidence (Req 4.2, 4.3)
// ---------------------------------------------------------------------------

describe("assess — scoring", () => {
  it("adds detected signal weight and stores evidence", () => {
    const prev = createInitialAssessment();
    const next = assess(prev, callerTurn("Necesito cuatro millones ya"), emptyCtx);
    // 10 base + 20 from requests_urgent_money
    expect(next.score).toBe(30);
    expect(next.signals).toHaveLength(1);
    expect(next.signals[0].id).toBe("requests_urgent_money");
    expect(next.signals[0].source).toBe("rule");
    expect(next.signals[0].evidence).toBe("Necesito cuatro millones ya");
  });

  it("clamps score to 100", () => {
    let a = createInitialAssessment();
    a = assess(a, callerTurn("Dígame el código que le llegó"), emptyCtx); // +35
    a = assess(a, callerTurn("Compre tarjetas de regalo"), emptyCtx); // +25
    a = assess(a, callerTurn("No le digas a mi mamá"), emptyCtx); // +20
    a = assess(a, callerTurn("Necesito cuatro millones ya"), emptyCtx); // +20
    // 10 + 35 + 25 + 20 + 20 = 110 → 100
    expect(a.score).toBe(100);
  });

  it("clamps score to 0", () => {
    const prev = createInitialAssessment();
    const next = assess(
      prev,
      callerTurn("Solo confirmar la cita, puede llamar a la línea de citas"),
      emptyCtx,
    );
    // 10 - 15 (no_money_or_data) - 10 (offers_verification) = -15 → 0
    expect(next.score).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Unique signals per call (Req 4.4)
// ---------------------------------------------------------------------------

describe("assess — unique signals (Req 4.4)", () => {
  it("counts each signal only once per call", () => {
    let a = createInitialAssessment();
    a = assess(a, callerTurn("Tuve un accidente"), emptyCtx);
    expect(a.score).toBe(25); // 10 + 15
    expect(a.signals).toHaveLength(1);

    // Repeating the same signal in another turn should not add again.
    a = assess(a, callerTurn("Tuve otro accidente"), emptyCtx);
    expect(a.signals).toHaveLength(1);
    expect(a.score).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// Machine turns
// ---------------------------------------------------------------------------

describe("assess — ignores machine turns", () => {
  it("does not detect signals from machine turns", () => {
    const prev = createInitialAssessment();
    const next = assess(prev, machineTurn("Necesito cuatro millones ya"), emptyCtx);
    expect(next.score).toBe(10);
    expect(next.signals).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

describe("assess — action", () => {
  it("returns 'block' when score reaches 60", () => {
    let a = createInitialAssessment();
    a = assess(a, callerTurn("Dígame el código que le llegó"), emptyCtx); // +35
    a = assess(a, callerTurn("Compre tarjetas de regalo"), emptyCtx); // +25
    // 10 + 35 + 25 = 70
    expect(a.action).toBe("block");
  });

  it("returns 'continue' when score is below 60", () => {
    const a = assess(
      createInitialAssessment(),
      callerTurn("Tuve un accidente"),
      emptyCtx,
    );
    expect(a.action).toBe("continue");
  });
});

// ---------------------------------------------------------------------------
// Correct safe word (−45)
// ---------------------------------------------------------------------------

describe("assess — correct safe word", () => {
  it("subtracts 45 points when caller says the word", () => {
    const ctx: HouseholdContext = { safeWord: "Tamarindo" };
    const prev = createInitialAssessment();
    const next = assess(prev, callerTurn("tamarindo"), ctx);
    // 10 - 45 = -35 → 0
    expect(next.score).toBe(0);
    expect(next.signals.some((s) => s.id === "correct_safe_word")).toBe(true);
  });

  it("is case- and accent-insensitive", () => {
    const ctx: HouseholdContext = { safeWord: "Tamarindo" };
    const prev = createInitialAssessment();
    const next = assess(prev, callerTurn("La palabra es TAMARINDO"), ctx);
    expect(next.signals.some((s) => s.id === "correct_safe_word")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Accumulation of multiple signals
// ---------------------------------------------------------------------------

describe("assess — accumulation of multiple signals", () => {
  it("detects distinct signals across successive turns", () => {
    let a = createInitialAssessment();
    a = assess(a, callerTurn("Abuela, soy tu nieto"), emptyCtx); // +15
    a = assess(a, callerTurn("Tuve un accidente"), emptyCtx); // +15
    a = assess(a, callerTurn("Necesito cuatro millones ya"), emptyCtx); // +20
    // 10 + 15 + 15 + 20 = 60 → block
    expect(a.score).toBe(60);
    expect(a.signals).toHaveLength(3);
    expect(a.action).toBe("block");
  });
});

// ---------------------------------------------------------------------------
// Catalog integrity
// ---------------------------------------------------------------------------

describe("catalog — integrity", () => {
  it("has exactly 15 signals", () => {
    expect(CATALOG).toHaveLength(15);
  });

  it("weights match Appendix A", () => {
    const weights = Object.fromEntries(CATALOG.map((s) => [s.id, s.weight]));
    expect(weights).toEqual({
      family_from_unknown: 15,
      impersonates_entity: 15,
      sudden_emergency: 15,
      requests_urgent_money: 20,
      requests_code_pin: 35,
      unusual_payment_method: 25,
      requests_secrecy: 20,
      time_pressure: 15,
      evades_simple_questions: 15,
      fear_or_threat: 10,
      unknown_safe_word: 30,
      new_number_known_person: 10,
      correct_safe_word: -45,
      no_money_or_data_requested: -15,
      offers_verification_channel: -10,
    });
  });
});

// ---------------------------------------------------------------------------
// Spanish Appendix A examples
// ---------------------------------------------------------------------------

describe("catalog — Appendix A examples (Spanish)", () => {
  const cases: Array<[string, string]> = [
    ["family_from_unknown", "Abuela, soy yo"],
    ["impersonates_entity", "Le hablamos del área de seguridad"],
    ["sudden_emergency", "Tuve un accidente"],
    ["requests_urgent_money", "Necesito cuatro millones ya"],
    ["requests_code_pin", "Dígame el código que le llegó"],
    ["unusual_payment_method", "Compre tarjetas de regalo"],
    ["requests_secrecy", "No le digas a mi mamá"],
    ["time_pressure", "Tiene cinco minutos"],
    ["evades_simple_questions", "Eso no importa ahora"],
    ["fear_or_threat", "Va a perder la plata"],
    ["unknown_safe_word", "¿Qué palabra?"],
    ["new_number_known_person", "La llamo de uno prestado"],
    ["no_money_or_data_requested", "Solo confirmar la cita"],
    ["offers_verification_channel", "Puede llamar a la línea de citas"],
  ];

  for (const [id, text] of cases) {
    it(`detects ${id} with the Spanish Appendix A example`, () => {
      const prev = createInitialAssessment();
      const next = assess(prev, callerTurn(text), {});
      expect(next.signals.some((s) => s.id === id)).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// English Appendix A examples
// ---------------------------------------------------------------------------

describe("catalog — Appendix A examples (English)", () => {
  const cases: Array<[string, string]> = [
    ["family_from_unknown", "Grandma, it's me"],
    ["impersonates_entity", "This is the fraud department"],
    ["sudden_emergency", "I had an accident"],
    ["requests_urgent_money", "I need four thousand dollars now"],
    ["requests_code_pin", "Read me the code we just texted you"],
    ["unusual_payment_method", "Buy some gift cards"],
    ["requests_secrecy", "Don't tell mom"],
    ["time_pressure", "You have five minutes"],
    ["evades_simple_questions", "That doesn't matter right now"],
    ["fear_or_threat", "You'll lose your money"],
    ["unknown_safe_word", "What word?"],
    ["new_number_known_person", "I'm calling from a borrowed phone"],
    ["no_money_or_data_requested", "Just confirming the appointment"],
    ["offers_verification_channel", "You can call the appointments line"],
  ];

  for (const [id, text] of cases) {
    it(`detects ${id} with the English Appendix A example`, () => {
      const prev = createInitialAssessment();
      const next = assess(prev, callerTurn(text), {});
      expect(next.signals.some((s) => s.id === id)).toBe(true);
    });
  }

  it("detects correct_safe_word with the English Appendix A example", () => {
    const ctx: HouseholdContext = { safeWord: "Tamarind" };
    const prev = createInitialAssessment();
    const next = assess(prev, callerTurn("tamarind"), ctx);
    expect(next.signals.some((s) => s.id === "correct_safe_word")).toBe(true);
  });
});
