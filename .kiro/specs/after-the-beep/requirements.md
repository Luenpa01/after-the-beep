# Requisitos — After the Beep

## Introducción

After the Beep revive el contestador automático de los años 80 como un escudo contra estafas telefónicas dirigidas a adultos mayores. Toda llamada de un número desconocido la atiende primero un agente de voz que identifica a quien llama, verifica a los supuestos familiares con una palabra clave y suma señales de estafa en vivo. Si la llamada es una estafa, el teléfono de la persona mayor nunca timbra y la familia recibe una alerta.

Problema que resuelve: en 2025 las personas de 60 años o más reportaron al IC3 del FBI 201.266 denuncias y USD 7.748 millones en pérdidas (+59% frente a 2024), con una pérdida promedio de USD 38.500. Las estafas con voz clonada y suplantación de familiares crecen porque la voz ya no sirve como prueba de identidad.

Usuarios:
- **Persona protegida** (Doña Gloria): adulta mayor, poca tolerancia a interfaces complejas.
- **Cuidador familiar** (Camila): configura el sistema, recibe alertas, revisa el historial.
- **Persona que llama**: legítima o estafadora.
- **Jurado del hackathon**: debe poder probar el sistema sin un teléfono real.

Categoría Kiroween: Resurrection (contestador automático + agente de voz).

## Requisito 1 — Atención y aviso inicial

**Historia de usuario:** Como cuidadora, quiero que toda llamada desconocida la atienda primero el contestador, para que mi mamá no tenga que decidir sola si es una estafa.

### Criterios de aceptación
1. CUANDO entre una llamada de un número que no está en la lista de contactos, EL SISTEMA DEBERÁ atenderla sin hacer timbrar el teléfono de la persona protegida.
2. CUANDO el sistema atienda una llamada, EL SISTEMA DEBERÁ informar en los primeros 5 segundos que la llamada la atiende un asistente automático y que queda grabada.
3. CUANDO el sistema atienda una llamada, EL SISTEMA DEBERÁ preguntar quién llama y el motivo de la llamada.
4. SI quien llama cuelga antes de identificarse, ENTONCES EL SISTEMA DEBERÁ registrar la llamada como "colgó sin identificarse" sin alertar a la familia.

## Requisito 2 — Contactos de confianza

**Historia de usuario:** Como cuidadora, quiero que los contactos conocidos pasen directo, para que el sistema no estorbe a la familia.

### Criterios de aceptación
1. CUANDO entre una llamada de un número en la lista de contactos, EL SISTEMA DEBERÁ transferirla de inmediato al teléfono de la persona protegida.
2. DONDE el hogar active el modo estricto, EL SISTEMA DEBERÁ aplicar la detección de señales también a los contactos de confianza, porque el identificador de llamadas se puede falsificar.
3. EL SISTEMA DEBERÁ permitir hasta 50 contactos por hogar.

## Requisito 3 — Verificación con palabra clave

**Historia de usuario:** Como cuidadora, quiero que quien diga ser de la familia demuestre conocer nuestra palabra clave, para que una voz clonada no engañe a mi mamá.

### Criterios de aceptación
1. CUANDO quien llama diga ser un familiar o un contacto conocido desde un número desconocido, EL SISTEMA DEBERÁ pedirle la palabra clave del hogar.
2. CUANDO la palabra clave dicha coincida con la configurada (tolerando errores de transcripción de hasta una edición por cada 6 caracteres y sin distinguir tildes ni mayúsculas), EL SISTEMA DEBERÁ restar 45 puntos al puntaje de sospecha.
3. SI quien llama no sabe la palabra clave o la evade, ENTONCES EL SISTEMA DEBERÁ sumar 30 puntos al puntaje de sospecha.
4. EL SISTEMA NO DEBERÁ revelar la palabra clave, pistas sobre ella ni si un intento fue "casi correcto".
5. EL SISTEMA DEBERÁ permitir como máximo 2 intentos por llamada.

## Requisito 4 — Detección de señales y puntaje en vivo

**Historia de usuario:** Como cuidadora, quiero que el sistema detecte tácticas de estafa conocidas durante la conversación, para bloquear la llamada antes de que hagan daño.

### Criterios de aceptación
1. EL SISTEMA DEBERÁ iniciar cada llamada con un puntaje de sospecha de 10 sobre 100.
2. CUANDO un turno de quien llama contenga una señal del catálogo (Anexo A), EL SISTEMA DEBERÁ sumar su peso al puntaje y guardar el fragmento de texto que la evidencia.
3. EL SISTEMA DEBERÁ mantener el puntaje entre 0 y 100.
4. EL SISTEMA DEBERÁ contar cada tipo de señal una sola vez por llamada.
5. CUANDO quien llama pida un código de verificación, una contraseña o un PIN, EL SISTEMA DEBERÁ responder que ninguna entidad legítima pide esos datos por teléfono.
6. EL SISTEMA DEBERÁ combinar reglas deterministas y un clasificador con modelo de lenguaje, y SI el modelo falla o tarda más de 2 segundos, ENTONCES EL SISTEMA DEBERÁ decidir solo con las reglas.

## Requisito 5 — Decisión

**Historia de usuario:** Como persona protegida, quiero que mi teléfono solo timbre cuando vale la pena, para no tener que lidiar con estafadores.

### Criterios de aceptación
1. CUANDO el puntaje llegue a 60 o más, EL SISTEMA DEBERÁ cerrar la llamada con un mensaje neutral y marcarla como bloqueada.
2. CUANDO la conversación termine con un puntaje menor que 30 y la llamada requiera respuesta en vivo (familiar verificado, urgencia legítima), EL SISTEMA DEBERÁ timbrar a la persona protegida y anunciarle quién llama y por qué antes de conectar.
3. CUANDO la conversación termine con un puntaje menor que 60 y sin necesidad de respuesta en vivo, EL SISTEMA DEBERÁ guardar el mensaje sin interrumpir.
4. EL SISTEMA DEBERÁ decidir en un máximo de 90 segundos de conversación; SI no ha decidido, ENTONCES DEBERÁ guardar el mensaje.

## Requisito 6 — Alerta a la familia

**Historia de usuario:** Como cuidadora, quiero enterarme de inmediato cuando bloquean una estafa, para llamar a mi mamá y verificar que esté bien.

### Criterios de aceptación
1. CUANDO el sistema bloquee una llamada, EL SISTEMA DEBERÁ enviar en menos de 30 segundos un mensaje (SMS o WhatsApp) a los cuidadores del hogar.
2. La alerta DEBERÁ incluir a quién suplantaron, qué pidieron, las señales detectadas y una acción concreta (por ejemplo, "llama a Andrés a su número de siempre").
3. La alerta NO DEBERÁ incluir la palabra clave ni datos financieros.
4. La alerta DEBERÁ incluir un enlace al detalle de la llamada en el panel familiar.

## Requisito 7 — Panel familiar

**Historia de usuario:** Como cuidadora, quiero configurar el sistema y revisar lo que pasó, para confiar en sus decisiones y corregirlas.

### Criterios de aceptación
1. EL SISTEMA DEBERÁ ofrecer una configuración guiada de máximo 5 pasos: persona protegida, palabra clave, contactos, cuidadores, prueba.
2. EL SISTEMA DEBERÁ mostrar el historial con fecha, número, veredicto, puntaje, señales, transcripción y grabación.
3. CUANDO una cuidadora marque una llamada como mal clasificada, EL SISTEMA DEBERÁ guardar la corrección y agregarla al conjunto de evaluación.
4. EL SISTEMA DEBERÁ permitir cambiar la palabra clave en cualquier momento.

## Requisito 8 — Teléfono de la persona protegida

**Historia de usuario:** Como persona protegida, quiero una pantalla que entienda sin ayuda, para contestar solo cuando me corresponde.

### Criterios de aceptación
1. CUANDO el sistema timbre, LA INTERFAZ DEBERÁ mostrar quién llama, si fue verificado y el motivo, en texto de mínimo 28 px.
2. LA INTERFAZ DEBERÁ tener un solo botón principal por pantalla, de mínimo 72 px de alto.
3. LA INTERFAZ DEBERÁ cumplir contraste WCAG 2.2 AAA en texto principal.
4. CUANDO haya mensajes guardados, LA INTERFAZ DEBERÁ mostrarlos con un contador grande estilo LED, como el contestador original.

## Requisito 9 — Privacidad y seguridad

**Historia de usuario:** Como cuidadora, quiero que las grabaciones y la palabra clave estén protegidas, para no crear un nuevo riesgo.

### Criterios de aceptación
1. EL SISTEMA DEBERÁ cifrar la palabra clave con una llave gestionada (KMS) y nunca escribirla en logs ni transcripciones; en la transcripción DEBERÁ aparecer como "[palabra clave]".
2. EL SISTEMA DEBERÁ cifrar grabaciones y transcripciones en reposo y borrarlas a los 30 días por defecto.
3. EL SISTEMA DEBERÁ separar los datos por hogar y no permitir a un usuario leer datos de otro hogar.
4. EL SISTEMA DEBERÁ pedir el consentimiento explícito de la persona protegida o su representante durante la configuración.
5. CUANDO el sistema detecte en la conversación números de tarjeta, cuentas o documentos de identidad, EL SISTEMA DEBERÁ enmascararlos antes de guardar.

## Requisito 10 — Modo jurado

**Historia de usuario:** Como jurado, quiero probar After the Beep desde el navegador, para evaluarlo sin hacer una llamada internacional.

### Criterios de aceptación
1. EL SISTEMA DEBERÁ ofrecer una página pública donde se pueda "llamar" desde el navegador con micrófono a un hogar de demostración.
2. La página DEBERÁ mostrar en vivo la transcripción, el medidor de sospecha y las señales, con el mismo diseño del demo.
3. La página DEBERÁ incluir 4 guiones sugeridos (nieto en apuros, falso banco, familiar verificado, cita médica) para que el jurado los actúe.
4. El hogar de demostración DEBERÁ usar datos ficticios y su palabra clave DEBERÁ estar publicada en la página.

## Requisito 11 — Rendimiento

### Criterios de aceptación
1. EL SISTEMA DEBERÁ responder a cada turno de quien llama con una latencia p50 menor que 1,5 s y p95 menor que 2,5 s.
2. EL SISTEMA DEBERÁ actualizar el puntaje en la interfaz en menos de 500 ms después de cerrar el turno.

## Requisito 12 — Evaluación

### Criterios de aceptación
1. EL PROYECTO DEBERÁ incluir un conjunto de evaluación de al menos 60 guiones en español (30 estafas y 30 legítimas) basados en las tipologías del IC3 y la FTC.
2. EL SISTEMA DEBERÁ detectar al menos el 90% de las estafas del conjunto.
3. EL SISTEMA DEBERÁ bloquear menos del 5% de las llamadas legítimas del conjunto.
4. CUANDO cambien las reglas, los pesos o los prompts, LA EVALUACIÓN DEBERÁ ejecutarse automáticamente y reportar ambas métricas.

## Anexo A — Catálogo inicial de señales

| Señal | Peso | Ejemplo |
|---|---|---|
| Dice ser un familiar desde número desconocido | +15 | "Abuela, soy yo" |
| Suplanta a una entidad (banco, gobierno, empresa de servicios) | +15 | "Le hablamos del área de seguridad" |
| Emergencia repentina | +15 | "Tuve un accidente" |
| Pide dinero urgente | +20 | "Necesito cuatro millones ya" |
| Pide código, contraseña o PIN | +35 | "Dígame el código que le llegó" |
| Medio de pago inusual (tarjetas regalo, cripto, giro a terceros) | +25 | "Compre tarjetas de regalo" |
| Pide guardar el secreto | +20 | "No le digas a mi mamá" |
| Presión de tiempo | +15 | "Tiene cinco minutos" |
| Evade preguntas simples | +15 | "Eso no importa ahora" |
| Genera miedo o amenaza | +10 | "Va a perder la plata" |
| No sabe la palabra clave | +30 | "¿Qué palabra?" |
| Número nuevo de un supuesto conocido | +10 | "La llamo de uno prestado" |
| Palabra clave correcta | −45 | "Tamarindo" |
| No pide dinero ni datos | −15 | "Solo confirmar la cita" |
| Ofrece un canal de verificación oficial | −10 | "Puede llamar a la línea de citas" |
