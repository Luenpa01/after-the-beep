import type { HouseholdContext, SignalId } from "./types";
import { normalize } from "./text";

/**
 * Función de detección: recibe el texto normalizado, el texto original y el
 * contexto del hogar. Devuelve un fragmento de evidencia o `null` si la
 * señal no está presente.
 */
export type DetectFn = (
  normalizedText: string,
  rawText: string,
  ctx: HouseholdContext,
) => string | null;

/** Definición de una señal del catálogo del Anexo A. */
export type SignalDef = {
  id: SignalId;
  weight: number;
  description: string;
  example: string;
  detect: DetectFn;
};

/** Devuelve un fragmento de evidencia a partir de un regex. */
function regex(pattern: RegExp): DetectFn {
  return (normalizedText, rawText) => {
    if (pattern.test(normalizedText)) {
      return rawText.length <= 200 ? rawText : rawText.slice(0, 200) + "…";
    }
    return null;
  };
}

/** Detecta la palabra clave del hogar en el texto de quien llama. */
function detectSafeWord(
  normalizedText: string,
  rawText: string,
  ctx: HouseholdContext,
): string | null {
  if (!ctx.safeWord) return null;
  const normalizedSafeWord = normalize(ctx.safeWord);
  if (!normalizedSafeWord) return null;
  if (normalizedText.includes(normalizedSafeWord)) {
    return rawText.length <= 200 ? rawText : rawText.slice(0, 200) + "…";
  }
  return null;
}

/**
 * Catálogo completo del Anexo A (15 señales) con reglas deterministas.
 *
 * Los patrones operan sobre texto normalizado (sin tildes, minúsculas, sin
 * puntuación). Cubren variantes de español colombiano, mexicano y neutro.
 */
export const CATALOG: SignalDef[] = [
  {
    id: "family_from_unknown",
    weight: 15,
    description: "Dice ser un familiar desde número desconocido",
    example: "Abuela, soy yo",
    detect: regex(
      /(?:soy\s+(?:tu|su)\s+(?:nieto|nieta|hijo|hija|sobrino|sobrina|primo|prima|yerno|nuera|familiar))|(?:abuelita|abuela|abuelo|abuelito|mama|mamita|papa|papito|tita|tia|tio),?\s+soy\s+(?:yo|[a-z]+)|(?:\bsoy\s+yo\b)/,
    ),
  },
  {
    id: "impersonates_entity",
    weight: 15,
    description: "Suplanta a una entidad (banco, gobierno, empresa de servicios)",
    example: "Le hablamos del área de seguridad",
    detect: regex(
      /(?:hablo|llamo|llamamos|hablamos|somos|trabajamos|le\s+llamo|le\s+llamamos|lo\s+llamo|los\s+llamamos).*(?:de|del|desde|para).*(?:banco|gobierno|municipio|alcaldia|policia|fiscalia|ministerio|dian|seguridad|servicios|compania|empresa|entidad|area de seguridad|departamento|direccion de impuestos)/,
    ),
  },
  {
    id: "sudden_emergency",
    weight: 15,
    description: "Emergencia repentina",
    example: "Tuve un accidente",
    detect: regex(
      /(?:accidente|choque|colision|urgencia|urgencias|hospital|clinica|emergencia|secuestraron|asaltaron|robaron|golpearon|herido|herida|sangrando|estoy\s+grave|estoy\s+mal|me\s+accident|me\s+cai|me\s+lastim|operacion|cirugia|intubado|uci|cuidados\s+intensivos)/,
    ),
  },
  {
    id: "requests_urgent_money",
    weight: 20,
    description: "Pide dinero urgente",
    example: "Necesito cuatro millones ya",
    detect: regex(
      /(?:necesito|necesitamos|mande|manda|envia|enviame|dame|pasame|prestame|gira|transfiere|deposita).*(?:plata|dinero|pesos|millones|billete|pasta|transferencia|deposito|giro|envio|recarga)|(?:plata|dinero|pesos|millones).*(?:ya|urgente|ahora|inmediatamente|lo antes posible|rapido|pronto)/,
    ),
  },
  {
    id: "requests_code_pin",
    weight: 35,
    description: "Pide código, contraseña o PIN",
    example: "Dígame el código que le llegó",
    detect: regex(
      /(?:diga|dime|deme|pasa|envia|enviame|dame|cual\s+es|dame\s+el|digame\s+el|digame|deme\s+el|deme\s+su|pasame|mande|enviame).*(?:codigo|pin|contrasena|clave|token|otp|numero\s+de\s+verificacion|codigo\s+de\s+seguridad|codigo\s+de\s+verificacion)|(?:codigo|pin|contrasena|clave|token|otp).*(?:que\s+le\s+llego|que\s+le\s+enviamos|de\s+seguridad|de\s+verificacion)/,
    ),
  },
  {
    id: "unusual_payment_method",
    weight: 25,
    description: "Medio de pago inusual (tarjetas regalo, cripto, giro a terceros)",
    example: "Compre tarjetas de regalo",
    detect: regex(
      /(?:tarjeta|tarjetas).*(?:regalo|gift|google\s+play|itunes|apple|amazon)|(?:cripto|crypto|bitcoin|usdt|usdc|binance|ethereum|litecoin)|(?:western\s+union|moneygram|giro\s+a\s+terceros|giro\s+internacional|transferencia\s+a\s+terceros)/,
    ),
  },
  {
    id: "requests_secrecy",
    weight: 20,
    description: "Pide guardar el secreto",
    example: "No le digas a mi mamá",
    detect: regex(
      /(?:no\s+le|no\s+les|no\s+nos).*(?:diga|digas|cuente|cuentes|avise|avisa|comente|comentes).*(?:mama|papa|familia|nadie|esposa|esposo)|(?:guardalo|guardenlo|manten.*en\s+secreto|entre\s+nosotros|entre\s+tu\s+y\s+yo|no\s+avises\s+a\s+nadie|no\s+le\s+cuentes\s+a\s+nadie|no\s+se\s+lo\s+digas\s+a\s+nadie)/,
    ),
  },
  {
    id: "time_pressure",
    weight: 15,
    description: "Presión de tiempo",
    example: "Tiene cinco minutos",
    detect: regex(
      /(?:tiene|tienes|tienen|tengo|tenemos).*(?:minuto|hora)|(?:es\s+urgente|muy\s+urgente|no\s+hay\s+tiempo|tiene\s+que\s+ser\s+hoy|antes\s+de\s+que\s+se\s+acabe|se\s+vence\s+hoy|limite\s+de\s+tiempo)|(?:ya\s+mismo|inmediatamente|cuanto\s+antes|lo\s+antes\s+posible|rapido\s+rapido)/,
    ),
  },
  {
    id: "evades_simple_questions",
    weight: 15,
    description: "Evade preguntas simples",
    example: "Eso no importa ahora",
    detect: regex(
      /(?:eso\s+no\s+importa|no\s+importa\s+eso|no\s+te\s+preocupes\s+por\s+eso|no\s+viene\s+al\s+caso|despues\s+te\s+explico|despues\s+te\s+cuento|despues\s+te\s+digo|no\s+es\s+relevante|no\s+se\s+preocupe\s+por\s+eso|eso\s+no\s+es\s+lo\s+importante)/,
    ),
  },
  {
    id: "fear_or_threat",
    weight: 10,
    description: "Genera miedo o amenaza",
    example: "Va a perder la plata",
    detect: regex(
      /(?:va\s+a\s+perder|perder\s+(?:la|su)\s+(?:plata|cuenta|ahorro|pension|casa|dinero)|quedar\s+sin\s+(?:plata|nada|cuenta|casa|dinero)|embargar|embargo|ir\s+a\s+la\s+carcel|carcel|demanda|denuncia|juicio|multa|sancion|remate|ejecucion|le\s+van\s+a\s+(?:embargar|demandar|quitar|cancelar|suspender|bloquear)|se\s+va\s+a\s+(?:embargar|demandar|cancelar|suspender|bloquear))/,
    ),
  },
  {
    id: "unknown_safe_word",
    weight: 30,
    description: "No sabe la palabra clave",
    example: "¿Qué palabra?",
    detect: regex(
      /(?:que\s+palabra|cual\s+palabra|no\s+se\s+la\s+palabra|no\s+me\s+acuerdo.*palabra|no\s+recuerdo.*palabra|no\s+conozco.*palabra|no\s+se\s+cual\s+palabra|no\s+tengo\s+palabra|no\s+me\s+dijeron.*palabra|que\s+palabra\s+clave|cual\s+es\s+la\s+palabra)/,
    ),
  },
  {
    id: "new_number_known_person",
    weight: 10,
    description: "Número nuevo de un supuesto conocido",
    example: "La llamo de uno prestado",
    detect: regex(
      /(?:llamo\s+de|estoy\s+llamando\s+de|te\s+llamo\s+de|le\s+llamo\s+de).*(?:prestado|un\s+numero|otro\s+numero|otro\s+celular|un\s+celular|telefono\s+prestado|otro\s+telefono|numero\s+nuevo|no\s+es\s+mi\s+numero)|(?:me\s+robaron|perdi|se\s+me\s+dano).*(?:celular|telefono|movil)/,
    ),
  },
  {
    id: "correct_safe_word",
    weight: -45,
    description: "Palabra clave correcta",
    example: "Tamarindo",
    detect: detectSafeWord,
  },
  {
    id: "no_money_or_data_requested",
    weight: -15,
    description: "No pide dinero ni datos",
    example: "Solo confirmar la cita",
    detect: regex(
      /(?:solo|solamente|nada\s+mas).*(?:queria|quiero|llamaba|llamo|avisar|confirmar|saludar|decirle|recordar|informar|invitar|agradecer|felicit)|(?:solo|solamente).*(?:para|es\s+para).*(?:confirmar|avisar|saludar|recordar|informar|invitar|agradecer|felicit|decirle)/,
    ),
  },
  {
    id: "offers_verification_channel",
    weight: -10,
    description: "Ofrece un canal de verificación oficial",
    example: "Puede llamar a la línea de citas",
    detect: regex(
      /(?:puede|pueden|podria|podrian).*(?:llamar|consultar|verificar|revisar|confirmar|comprobar).*(?:linea|pagina|web|sede|oficina|portal|numero|sitio|correo|app|aplicacion)|(?:verifique|consulte|compruebe|confirme).*(?:en|por|con).*(?:linea|pagina|web|sede|oficina|portal|numero|sitio|correo|app|aplicacion|central|atencion)/,
    ),
  },
];

/** Busca la definición de una señal por id. */
export function lookup(id: SignalId): SignalDef | undefined {
  return CATALOG.find((s) => s.id === id);
}
