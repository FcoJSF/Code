const RULES = [
  { category: 'Income',          color: '#22c55e', keywords: ['NOM ', 'NOMINA', 'SUELDO', 'SALARY', 'DEPOSITO NOMINA', 'PAGO DE NOMINA', 'SPEI RECIBIDO', 'TRANSFERENCIA RECIBIDA'] },
  { category: 'Food & Dining',   color: '#f97316', keywords: ['UBER.*EATS', 'UBEREATS', 'RAPPI', 'DIDI.*FOOD', 'DIDIFOOD', 'MCDONALDS', 'MCDONALD', 'STARBUCKS', 'DOMINO', 'PIZZA', 'BURGER', 'TACO', 'SUSHI', 'RESTAURAN', 'COMIDA', 'FONDA', 'CARNITAS', 'TORTA', 'TAQUER', 'MARISCOS', 'POLLO', 'SUBWAY', 'KFC', 'WENDYS', 'IHOP', 'APPLEBEE', 'CHILIS', 'FRIDAYS', 'VIPS', 'DENNY', 'LITTLE CAESAR', 'PAPA JOHN', 'TELEPIZZA'] },
  { category: 'Groceries',       color: '#eab308', keywords: ['WALMART', 'BODEGA AURRERA', 'CHEDRAUI', 'SORIANA', 'LA COMER', 'SUPERAMA', 'HEB', 'COSTCO', 'SAMS CLUB', 'SAM\'S', 'CITY MARKET', 'FRESKO', 'MEGA COMER', 'COMERCIAL MEXICANA', 'MERCADO', 'TIANGUIS', 'SUPERSTORE', 'SUPERMERCADO'] },
  { category: 'Transportation',  color: '#3b82f6', keywords: ['\\bUBER\\b', 'DIDI\\b', 'CABIFY', 'INDRIVER', 'GASOLINA', 'GAS STATION', 'PEMEX', 'SHELL GASOLINERA', 'REPSOL', 'BP ', 'TOTAL GAS', 'ESTACION DE SERVICIO', 'METRO ', 'METROBUS', 'CETRAM', 'ESTACIONAMIENTO', 'PARKING', 'VALET', 'AUTOPISTA', 'PEAJE', 'CASETA', 'CAPUFE'] },
  { category: 'Shopping',        color: '#a855f7', keywords: ['AMAZON', 'MERCADO LIBRE', 'MELI ', 'LIVERPOOL', 'PALACIO DE HIERRO', 'ZARA', 'H&M', 'PULL&BEAR', 'BERSHKA', 'STRADIVARIUS', 'MASSIMO DUTTI', 'SHEIN', 'PRIVALIA', 'LINIO', 'COPPEL', 'ELEKTRA', 'FAMSA', 'SUBURBIA', 'C&A ', 'GAP ', 'FOREVER 21', 'GUESS ', 'NIKE ', 'ADIDAS ', 'PUMA ', 'REEBOK', 'UNDER ARMOUR', 'SKETCHERS', 'VANS ', 'CONVERSE', 'APPLE STORE', 'BEST BUY', 'OFFICE DEPOT', 'OFFICEMA', 'RADIOSHACK'] },
  { category: 'Fitness & Health', color: '#ec4899', keywords: ['FITMAX', 'GYM', 'FITNESS', 'SPORT CITY', 'SPORTCITY', 'SMARTFIT', 'SMART FIT', 'GIMNASIO', 'ANYTIME FITNESS', 'CROSSFIT', 'YOGA', 'PILATES', 'FARMACIA', 'FARMACIAS', 'SIMILARES', 'DEL AHORRO', 'BENAVIDES', 'GUADALAJARA', 'HOSPITAL', 'CLINICA', 'MEDICO', 'DOCTOR', 'DENTISTA', 'DENTAL', 'OPTICA', 'LABORATORIO', 'CONSULTA'] },
  { category: 'Entertainment',   color: '#06b6d4', keywords: ['NETFLIX', 'SPOTIFY', 'DISNEY', 'HBO ', 'APPLE.COM/BILL', 'YOUTUBE', 'AMAZON PRIME', 'PARAMOUNT', 'STAR\\+', 'CRUNCHYROLL', 'TWITCH', 'STEAM ', 'PLAYSTATION', 'XBOX ', 'NINTENDO', 'CINE', 'CINEPOLIS', 'CINEMEX', 'TEATRO', 'CONCIERTO', 'EVENTO', 'TICKETMASTER', 'SUPERBOLETOS'] },
  { category: 'Utilities',       color: '#64748b', keywords: ['CFE ', 'COMISION FEDERAL', 'TELMEX', 'IZZI', 'MEGACABLE', 'TOTALPLAY', 'AXTEL', 'TELCEL', 'AT&T', 'MOVISTAR', 'UNEFON', 'VIRGIN MOBILE', 'BAIT ', 'OUI MOBILE', 'AGUA ', 'SACMEX', 'PREDIAL', 'TENENCIA', 'CDMX IMPUESTO', 'RECIBO', 'PAGO DE SERVICIO', 'GAS NATURAL', 'CALIDRA'] },
  { category: 'Travel',          color: '#f59e0b', keywords: ['AIRBNB', 'BOOKING', 'EXPEDIA', 'TRIVAGO', 'HOTEL', 'HOSTAL', 'MOTEL', 'AEROMEXICO', 'VOLARIS', 'VIVAAEROBUS', 'VIVA AEROBUS', 'INTERJET', 'AEROMAR', 'AEROPORTO', 'AEROPUERTO', 'AEROLINEA', 'VUELO', 'RENTA DE AUTO', 'HERTZ', 'NATIONAL CAR', 'EUROPCAR', 'ALAMO '] },
  { category: 'Education',       color: '#10b981', keywords: ['UDEMY', 'COURSERA', 'DUOLINGO', 'PLATZI', 'COLEGIO', 'ESCUELA', 'UNIVERSIDAD', 'COLEGIATURA', 'INSCRIPCION', 'BECA', 'LIBRO', 'LIBRERIA', 'PAPELERIA'] },
  { category: 'Personal Care',   color: '#fb7185', keywords: ['SALON', 'BARBERIA', 'PELUQUERIA', 'SPA ', 'MANICURE', 'PEDICURE', 'ESTETICA', 'BELLEZA', 'SEPHORA', 'MAC COSMETICOS', 'NATURE\'S HEART', 'BODY SHOP', 'LUSH '] },
  { category: 'Finance',         color: '#8b5cf6', keywords: ['PAGO TARJETA', 'PAGO DE TARJETA', 'LIQUIDACION', 'ABONO', 'TRANSFERENCIA', 'SPEI', 'RETIRO ATM', 'CAJERO', 'COMISION', 'ANUALIDAD', 'SEGURO', 'ASEGURADORA', 'AXA ', 'METLIFE', 'GNP ', 'BANAMEX', 'BBVA', 'HSBC', 'SANTANDER', 'BANORTE', 'SCOTIABANK', 'CITIBANAMEX', 'INBURSA'] },
]

const FALLBACK = { category: 'Other', color: '#94a3b8' }

export function categorize(concepto) {
  const upper = concepto.toUpperCase()
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (new RegExp(kw).test(upper)) {
        return { category: rule.category, color: rule.color }
      }
    }
  }
  return FALLBACK
}

export const CATEGORY_COLORS = Object.fromEntries(
  [...RULES, FALLBACK].map(r => [r.category, r.color])
)

export const ALL_CATEGORIES = [...RULES.map(r => r.category), FALLBACK.category]
