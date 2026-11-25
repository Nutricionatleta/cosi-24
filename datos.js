// =====================================================================
//  SARA CUMPLE 24 — TODO LO QUE SE PUEDE CAMBIAR ESTÁ AQUÍ
//  - Las fotos van en la carpeta "fotos/" (jpg/png, mejor < 500 KB cada una).
//  - Si una foto no existe, se muestra el emoji de al lado (para probar).
//  - Para probar desde cero:   index.html?reset=1
//  - Para saltar a una prueba: index.html?paso=4   (0 puerta, 1 intro,
//    2 sopa, 3 viajes, 4 test, 5 memory, 6 foto pixelada, 7 final)
// =====================================================================

window.DATOS = {
  nombre: "Sara",
  edad: 24,

  // ---------- PUERTA DE ENTRADA ----------
  contrasena: "cosi", // da igual mayúsculas/tildes
  // Acertijo: "____" marca dónde va el hueco que ella rellena
  acertijo: "Hola ____ que hoy es tu cumple!!!!",
  pistaContrasena: "Pista: es como te llamo yo 😏",

  // ---------- INTRO ----------
  intro: [
    "Feliz cumpleaños, Cosi 🎂",
    "Tu regalo está escondido aquí dentro. Para descubrirlo tendrás que superar 5 pruebas.",
    "Cada prueba te da una letra. Cuando tengas todas… ya verás.",
  ],

  // ---------- PALABRA FINAL ----------
  palabraFinal: "SKIMO",
  // Letra que gana en cada prueba (sopa, viajes, test, memory, foto). Desordenadas a propósito.
  letrasEnOrden: ["M", "O", "S", "I", "K"],
  pistaPalabra: "Es un deporte. Se sube con pieles y se baja esquiando 🏔️",

  // ---------- 1. SOPA DE LETRAS ----------
  // "nota" sale en un globito al encontrarla (opcional).
  sopa: [
    { palabra: "COSI", nota: "Mi Cosi 💛" },
    { palabra: "RATA", nota: "¡Qué rata! 🐀" },
    { palabra: "CUMPLE", nota: "¡El tuyo! 🎉" },
    { palabra: "SERO" },
    { palabra: "MARATÓN", nota: "¡Tu maratón! 🏃‍♀️" },
    { palabra: "ORDEN" },
  ],

  // ---------- 2. NUESTROS VIAJES ----------
  // Ponlos AQUÍ en el orden CORRECTO (del más antiguo al más reciente). La web los desordena.
  viajes: [
    // Orden confirmado por Pablo (25-nov). "fecha" es opcional: sale al acertar.
    { nombre: "Baqueira (tu regalo de cumple)", fecha: "", foto: "fotos/f12.jpg", emoji: "⛷️" },
    { nombre: "Francia en bici (mi regalo de cumple)", fecha: "", foto: "fotos/f14.jpg", emoji: "🚴" },
    { nombre: "Trail de Andorra", fecha: "", foto: "fotos/f15.jpg", emoji: "🏁" },
    { nombre: "Dolomitas", fecha: "", foto: "fotos/f06.jpg", emoji: "🏞️" },
    { nombre: "Chamonix, fin de año", fecha: "", foto: "fotos/f04.jpg", emoji: "🏔️" },
    { nombre: "Maratón de Barcelona (¡la tuya!)", fecha: "", foto: "fotos/f03.jpg", emoji: "🏃‍♀️" },
    { nombre: "San Sebastián", fecha: "", foto: "fotos/f01.jpg", emoji: "🌊" },
  ],

  // ---------- 3. ¿CUÁNTO ME CONOCES? ----------
  // "correcta" = posición de la buena empezando en 0.
  test: [
    {
      pregunta: "¿Cómo te llamo yo?",
      opciones: ["Cari", "Cosi", "Sarita", "Jefa"],
      correcta: 1,
      siAcierta: "Obvio. Esta era de calentamiento 😌",
      siFalla: "¿Perdona? Si es la contraseña de esta web 😂",
    },
    {
      pregunta: "Cuando uno le hace una jugarreta al otro, ¿qué le dice?",
      opciones: ["¡Qué malo!", "¡Qué morro!", "¡Qué rata!", "Nada, somos dos santos"],
      correcta: 2,
      siAcierta: "Rata tú, rata yo. Ratas los dos 🐀",
      siFalla: "Mmm… esa no. Piensa en un roedor 🐀",
    },
    {
      pregunta: "Estoy con el portátil y me hablas. ¿Qué te contesto?",
      opciones: ["«Dime, amor, te escucho»", "«Dame cinco minutos»", "«Ahora no»", "«¿Eh?»", "No contesto 🙊"],
      correcta: 1,
      siAcierta: "Culpable. Prometo que este año serán cuatro minutos 🙈",
      siFalla: "Venga ya, sabes perfectamente cuál es 😅",
    },
    {
      pregunta: "¿Qué me regalaste tú por mi cumple?",
      opciones: ["Unas zapatillas", "Un finde en Baqueira", "Un viaje en bici por Francia", "Un reloj"],
      correcta: 2,
      siAcierta: "El mejor regalo. Ahora me toca a mí 😏",
      siFalla: "¡Pero si fue tu regalo! 🚴",
    },
    {
      pregunta: "¿Qué pasó en el viaje al Lago del Corazón?",
      opciones: ["Llovió todo el día", "Nos perdimos", "Estaba todo nevado y no hubo manera", "Llegamos y fue precioso"],
      correcta: 2,
      siAcierta: "La nieve nos debe una… 👀 (recuerda esto)",
      siFalla: "Mmm… algo blanco y frío nos chafó el plan ❄️",
    },
    {
      pregunta: "¿Cuántos años cumples hoy?",
      opciones: ["23", "18 (para mí, siempre)", "24", "24, pero tú eres más mayor 👴", "25"],
      correcta: 3,
      siAcierta: "Exacto. 24, y yo más viejo 😂💛",
      siFalla: "Jajaja, ojalá. Pero no 😜",
      // mensaje propio para una opción concreta (posición: texto)
      comentarios: { 2: "Técnicamente sí… pero hay una respuesta más completa 😏" },
    },
  ],

  // ---------- 4. MEMORY ----------
  // 6 fotos = 12 cartas (parejas).
  memory: [
    { foto: "fotos/f02.jpg", emoji: "🌲" }, // Camprodon
    { foto: "fotos/f05.jpg", emoji: "🏞️" }, // lago Dolomitas
    { foto: "fotos/f07.jpg", emoji: "🏡" }, // Rupit
    { foto: "fotos/f10.jpg", emoji: "😱" }, // Urnieta
    { foto: "fotos/f11.jpg", emoji: "🚴" }, // Platja d'Aro
    { foto: "fotos/f13.jpg", emoji: "🍺" }, // Cadaqués
  ],

  // ---------- 5. FOTO PIXELADA ----------
  pixel: {
    pregunta: "¿Dónde nos hicimos esta foto?",
    foto: "fotos/f09.jpg",
    emoji: "⛪",
    respuestas: ["Basilea", "Basel", "Bâle"], // cualquiera vale, sin importar tildes
    pistas: ["Pista: fue un reencuentro 🎓", "Pista: Erasmus y Suiza 🇨🇭"],
  },

  // ---------- FINAL: EL REGALO ----------
  regalo: {
    foto: "fotos/f08.jpg", // Lago del Corazón nevado. Sale arriba del vale (pon "" para quitarla)
    antetitulo: "Vale por",
    titulo: "Un fin de semana de skimo",
    subtitulo: "Esquí de montaña · tú y yo",
    detalles: [
      "🛏️ Dos días y una noche en la montaña",
      "🎿 Ruta y material: de eso me encargo yo",
    ],
    validez: "Válido en cuanto caiga la primera nevada buena ❄️",
    notaNieve: "", // frase pequeña bajo la validez (vacío = no sale)
  },

  carta: [
    "Cosi, te podria hacer una carta de la leche, creo que ya no lo necesitas, sabes que te quiero un montón y que eres la mejor, perdona por hacerte enfadar y por a veces no hacerte todo el caso que me gustaría. Gracias por la paciencia y por todo lo que me entiendes y me ayudas, te quiero eres la mejor!!!",
  ],
  firma: "Pablo",
};
