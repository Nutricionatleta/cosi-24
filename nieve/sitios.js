// ─────────────────────────────────────────────────────────────
//  SITIOS DE SKIMO — todo lo editable está aquí.
//  alt = cota (m) a la que se mira la nieve (zona de subida).
//  coche = tiempo aproximado en coche desde ORIGEN.
//  dormir = ideas de alojamiento; «busca» es lo que se busca en Booking/Airbnb/Maps.
//           refugio: true → se reserva en su web (no sale en Booking).
// ─────────────────────────────────────────────────────────────
export const ORIGEN = 'Barcelona';

export const SITIOS = [
  { id: 'nuria', nombre: 'Vall de Núria', zona: 'Ripollès', lat: 42.3975, lon: 2.1525, alt: 2100, coche: '1 h 45 + cremallera',
    web: 'https://pirineu365.cat/valldenuria/inici/', nota: 'Subida al Puigmal o a Noufonts desde el santuario.', pueblo: 'Queralbs',
    dormir: [
      { nombre: 'Hotel Vall de Núria', tipo: 'Hotel', emoji: '🏨', nota: 'En el mismo santuario: sales a esquiar desde la puerta.', busca: 'Hotel Vall de Núria' },
      { nombre: 'Alberg Pic de l’Àliga', tipo: 'Albergue', emoji: '🛖', nota: 'Albergue en lo alto del valle, con vistas a todo Núria.', busca: 'Alberg Pic de l\'Àliga Núria', refugio: true },
      { nombre: 'Casa rural en Queralbs', tipo: 'Casa rural', emoji: '🏡', nota: 'Pueblo de piedra al pie del cremallera.', busca: 'Queralbs' },
    ] },
  { id: 'vallter', nombre: 'Vallter 2000', zona: 'Ripollès', lat: 42.4256, lon: 2.2647, alt: 2200, coche: '2 h 15',
    web: 'https://pirineu365.cat/vallter/inici/', nota: 'Circo bajo el Bastiments. De lo más cerca.', pueblo: 'Setcases',
    dormir: [
      { nombre: 'Refugi d’Ulldeter', tipo: 'Refugio', emoji: '⛺', nota: 'Refugio de montaña junto a la estación: lo más skimo que hay.', busca: 'Refugi d\'Ulldeter', refugio: true },
      { nombre: 'Casa rural en Setcases', tipo: 'Casa rural', emoji: '🏡', nota: 'El último pueblo antes de subir a Vallter.', busca: 'Setcases' },
      { nombre: 'Hotel en Camprodon', tipo: 'Hotel', emoji: '🏨', nota: 'A unos 25 min. El de aquella excursión 💛', busca: 'Camprodon' },
    ] },
  { id: 'cerdanya', nombre: 'La Molina · Masella', zona: 'Cerdanya', lat: 42.345, lon: 1.92, alt: 2100, coche: '1 h 50',
    web: 'https://www.masella.com/', nota: 'Tosa d’Alp y Puigmal por la Cerdanya.', pueblo: 'Alp',
    dormir: [
      { nombre: 'Cap del Rec', tipo: 'Refugio', emoji: '⛺', nota: 'Refugio en mitad del bosque, en Lles de Cerdanya.', busca: 'Cap del Rec Lles de Cerdanya', refugio: true },
      { nombre: 'Casa rural en Alp', tipo: 'Casa rural', emoji: '🏡', nota: 'A 10 min de La Molina y de Masella.', busca: 'Alp, Girona' },
      { nombre: 'Hotel en Puigcerdà', tipo: 'Hotel', emoji: '🏨', nota: 'Pueblo con vida para cenar después.', busca: 'Puigcerdà' },
    ] },
  { id: 'comte', nombre: 'Port del Comte', zona: 'Solsonès', lat: 42.1747, lon: 1.5617, alt: 2000, coche: '2 h',
    web: 'https://portdelcomte.net/', nota: 'Prepirineo: cerca, pero la nieve va más justa.', pueblo: 'Sant Llorenç de Morunys',
    dormir: [
      { nombre: 'Casa rural en La Coma i la Pedra', tipo: 'Casa rural', emoji: '🏡', nota: 'Pegado a la subida a la estación.', busca: 'La Coma i la Pedra' },
      { nombre: 'Hotel en Sant Llorenç de Morunys', tipo: 'Hotel', emoji: '🏨', nota: 'Pueblo medieval junto al pantano de la Llosa del Cavall.', busca: 'Sant Llorenç de Morunys' },
    ] },
  { id: 'espot', nombre: 'Espot', zona: 'Pallars Sobirà', lat: 42.557, lon: 1.075, alt: 2100, coche: '3 h',
    web: 'https://pirineu365.cat/espotesqui/inici/', nota: 'Puerta de Aigüestortes y Sant Maurici.', pueblo: 'Espot',
    dormir: [
      { nombre: 'Hotel en Espot', tipo: 'Hotel', emoji: '🏨', nota: 'Pueblo de montaña a la entrada de Aigüestortes.', busca: 'Espot' },
      { nombre: 'Casa rural en Esterri d’Àneu', tipo: 'Casa rural', emoji: '🏡', nota: 'Más opciones, a unos 15 min.', busca: 'Esterri d\'Àneu' },
    ] },
  { id: 'andorra', nombre: 'Grandvalira', zona: 'Andorra', lat: 42.5761, lon: 1.6676, alt: 2300, coche: '3 h',
    web: 'https://www.grandvalira.com/', nota: 'Cota alta: de las nieves más seguras.', pueblo: 'Soldeu',
    dormir: [
      { nombre: 'Hotel en Soldeu', tipo: 'Hotel', emoji: '🏨', nota: 'A pie de pistas.', busca: 'Soldeu' },
      { nombre: 'Apartamento en Canillo', tipo: 'Apartamento', emoji: '🏠', nota: 'Más tranquilo, con telecabina a las pistas.', busca: 'Canillo' },
    ] },
  { id: 'baqueira', nombre: 'Baqueira-Beret', zona: 'Val d’Aran', lat: 42.6995, lon: 0.933, alt: 2000, coche: '3 h 45',
    web: 'https://www.baqueira.es/', nota: 'Le entra el Atlántico: la nieve más fiable.', pueblo: 'Salardú',
    dormir: [
      { nombre: 'Casa rural en Salardú', tipo: 'Casa rural', emoji: '🏡', nota: 'Pueblo de piedra a 5 min de Baqueira.', busca: 'Salardú' },
      { nombre: 'Apartamento en Baqueira 1500', tipo: 'Apartamento', emoji: '🏠', nota: 'A pie de pistas. Repetimos Baqueira 💛', busca: 'Baqueira' },
      { nombre: 'Hotel en Vielha', tipo: 'Hotel', emoji: '🏨', nota: 'Capital del valle, con más sitios para cenar.', busca: 'Vielha' },
    ] },
];

// Presupuesto del finde. Material = alquiler aproximado de equipo de skimo (esquís, botas, pieles, bastones + ARVA/pala/sonda).
export const PRESUPUESTO = { alojamiento: 300, noches: 2, material: { personas: 2, dias: 2, porDia: 45 } };

// Festivos que pueden alargar el finde (se marcan en el calendario).
export const FESTIVOS = {
  '2026-12-08': 'Inmaculada', '2026-12-25': 'Navidad', '2026-12-26': 'Sant Esteve',
  '2027-01-01': 'Año Nuevo', '2027-01-06': 'Reyes', '2027-03-26': 'Viernes Santo', '2027-03-29': 'Lunes de Pascua',
};

// Riesgo de aludes: mirarlo SIEMPRE antes de salir.
export const ALUDES = [
  { nombre: 'Catalunya (ICGC)', url: 'https://bpa.icgc.cat/' },
  { nombre: 'Val d’Aran (Lauegi)', url: 'https://lauegi.report/' },
  { nombre: 'Andorra', url: 'https://www.meteo.ad/estatneu' },
];
