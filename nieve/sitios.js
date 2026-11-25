// ─────────────────────────────────────────────────────────────
//  SITIOS DE SKIMO — todo lo editable está aquí.
//  alt = cota (m) a la que se mira la nieve (zona de subida).
//  coche = tiempo aproximado en coche desde ORIGEN.
// ─────────────────────────────────────────────────────────────
export const ORIGEN = 'Barcelona';

export const SITIOS = [
  { id: 'nuria', nombre: 'Vall de Núria', zona: 'Ripollès', lat: 42.3975, lon: 2.1525, alt: 2100, coche: '1 h 45 + cremallera',
    web: 'https://pirineu365.cat/valldenuria/inici/', nota: 'Subida al Puigmal o a Noufonts desde el santuario.' },
  { id: 'vallter', nombre: 'Vallter 2000', zona: 'Ripollès', lat: 42.4256, lon: 2.2647, alt: 2200, coche: '2 h 15',
    web: 'https://pirineu365.cat/vallter/inici/', nota: 'Circo bajo el Bastiments. De lo más cerca.' },
  { id: 'cerdanya', nombre: 'La Molina · Masella', zona: 'Cerdanya', lat: 42.345, lon: 1.92, alt: 2100, coche: '1 h 50',
    web: 'https://www.masella.com/', nota: 'Tosa d’Alp y Puigmal por la Cerdanya.' },
  { id: 'comte', nombre: 'Port del Comte', zona: 'Solsonès', lat: 42.1747, lon: 1.5617, alt: 2000, coche: '2 h',
    web: 'https://portdelcomte.net/', nota: 'Prepirineo: cerca, pero la nieve va más justa.' },
  { id: 'espot', nombre: 'Espot', zona: 'Pallars Sobirà', lat: 42.557, lon: 1.075, alt: 2100, coche: '3 h',
    web: 'https://pirineu365.cat/espotesqui/inici/', nota: 'Puerta de Aigüestortes y Sant Maurici.' },
  { id: 'andorra', nombre: 'Grandvalira', zona: 'Andorra', lat: 42.5761, lon: 1.6676, alt: 2300, coche: '3 h',
    web: 'https://www.grandvalira.com/', nota: 'Cota alta: de las nieves más seguras.' },
  { id: 'baqueira', nombre: 'Baqueira-Beret', zona: 'Val d’Aran', lat: 42.6995, lon: 0.933, alt: 2000, coche: '3 h 45',
    web: 'https://www.baqueira.es/', nota: 'Le entra el Atlántico: la nieve más fiable.' },
];

// Riesgo de aludes: mirarlo SIEMPRE antes de salir.
export const ALUDES = [
  { nombre: 'Catalunya (ICGC)', url: 'https://bpa.icgc.cat/' },
  { nombre: 'Val d’Aran (Lauegi)', url: 'https://lauegi.report/' },
  { nombre: 'Andorra', url: 'https://www.meteo.ad/estatneu' },
];
