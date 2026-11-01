import type {
  Action,
  Assessment,
  HouseholdContext,
  Signal,
  Turn,
} from "./types";
import { CATALOG } from "./catalog";
import { normalize } from "./text";
import { maskSafeWord } from "./levenshtein";

/** Estado inicial: la llamada arranca con 10/100 de sospecha (Req 4.1). */
export function createInitialAssessment(): Assessment {
  return {
    score: 10,
    signals: [],
    action: "continue",
    safeWordAttempts: 0,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Evalúa un turno y devuelve el assessment actualizado.
 *
 * - Solo los turnos de quien llama producen señales.
 * - Las reglas deciden siempre; el LLM (opcional) solo agrega señales del
 *   catálogo, y los pesos los pone el motor, nunca el LLM.
 * - Cada señal se cuenta una sola vez por llamada (Req 4.4).
 * - El puntaje se mantiene en [0, 100] (Req 4.3).
 * - Umbral básico: bloquear a partir de 60.
 */
export function assess(
  prev: Assessment,
  turn: Turn,
  ctx: HouseholdContext,
  llm: Signal[] = [],
): Assessment {
  // Los turnos de la máquina no generan señales.
  if (turn.speaker !== "caller") {
    return prev;
  }

  const normalized = normalize(turn.text);

  // --- Detección por reglas deterministas ---
  const newSignals: Signal[] = [];

  for (const def of CATALOG) {
    // Req 4.4: cada señal se cuenta una sola vez por llamada.
    if (prev.signals.some((s) => s.id === def.id)) continue;
    if (newSignals.some((s) => s.id === def.id)) continue;

    // After 2 failed safe-word attempts, stop checking (Req 3.5).
    if (def.id === "correct_safe_word" && prev.safeWordAttempts >= 2) continue;

    const evidence = def.detect(normalized, turn.text, ctx);
    if (evidence !== null) {
      newSignals.push({
        id: def.id,
        weight: def.weight,
        evidence,
        source: "rule",
      });
    }
  }

  // --- Señales opcionales del LLM (pesos siempre del catálogo) ---
  for (const llmSignal of llm) {
    if (prev.signals.some((s) => s.id === llmSignal.id)) continue;
    if (newSignals.some((s) => s.id === llmSignal.id)) continue;

    const def = CATALOG.find((c) => c.id === llmSignal.id);
    if (!def) continue; // solo se aceptan ids del catálogo

    newSignals.push({
      id: llmSignal.id,
      weight: def.weight,
      evidence: llmSignal.evidence,
      source: "llm",
    });
  }

  // --- Safe word attempt tracking (Req 3.5) ---
  let safeWordAttempts = prev.safeWordAttempts;
  const correctDetected = newSignals.some((s) => s.id === "correct_safe_word");

  // When the gateway asked for the safe word and the caller didn't match it,
  // count this as a failed attempt (max 2 per call).
  if (ctx.expectingSafeWord && !correctDetected && prev.safeWordAttempts < 2) {
    safeWordAttempts++;
  }

  // --- Mask safe word in all evidence (Req 3.4, Req 9.1) ---
  // The safe word must never appear in signals, evidence, or any output.
  const signalsToAdd = ctx.safeWord
    ? newSignals.map((s) => ({
        ...s,
        evidence: maskSafeWord(s.evidence, ctx.safeWord),
      }))
    : newSignals;

  // --- Combinar señales ---
  const signals = [...prev.signals, ...signalsToAdd];

  // --- Puntaje: base 10 + suma de pesos, limitado a [0, 100] ---
  const rawScore = 10 + signals.reduce((sum, s) => sum + s.weight, 0);
  const score = clamp(rawScore, 0, 100);

  // --- Acción ---
  let action: Action;
  if (score >= 60) {
    action = "block";
  } else if (
    ctx.safeWord &&
    signals.some((s) => s.id === "family_from_unknown") &&
    !signals.some((s) => s.id === "correct_safe_word") &&
    safeWordAttempts < 2
  ) {
    // Caller claims family from an unknown number and hasn't verified yet
    // (Req 3.1).
    action = "ask_safe_word";
  } else {
    action = "continue";
  }

  return {
    score,
    signals,
    action,
    safeWordAttempts,
  };
}
