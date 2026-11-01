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
// Estado inicial (Req 4.1)
// ---------------------------------------------------------------------------

describe("createInitialAssessment", () => {
  it("arranca con puntaje 10 y sin señales", () => {
    const a = createInitialAssessment();
    expect(a.score).toBe(10);
    expect(a.signals).toHaveLength(0);
    expect(a.action).toBe("continue");
    expect(a.safeWordAttempts).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Puntaje y evidencia (Req 4.2, 4.3)
// ---------------------------------------------------------------------------

describe("assess — puntaje", () => {
  it("suma el peso de la señal detectada y guarda la evidencia", () => {
    const prev = createInitialAssessment();
    const next = assess(prev, callerTurn("Necesito cuatro millones ya"), emptyCtx);
    // 10 base + 20 de requests_urgent_money
    expect(next.score).toBe(30);
    expect(next.signals).toHaveLength(1);
    expect(next.signals[0].id).toBe("requests_urgent_money");
    expect(next.signals[0].source).toBe("rule");
    expect(next.signals[0].evidence).toBe("Necesito cuatro millones ya");
  });

  it("limita el puntaje a 100", () => {
    let a = createInitialAssessment();
    a = assess(a, callerTurn("Dígame el código que le llegó"), emptyCtx); // +35
    a = assess(a, callerTurn("Compre tarjetas de regalo"), emptyCtx); // +25
    a = assess(a, callerTurn("No le digas a mi mamá"), emptyCtx); // +20
    a = assess(a, callerTurn("Necesito cuatro millones ya"), emptyCtx); // +20
    // 10 + 35 + 25 + 20 + 20 = 110 → 100
    expect(a.score).toBe(100);
  });

  it("limita el puntaje a 0", () => {
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
// Señales únicas por llamada (Req 4.4)
// ---------------------------------------------------------------------------

describe("assess — señales únicas (Req 4.4)", () => {
  it("cuenta cada señal una sola vez por llamada", () => {
    let a = createInitialAssessment();
    a = assess(a, callerTurn("Tuve un accidente"), emptyCtx);
    expect(a.score).toBe(25); // 10 + 15
    expect(a.signals).toHaveLength(1);

    // Repetir la misma señal en otro turno no debe volver a sumar.
    a = assess(a, callerTurn("Tuve otro accidente"), emptyCtx);
    expect(a.signals).toHaveLength(1);
    expect(a.score).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// Turnos de la máquina
// ---------------------------------------------------------------------------

describe("assess — ignora turnos de la máquina", () => {
  it("no detecta señales en turnos del contestador", () => {
    const prev = createInitialAssessment();
    const next = assess(prev, machineTurn("Necesito cuatro millones ya"), emptyCtx);
    expect(next.score).toBe(10);
    expect(next.signals).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Acción
// ---------------------------------------------------------------------------

describe("assess — acción", () => {
  it("devuelve 'block' cuando el puntaje llega a 60", () => {
    let a = createInitialAssessment();
    a = assess(a, callerTurn("Dígame el código que le llegó"), emptyCtx); // +35
    a = assess(a, callerTurn("Compre tarjetas de regalo"), emptyCtx); // +25
    // 10 + 35 + 25 = 70
    expect(a.action).toBe("block");
  });

  it("devuelve 'continue' cuando el puntaje es menor a 60", () => {
    const a = assess(
      createInitialAssessment(),
      callerTurn("Tuve un accidente"),
      emptyCtx,
    );
    expect(a.action).toBe("continue");
  });
});

// ---------------------------------------------------------------------------
// Palabra clave correcta (−45)
// ---------------------------------------------------------------------------

describe("assess — palabra clave correcta", () => {
  it("resta 45 puntos cuando quien llama dice la palabra", () => {
    const ctx: HouseholdContext = { safeWord: "Tamarindo" };
    const prev = createInitialAssessment();
    const next = assess(prev, callerTurn("tamarindo"), ctx);
    // 10 - 45 = -35 → 0
    expect(next.score).toBe(0);
    expect(next.signals.some((s) => s.id === "correct_safe_word")).toBe(true);
  });

  it("es insensible a mayúsculas y tildes", () => {
    const ctx: HouseholdContext = { safeWord: "Tamarindo" };
    const prev = createInitialAssessment();
    const next = assess(prev, callerTurn("La palabra es TAMARINDO"), ctx);
    expect(next.signals.some((s) => s.id === "correct_safe_word")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Acumulación de señales
// ---------------------------------------------------------------------------

describe("assess — acumulación de varias señales", () => {
  it("detecta señales distintas en turnos sucesivos", () => {
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
// Integridad del catálogo
// ---------------------------------------------------------------------------

describe("catálogo — integridad", () => {
  it("tiene exactamente 15 señales", () => {
    expect(CATALOG).toHaveLength(15);
  });

  it("los pesos coinciden con el Anexo A", () => {
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
// Detección con los ejemplos del Anexo A
// ---------------------------------------------------------------------------

describe("catálogo — ejemplos del Anexo A", () => {
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
    it(`detecta ${id} con el ejemplo del Anexo A`, () => {
      const prev = createInitialAssessment();
      const next = assess(prev, callerTurn(text), {});
      expect(next.signals.some((s) => s.id === id)).toBe(true);
    });
  }
});
