export type DestinationMeta = {
  lat: number;
  lng: number;
  department: string;
  image: string;
};

const pexels = [
  "https://images.pexels.com/photos/31776919/pexels-photo-31776919/free-photo-of-cultural-street-scene-in-antigua-guatemala.jpeg?cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/38171637/pexels-photo-38171637/free-photo-of-scenic-view-of-cerro-de-oro-in-guatemala.jpeg?cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/335887/pexels-photo-335887.jpeg?cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/27779028/pexels-photo-27779028/free-photo-of-a-view-of-a-small-town-on-the-water-with-mountains-in-the-background.jpeg?cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/25652965/pexels-photo-25652965/free-photo-of-mountain-among-clouds.jpeg?cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/19446758/pexels-photo-19446758/free-photo-of-a-wooden-pier-with-a-flag-of-guatemala-on-a-body-of-water.jpeg?cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/26088710/pexels-photo-26088710/free-photo-of-woman-in-patterned-blouse-and-skirt.jpeg?cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/20620435/pexels-photo-20620435/free-photo-of-mountain-behind-house-with-pool-in-guatemala.jpeg?cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/18227200/pexels-photo-18227200/free-photo-of-palace-of-the-captains-in-antigua-guatemala.jpeg?cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/18502701/pexels-photo-18502701/free-photo-of-flag-of-guatemala-above-the-water.jpeg?cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/11733141/pexels-photo-11733141.jpeg?cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/18473866/pexels-photo-18473866/free-photo-of-smiling-brunette-in-a-hat.jpeg?cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/33680800/pexels-photo-33680800/free-photo-of-historic-arches-of-antigua-guatemala-ruins.jpeg?cs=tinysrgb&dpr=1&w=1200",
  "https://images.pexels.com/photos/8635246/pexels-photo-8635246.jpeg?cs=tinysrgb&dpr=1&w=1200",
];

export const destinationMeta: Record<string, DestinationMeta> = {
  antigua: { lat: 14.5586, lng: -90.7295, department: "Sacatepéquez", image: pexels[0] },
  atitlan: { lat: 14.6907, lng: -91.2025, department: "Sololá", image: pexels[1] },
  peten: { lat: 16.9300, lng: -89.8920, department: "Petén", image: pexels[2] },
  semuc: { lat: 15.5333, lng: -89.9569, department: "Alta Verapaz", image: pexels[3] },
  acatenango: { lat: 14.5011, lng: -90.8758, department: "Chimaltenango", image: pexels[4] },
  "rio-dulce": { lat: 15.6589, lng: -88.9977, department: "Izabal", image: pexels[5] },
  chichi: { lat: 14.9433, lng: -91.1112, department: "Quiché", image: pexels[6] },
  xela: { lat: 14.8347, lng: -91.5181, department: "Quetzaltenango", image: pexels[7] },
  "guatemala-city": { lat: 14.6349, lng: -90.5069, department: "Guatemala", image: pexels[8] },
  paredon: { lat: 13.9173, lng: -91.0754, department: "Escuintla", image: pexels[9] },
  coban: { lat: 15.4708, lng: -90.3708, department: "Alta Verapaz", image: pexels[10] },
  huehue: { lat: 15.3199, lng: -91.4918, department: "Huehuetenango", image: pexels[11] },
  quirigua: { lat: 15.2706, lng: -89.0403, department: "Izabal", image: pexels[12] },
  pacaya: { lat: 14.3810, lng: -90.6013, department: "Escuintla", image: pexels[13] },
};

export const departments = [
  "Alta Verapaz","Baja Verapaz","Chimaltenango","Chiquimula","El Progreso","Escuintla","Guatemala",
  "Huehuetenango","Izabal","Jalapa","Jutiapa","Petén","Quetzaltenango","Quiché","Retalhuleu",
  "Sacatepéquez","San Marcos","Santa Rosa","Sololá","Suchitepéquez","Totonicapán","Zacapa",
];

export type TravelEvent = {
  id: string;
  name: string;
  town: string;
  department: string;
  month: number;
  day: number;
  duration: number;
  type: "Festival" | "Market" | "Culture" | "Holiday";
  status: "annual" | "verified";
  note: string;
};

type FairSeed = [string, string, number, number];
const fairs: Record<string, FairSeed[]> = {
  "Alta Verapaz": [
    ["Rabin Ajaw","Cobán",7,27],["San Pedro Apóstol","San Pedro Carchá",6,29],["San Juan Bautista","San Juan Chamelco",6,24],
    ["San Cristóbal Fair","San Cristóbal Verapaz",7,25],["Assumption Fair","Tactic",8,15],
  ],
  "Baja Verapaz": [
    ["Rabinal Patron Fair","Rabinal",1,25],["Santiago Fair","Cubulco",7,25],["Departmental Fair","Salamá",9,17],
    ["San Miguel Fair","San Miguel Chicaj",9,29],["San Jerónimo Fair","San Jerónimo",9,30],
  ],
  "Chimaltenango": [
    ["Acatenango Patron Fair","Acatenango",6,11],["Santiago Fair","Chimaltenango",7,25],["San Juan Fair","San Juan Comalapa",6,24],
    ["Patzún Patron Fair","Patzún",5,20],["San Francisco Fair","Tecpán Guatemala",10,4],
  ],
  "Chiquimula": [
    ["Festival of the Black Christ","Esquipulas",1,15],["Assumption Fair","Chiquimula",8,15],["Santiago Fair","Jocotán",7,25],
    ["Olopa Patron Fair","Olopa",3,15],["San Diego Fair","Quezaltepeque",11,12],
  ],
  "El Progreso": [
    ["Black Christ Fair","Guastatoya",1,15],["San Agustín Fair","San Agustín Acasaguastlán",8,28],["San Antonio Fair","San Antonio La Paz",6,13],
    ["Sanarate Fair","Sanarate",11,14],["Mercy Fair","Sansare",9,24],
  ],
  "Escuintla": [
    ["Immaculate Conception Fair","Escuintla",12,8],["Guanagazapa Fair","Guanagazapa",2,15],["San Rafael Fair","Puerto de Iztapa",10,24],
    ["San Cristóbal Fair","Palín",7,30],["San José Fair","Puerto de San José",3,19],
  ],
  "Guatemala": [
    ["Feria de la Asunción","Guatemala City",8,15],["Santo Domingo Fair","Mixco",8,4],["San Benito Fair","Palencia",4,27],
    ["San José Fair","San José Pinula",3,19],["San Juan Fair","San Juan Sacatepéquez",6,24],
  ],
  "Huehuetenango": [
    ["Aguacatán Fair","Aguacatán",5,2],["Holy Cross Fair","Santa Cruz Barillas",5,3],["Candelaria Fair","Chiantla",2,2],
    ["Departmental Fair","Huehuetenango",7,12],["All Saints Horse Race","Todos Santos Cuchumatán",11,1],
  ],
  "Izabal": [
    ["Puerto Barrios Fair","Puerto Barrios",5,19],["San José Fair","Morales",3,19],["Holy Cross Fair","Los Amates",5,3],
    ["Garifuna Day","Lívingston",11,26],["San Pedro Fair","El Estor",6,29],
  ],
  "Jalapa": [
    ["Jalapa Department Fair","Jalapa",9,15],["San Pedro Fair","San Pedro Pinula",6,29],["Santiago Fair","Mataquescuintla",7,25],
    ["Candelaria Fair","Monjas",2,2],["San Carlos Fair","San Carlos Alzatate",3,15],
  ],
  "Jutiapa": [
    ["Jutiapa Department Fair","Jutiapa",7,30],["Three Kings Fair","Agua Blanca",1,6],["Assumption Fair","Asunción Mita",8,15],
    ["Lourdes Fair","El Progreso",2,11],["Santo Tomás Fair","Jalpatagua",12,21],
  ],
  "Petén": [
    ["Flores Department Fair","Flores",1,15],["San Benito Fair","San Benito",4,3],["San Andrés Fair","San Andrés",11,30],
    ["San Francisco Fair","San Francisco",10,4],["Santa Ana Fair","Santa Ana",7,26],
  ],
  "Quetzaltenango": [
    ["Virgin of the Rosary Fair","Quetzaltenango",10,7],["San Luis Fair","Salcajá",8,25],["Candelaria Fair","San Juan Ostuncalco",2,2],
    ["San Mateo Fair","San Mateo",9,21],["Santa Catalina Fair","Zunil",11,25],
  ],
  "Quiché": [
    ["Santo Tomás Festival","Chichicastenango",12,21],["Holy Cross Fair","Santa Cruz del Quiché",5,3],["Assumption Fair","Nebaj",8,15],
    ["Three Kings Fair","Chajul",1,6],["San Miguel Fair","Uspantán",5,8],
  ],
  "Retalhuleu": [
    ["Immaculate Conception Fair","Retalhuleu",12,8],["Champerico Patron Fair","Champerico",8,6],["San Sebastián Fair","San Sebastián",1,20],
    ["San José Fair","El Asintal",3,19],["San Carlos Fair","Nuevo San Carlos",11,4],
  ],
  "Sacatepéquez": [
    ["Santiago Fair","Antigua Guatemala",7,25],["Feria de Jocotenango","Jocotenango",8,15],["Santiago Fair","Santiago Sacatepéquez",7,25],
    ["San Agustín Fair","Sumpango",8,28],["San Lucas Fair","San Lucas Sacatepéquez",10,18],
  ],
  "San Marcos": [
    ["San Marcos Evangelist Fair","San Marcos",4,25],["San Pedro Fair","San Pedro Sacatepéquez",6,29],["Conversion of Saint Paul","San Pablo",1,25],
    ["San Rafael Fair","San Rafael Pie de la Cuesta",10,24],["Santiago Fair","Tejutla",7,25],
  ],
  "Santa Rosa": [
    ["Christmas Fair","Cuilapa",12,25],["Three Kings Fair","Barberena",1,6],["Holy Cross Fair","Chiquimulilla",5,3],
    ["Black Christ Fair","Taxisco",1,15],["Santa Rosa Fair","Santa Rosa de Lima",8,30],
  ],
  "Sololá": [
    ["Assumption Fair","Sololá",8,15],["Santiago Apóstol Festival","Santiago Atitlán",7,25],["San Francisco Fair","Panajachel",10,4],
    ["San Pedro Fair","San Pedro La Laguna",6,29],["Santa Catalina Fair","Santa Catarina Palopó",11,25],
  ],
  "Suchitepéquez": [
    ["Mazatenango Carnival","Mazatenango",2,17],["Three Kings Fair","Cuyotenango",1,6],["San Antonio Fair","San Antonio Suchitepéquez",6,13],
    ["Ascension Fair","San Bernardino",5,20],["Santo Tomás Fair","Santo Tomás La Unión",12,21],
  ],
  "Totonicapán": [
    ["San Miguel Fair","Totonicapán",9,29],["San Cristóbal Fair","San Cristóbal Totonicapán",7,25],["San Francisco Fair","San Francisco El Alto",10,4],
    ["Santa Lucía Fair","Santa Lucía La Reforma",12,13],["Santiago Fair","Momostenango",7,25],
  ],
  "Zacapa": [
    ["Immaculate Conception Fair","Zacapa",12,8],["Santa Cecilia Fair","Estanzuela",11,22],["San Miguel Fair","Gualán",9,29],
    ["Río Hondo Fair","Río Hondo",2,28],["Candelaria Fair","Teculután",2,2],
  ],
};

const national: TravelEvent[] = [
  {id:"national-new-year",name:"New Year celebrations",town:"Nationwide",department:"Guatemala",month:1,day:1,duration:1,type:"Holiday",status:"annual",note:"Fireworks, family celebrations and reduced transport schedules."},
  {id:"filgua",name:"FILGUA International Book Fair",town:"Guatemala City",department:"Guatemala",month:7,day:7,duration:13,type:"Culture",status:"verified",note:"Books, authors, workshops and hundreds of cultural activities."},
  {id:"independence",name:"Independence Day",town:"Nationwide",department:"Guatemala",month:9,day:15,duration:2,type:"Holiday",status:"annual",note:"Parades, school bands and torch relays across the country."},
  {id:"revolution",name:"Revolution Day",town:"Guatemala City",department:"Guatemala",month:10,day:20,duration:1,type:"Holiday",status:"annual",note:"National holiday with civic and cultural programming."},
  {id:"kites-santiago",name:"Giant Kite Festival",town:"Santiago Sacatepéquez",department:"Sacatepéquez",month:11,day:1,duration:1,type:"Festival",status:"annual",note:"Monumental handmade kites honor ancestors on All Saints’ Day."},
  {id:"kites-sumpango",name:"Sumpango Giant Kite Festival",town:"Sumpango",department:"Sacatepéquez",month:11,day:1,duration:1,type:"Festival",status:"annual",note:"One of Guatemala’s most iconic annual cultural gatherings."},
  {id:"garifuna",name:"National Garifuna Day",town:"Lívingston",department:"Izabal",month:11,day:26,duration:2,type:"Culture",status:"annual",note:"Garifuna music, food, dance and community celebrations."},
  {id:"quema",name:"La Quema del Diablo",town:"Nationwide",department:"Guatemala",month:12,day:7,duration:1,type:"Festival",status:"annual",note:"Traditional pre-Christmas bonfires and neighborhood gatherings."},
  {id:"posadas",name:"Las Posadas",town:"Nationwide",department:"Guatemala",month:12,day:16,duration:9,type:"Culture",status:"annual",note:"Nightly processions, music and food in communities nationwide."},
  {id:"christmas",name:"Christmas Eve & Christmas",town:"Nationwide",department:"Guatemala",month:12,day:24,duration:2,type:"Holiday",status:"annual",note:"Major family holiday; reserve transport and meals in advance."},
  {id:"market-chichi-thu",name:"Chichicastenango Thursday Market",town:"Chichicastenango",department:"Quiché",month:1,day:1,duration:365,type:"Market",status:"annual",note:"Recurring Thursday market; the planner matches the exact weekdays in your trip."},
  {id:"market-chichi-sun",name:"Chichicastenango Sunday Market",town:"Chichicastenango",department:"Quiché",month:1,day:1,duration:365,type:"Market",status:"annual",note:"Recurring Sunday market; arrive early and photograph respectfully."},
];

export const events: TravelEvent[] = [
  ...Object.entries(fairs).flatMap(([department, rows]) =>
    rows.map(([name,town,month,day], index) => ({
      id: `${department}-${town}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g,"-"),
      name,town,department,month,day,duration: name.includes("Rabin") ? 4 : 3,
      type: "Festival" as const,status: "annual" as const,
      note: "Annual municipal celebration. Dates and programs should be reconfirmed locally before travel.",
    }))
  ),
  ...national,
];

export const eventDate = (event: TravelEvent, year: number) =>
  new Date(year, event.month - 1, event.day);

export const seasonFor = (month: number) => {
  if ([11,12,1,2,3,4].includes(month)) return {name:"Dry season",tone:"Clearer hiking weather, busier signature destinations.",score:["Adventure","History"]};
  if ([7,8].includes(month)) return {name:"Canícula window",tone:"A possible mid-rainy-season lull, but conditions still vary.",score:["Culture","City"]};
  return {name:"Green season",tone:"Lush landscapes, afternoon rain and lighter crowds.",score:["Nature","Culture"]};
};

export const currencies = [
  ["USD","US dollar"],["EUR","Euro"],["GBP","British pound"],["CAD","Canadian dollar"],
  ["MXN","Mexican peso"],["BZD","Belize dollar"],["HNL","Honduran lempira"],["SVC","US dollar (El Salvador)"],
] as const;

export const photoCreditUrl = "https://www.pexels.com/search/guatemala/";
