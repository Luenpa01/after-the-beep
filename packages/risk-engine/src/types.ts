/**
 * Tipos públicos del motor de riesgo.
 *
 * El motor es una librería pura: no importa nada de red ni del SDK de AWS
 * (regla del stack técnico). Las reglas deciden siempre; el LLM solo agrega
 * señales del catálogo.
 */

export type Speaker = "caller" | "machine";

/** Un turno de la conversación, ya transcrito a texto. */
export type Turn = {
  speaker: Speaker;
  text: string;
  atMs: number;
};

/** Identificadores de las 15 señales del Anexo A. */
export type SignalId =
  | "family_from_unknown"
  | "impersonates_entity"
  | "sudden_emergency"
  | "requests_urgent_money"
  | "requests_code_pin"
  | "unusual_payment_method"
  | "requests_secrecy"
  | "time_pressure"
  | "evades_simple_questions"
  | "fear_or_threat"
  | "unknown_safe_word"
  | "new_number_known_person"
  | "correct_safe_word"
  | "no_money_or_data_requested"
  | "offers_verification_channel";

export type SignalSource = "rule" | "llm";

/** Una señal detectada durante la llamada. */
export type Signal = {
  id: SignalId;
  weight: number;
  /** Fragmento de texto que la evidencia. */
  evidence: string;
  source: SignalSource;
};

/** Acción sugerida por el motor al gateway. */
export type Action =
  | "continue"
  | "ask_safe_word"
  | "warn_code"
  | "block"
  | "ring"
  | "message";

/** Estado de la evaluación después de procesar cada turno. */
export type Assessment = {
  /** Puntaje de sospecha, siempre en [0, 100]. */
  score: number;
  /** Señales detectadas, únicas por id dentro de la llamada. */
  signals: Signal[];
  /** Acción sugerida para el gateway. */
  action: Action;
  /** Número de intentos de palabra clave (lo gestiona la tarea 5). */
  safeWordAttempts: number;
};

/** Contexto del hogar, necesario para la verificación de palabra clave. */
export type HouseholdContext = {
  /** Palabra clave descifrada; solo vive en memoria, nunca en logs. */
  safeWord?: string;
  /** Cuando es true, aplica detección también a contactos de confianza. */
  strictMode?: boolean;
  /**
   * Set by the gateway when the caller has been asked for the safe word.
   * Failed attempts while this is true increment safeWordAttempts (Req 3.5).
   */
  expectingSafeWord?: boolean;
};
