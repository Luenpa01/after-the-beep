import type { HouseholdContext, SignalId } from "./types";
import { normalize } from "./text";

/**
 * Detection function: receives the normalized text, the raw text, and the
 * household context. Returns an evidence fragment or `null` if the signal
 * is not present.
 */
export type DetectFn = (
  normalizedText: string,
  rawText: string,
  ctx: HouseholdContext,
) => string | null;

/** Definition of a signal from the Appendix A catalog. */
export type SignalDef = {
  id: SignalId;
  weight: number;
  description: string;
  example: string;
  detect: DetectFn;
};

/** Returns an evidence fragment based on a regex match. */
function regex(pattern: RegExp): DetectFn {
  return (normalizedText, rawText) => {
    if (pattern.test(normalizedText)) {
      return rawText.length <= 200 ? rawText : rawText.slice(0, 200) + "…";
    }
    return null;
  };
}

/** Detects the household safe word in the caller's text. */
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
 * Complete Appendix A catalog (15 signals) with deterministic rules.
 *
 * Patterns operate on normalized text (lowercase, no accents, no punctuation).
 * Each signal combines Spanish (Colombian, Mexican, neutral) and English
 * phrase patterns so the engine works in both languages.
 */
export const CATALOG: SignalDef[] = [
  {
    id: "family_from_unknown",
    weight: 15,
    description: "Claims to be family from an unknown number",
    example: "Abuela, soy yo / Grandma, it's me",
    detect: regex(
      /(?:soy\s+(?:tu|su)\s+(?:nieto|nieta|hijo|hija|sobrino|sobrina|primo|prima|yerno|nuera|familiar))|(?:abuelita|abuela|abuelo|abuelito|mama|mamita|papa|papito|tita|tia|tio),?\s+soy\s+(?:yo|[a-z]+)|(?:\bsoy\s+yo\b)|(?:\bits\s+me\b)|(?:\bim\s+(?:your\s+)?(?:grandson|granddaughter|son|daughter|nephew|niece|cousin)\b)/,
    ),
  },
  {
    id: "impersonates_entity",
    weight: 15,
    description: "Impersonates an institution (bank, government, utility)",
    example: "Le hablamos del área de seguridad / This is the fraud department",
    detect: regex(
      /(?:hablo|llamo|llamamos|hablamos|somos|trabajamos|le\s+llamo|le\s+llamamos|lo\s+llamo|los\s+llamamos).*(?:de|del|desde|para).*(?:banco|gobierno|municipio|alcaldia|policia|fiscalia|ministerio|dian|seguridad|servicios|compania|empresa|entidad|area de seguridad|departamento|direccion de impuestos)|(?:this is|im calling from|we are calling from|were calling from|calling from|this is the).*(?:bank|government|irs|police|fbi|treasury|medicare|social security|fraud department|security department|fraud prevention|utility company)/,
    ),
  },
  {
    id: "sudden_emergency",
    weight: 15,
    description: "Sudden emergency",
    example: "Tuve un accidente / I had an accident",
    detect: regex(
      /(?:accidente|choque|colision|urgencia|urgencias|hospital|clinica|emergencia|secuestraron|asaltaron|robaron|golpearon|herido|herida|sangrando|estoy\s+grave|estoy\s+mal|me\s+accident|me\s+cai|me\s+lastim|operacion|cirugia|intubado|uci|cuidados\s+intensivos)|(?:accident|crash|emergency|hospital|hurt|injured|bleeding|in\s+trouble|car\s+wreck|ambulance|icu|intensive\s+care|kidnapped|mugged|robbed|attacked|im\s+hurt|got\s+into\s+an\s+accident)/,
    ),
  },
  {
    id: "requests_urgent_money",
    weight: 20,
    description: "Asks for urgent money",
    example: "Necesito cuatro millones ya / I need four thousand dollars now",
    detect: regex(
      /(?:necesito|necesitamos|mande|manda|envia|enviame|dame|pasame|prestame|gira|transfiere|deposita).*(?:plata|dinero|pesos|millones|billete|pasta|transferencia|deposito|giro|envio|recarga)|(?:plata|dinero|pesos|millones).*(?:ya|urgente|ahora|inmediatamente|lo\s+antes\s+posible|rapido|pronto)|(?:need|send|transfer|wire|give|lend|pay|deposit|cash).*(?:money|dollars|cash|funds|thousand|million|bucks|payment)|(?:money|dollars|cash|funds).*(?:now|urgent|immediately|right\s+away|asap|quickly|today)/,
    ),
  },
  {
    id: "requests_code_pin",
    weight: 35,
    description: "Asks for a code, password, or PIN",
    example: "Dígame el código que le llegó / Read me the code we just texted you",
    detect: regex(
      /(?:diga|dime|deme|pasa|envia|enviame|dame|cual\s+es|dame\s+el|digame\s+el|digame|deme\s+el|deme\s+su|pasame|mande|enviame).*(?:codigo|pin|contrasena|clave|token|otp|numero\s+de\s+verificacion|codigo\s+de\s+seguridad|codigo\s+de\s+verificacion)|(?:codigo|pin|contrasena|clave|token|otp).*(?:que\s+le\s+llego|que\s+le\s+enviamos|de\s+seguridad|de\s+verificacion)|(?:read|tell|give|send|text|share|provide|whats|what\s+is).*(?:code|pin|password|passcode|token|otp|verification\s+code|security\s+code)|(?:code|pin|password|passcode|token|otp).*(?:we\s+sent|we\s+texted|that\s+was\s+sent|you\s+received)/,
    ),
  },
  {
    id: "unusual_payment_method",
    weight: 25,
    description: "Unusual payment method (gift cards, crypto, wire to third parties)",
    example: "Compre tarjetas de regalo / Buy some gift cards",
    detect: regex(
      /(?:tarjeta|tarjetas).*(?:regalo|gift|google\s+play|itunes|apple|amazon)|(?:cripto|crypto|bitcoin|usdt|usdc|binance|ethereum|litecoin)|(?:western\s+union|moneygram|giro\s+a\s+terceros|giro\s+internacional|transferencia\s+a\s+terceros)|(?:gift\s+card|itunes\s+card|google\s+play\s+card|apple\s+card|amazon\s+card)|(?:cryptocurrency|btc|eth)|(?:wire\s+transfer|wire\s+to\s+a\s+third\s+party|wire\s+to\s+someone\s+else)/,
    ),
  },
  {
    id: "requests_secrecy",
    weight: 20,
    description: "Asks to keep it secret",
    example: "No le digas a mi mamá / Don't tell mom",
    detect: regex(
      /(?:no\s+le|no\s+les|no\s+nos).*(?:diga|digas|cuente|cuentes|avise|avisa|comente|comentes).*(?:mama|papa|familia|nadie|esposa|esposo)|(?:guardalo|guardenlo|manten.*en\s+secreto|entre\s+nosotros|entre\s+tu\s+y\s+yo|no\s+avises\s+a\s+nadie|no\s+le\s+cuentes\s+a\s+nadie|no\s+se\s+lo\s+digas\s+a\s+nadie)|(?:dont\s+tell|dont\s+say\s+anything|keep\s+it.*secret|keep\s+this\s+between\s+us|between\s+you\s+and\s+me|dont\s+let\s+anyone\s+know|dont\s+mention\s+this|keep\s+it\s+quiet|dont\s+breathe\s+a\s+word)/,
    ),
  },
  {
    id: "time_pressure",
    weight: 15,
    description: "Time pressure",
    example: "Tiene cinco minutos / You have five minutes",
    detect: regex(
      /(?:tiene|tienes|tienen|tengo|tenemos).*(?:minuto|hora)|(?:es\s+urgente|muy\s+urgente|no\s+hay\s+tiempo|tiene\s+que\s+ser\s+hoy|antes\s+de\s+que\s+se\s+acabe|se\s+vence\s+hoy|limite\s+de\s+tiempo)|(?:ya\s+mismo|inmediatamente|cuanto\s+antes|lo\s+antes\s+posible|rapido\s+rapido)|(?:you\s+have|youve\s+got|you\s+only\s+have|theres\s+only).*(?:minutes|hours|seconds)|(?:its\s+urgent|very\s+urgent|no\s+time|you\s+have\s+to\s+do\s+this\s+today|before\s+time\s+runs\s+out|deadline|time\s+is\s+running\s+out|immediately|as\s+soon\s+as\s+possible|right\s+away)/,
    ),
  },
  {
    id: "evades_simple_questions",
    weight: 15,
    description: "Dodges simple questions",
    example: "Eso no importa ahora / That doesn't matter right now",
    detect: regex(
      /(?:eso\s+no\s+importa|no\s+importa\s+eso|no\s+te\s+preocupes\s+por\s+eso|no\s+viene\s+al\s+caso|despues\s+te\s+explico|despues\s+te\s+cuento|despues\s+te\s+digo|no\s+es\s+relevante|no\s+se\s+preocupe\s+por\s+eso|eso\s+no\s+es\s+lo\s+importante)|(?:that\s+doesnt\s+matter|dont\s+worry\s+about\s+that|thats\s+not\s+important|thats\s+not\s+the\s+point|well\s+talk\s+about\s+that\s+later|thats\s+not\s+relevant|lets\s+not\s+get\s+into\s+that|not\s+important\s+right\s+now)/,
    ),
  },
  {
    id: "fear_or_threat",
    weight: 10,
    description: "Fear or threats",
    example: "Va a perder la plata / You'll lose your money",
    detect: regex(
      /(?:va\s+a\s+perder|perder\s+(?:la|su)\s+(?:plata|cuenta|ahorro|pension|casa|dinero)|quedar\s+sin\s+(?:plata|nada|cuenta|casa|dinero)|embargar|embargo|ir\s+a\s+la\s+carcel|carcel|demanda|denuncia|juicio|multa|sancion|remate|ejecucion|le\s+van\s+a\s+(?:embargar|demandar|quitar|cancelar|suspender|bloquear)|se\s+va\s+a\s+(?:embargar|demandar|cancelar|suspender|bloquear))|(?:youll\s+lose|you\s+will\s+lose|going\s+to\s+lose|youre\s+going\s+to\s+lose|lose\s+your|lose\s+everything|gonna\s+lose|foreclosure|lawsuit|going\s+to\s+jail|arrest|warrant|cut\s+off|shut\s+off|disconnect|suspended|cancel\s+your\s+account)/,
    ),
  },
  {
    id: "unknown_safe_word",
    weight: 30,
    description: "Doesn't know the safe word",
    example: "¿Qué palabra? / What word?",
    detect: regex(
      /(?:que\s+palabra|cual\s+palabra|no\s+se\s+la\s+palabra|no\s+me\s+acuerdo.*palabra|no\s+recuerdo.*palabra|no\s+conozco.*palabra|no\s+se\s+cual\s+palabra|no\s+tengo\s+palabra|no\s+me\s+dijeron.*palabra|que\s+palabra\s+clave|cual\s+es\s+la\s+palabra)|(?:what\s+word|which\s+word|i\s+dont\s+know.*word|i\s+dont\s+remember.*word|i\s+forgot.*word|what\s+safe\s+word|whats\s+the\s+word|i\s+dont\s+have\s+a\s+word|what\s+is\s+the\s+word)/,
    ),
  },
  {
    id: "new_number_known_person",
    weight: 10,
    description: "New number for a supposed acquaintance",
    example: "La llamo de uno prestado / I'm calling from a borrowed phone",
    detect: regex(
      /(?:llamo\s+de|estoy\s+llamando\s+de|te\s+llamo\s+de|le\s+llamo\s+de).*(?:prestado|un\s+numero|otro\s+numero|otro\s+celular|un\s+celular|telefono\s+prestado|otro\s+telefono|numero\s+nuevo|no\s+es\s+mi\s+numero)|(?:me\s+robaron|perdi|se\s+me\s+dano).*(?:celular|telefono|movil)|(?:calling\s+from|im\s+calling\s+from|this\s+is\s+a|im\s+at\s+a).*(?:borrowed\s+phone|different\s+number|new\s+number|not\s+my\s+phone|someone\s+elses\s+phone|a\s+friends\s+phone|another\s+phone|lost\s+my\s+phone|phone\s+was\s+stolen|broke\s+my\s+phone|dont\s+have\s+my\s+phone)/,
    ),
  },
  {
    id: "correct_safe_word",
    weight: -45,
    description: "Correct safe word",
    example: "Tamarindo / Tamarind",
    detect: detectSafeWord,
  },
  {
    id: "no_money_or_data_requested",
    weight: -15,
    description: "Asks for no money or data",
    example: "Solo confirmar la cita / Just confirming the appointment",
    detect: regex(
      /(?:solo|solamente|nada\s+mas).*(?:queria|quiero|llamaba|llamo|avisar|confirmar|saludar|decirle|recordar|informar|invitar|agradecer|felicit)|(?:solo|solamente).*(?:para|es\s+para).*(?:confirmar|avisar|saludar|recordar|informar|invitar|agradecer|felicit|decirle)|(?:just|only|simply).*(?:wanted\s+to|calling\s+to|to).*(?:confirm|let\s+you\s+know|remind\s+you|say\s+hi|check\s+in|follow\s+up|verify|inform|invite|thank|congratulate)|(?:just|only).*(?:confirming|checking\s+in|letting\s+you\s+know|reminding|following\s+up|verifying|saying\s+hi)/,
    ),
  },
  {
    id: "offers_verification_channel",
    weight: -10,
    description: "Offers an official verification channel",
    example: "Puede llamar a la línea de citas / You can call the appointments line",
    detect: regex(
      /(?:puede|pueden|podria|podrian).*(?:llamar|consultar|verificar|revisar|confirmar|comprobar).*(?:linea|pagina|web|sede|oficina|portal|numero|sitio|correo|app|aplicacion)|(?:verifique|consulte|compruebe|confirme).*(?:en|por|con).*(?:linea|pagina|web|sede|oficina|portal|numero|sitio|correo|app|aplicacion|central|atencion)|(?:you\s+can|you\s+could|please|you\s+may).*(?:call|check|verify|confirm|look\s+up|contact).*(?:line|number|office|website|portal|desk|department|branch|main\s+number|customer\s+service|hotline)|(?:verify|check|confirm|look\s+up).*(?:with|at|by\s+calling|on|through).*(?:line|number|office|website|portal|desk|department|branch|main\s+number|customer\s+service|hotline)/,
    ),
  },
];

/** Look up a signal definition by id. */
export function lookup(id: SignalId): SignalDef | undefined {
  return CATALOG.find((s) => s.id === id);
}
