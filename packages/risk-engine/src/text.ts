/**
 * Normaliza texto para comparación de patrones: minúsculas, sin tildes, sin
 * puntuación y con espacios colapsados. Permite escribir los patrones en
 * ASCII puro sin preocuparse por acentos ni mayúsculas.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes y diacríticos (ñ → n)
    .replace(/[.,;:!?¡¿()"'«»""'']/g, " ") // puntuación → espacio
    .replace(/\s+/g, " ")
    .trim();
}
