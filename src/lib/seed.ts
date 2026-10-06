import type { Guide } from "./schema";

// Starting content for the first tournament, taken from the ESLC 2026 player guide
// Google Doc. Admins replace any of it from the app; a section reads from here only
// until it is first saved. Later tournaments start from a copy of an earlier one.
// Staff phone numbers are deliberately not in source control: admins add them under
// Team → Staff.

const conduct = `## Be on time
Arrive 10 minutes before the actual meeting time.

## Personal time
The team will be together for the majority of the tournament. At designated times, players can "sign out" and leave the facility or accommodations for personal time.

## Check in & check out
We will create a group chat where you must post:
- The names of everyone in your group
- Departure time
- Estimated return time
- Confirmed time when you return
- Real-time updates if you arrive early or expect to return later than planned
- Where you will be at all times (WADA regulations). If your plans change, we just need to know.

## Team meetings
We will text the group chat with any new team meetings and put them in the daily notes.

## Lights out
Coach Melissa will communicate the specific nightly lights-out time.

## Apparel
Apparel and gear representing other countries or provinces is not permitted at any time. Club gear is fine during leisure time, but all travel to and from games must be in Ireland apparel only.

## Getting around
We have chartered buses for transportation to and from all games and we will be using the train system to attend practices. A staff van will be available to help with additional transportation when needed.

It is the intention of the staff to have the team travel as a group, to and from all team events, unless otherwise stated.

## Disciplinary policy
We hope this will not be required, but we will operate a fair process of review and escalation to the Ireland Lacrosse Director of Teams in relation to behaviours that are directly in conflict with our code of conduct and that of World Lacrosse.

Any great error of judgment or repeated action that brings Ireland Lacrosse into disrepute may result in the player being removed from the team and returned home at the earliest possible time, at a cost to the player.

!! You are a representative of the team and country at all times. Players must never smoke, drink alcohol, take illegal substances, engage in illegal activities, bully others, or publicly speak ill of other teams or staff.`;

const rules = `## Qualifier
This event is a qualifier for the 2027 World Sixes Lacrosse Championships, and the first stage of qualification for the Los Angeles 2028 Olympic Games.

## Passports
In accordance with Appendix 24.2 of the World Lacrosse Event Hosting & Competition Manual, all players must be valid passport holders of the country they represent for the duration of the tournament. No exemptions will be granted.

## Squad
- Squad size is limited to 12 athletes.
- Accredited staff (bench side) is limited to 4, including a dedicated medical officer or physio, as per the WL Event & Competition Manual.

## Playing rules
Please refer to the World Lacrosse 2026–2028 Sixes Official Playing Rules for more information.`;

const activities = `## Barcelona women's football game
Barcelona. Date and details to come.`;

const items = (category: string, prefix: string, list: Array<string | [string, true]>) =>
  list.map((entry, i) => {
    const [item, must] = Array.isArray(entry) ? entry : [entry, false];
    return { id: `${prefix}${i + 1}`, category, item, must };
  });

export const SEED: Guide = {
  event: {
    team: "Ireland Sixes Lacrosse",
    eventName: "ESLC 2026",
    guideTitle: "Player Guide",
    location: "Salou, Spain",
    startDate: "2026-10-31",
    endDate: "2026-11-09",
    timeZone: "Europe/Madrid",
    poolName: "Pool play B",
    scheduleUrl: "https://docs.google.com/spreadsheets/d/1w1AZLKIqm7Hn1UoOrIJrpYPv0AghAMeA/edit?usp=sharing",
    alert: "",
  },
  daily: [
    {
      id: "d1",
      date: "2026-10-31",
      time: "14:00",
      title: "Bus departs airport",
      details: "If you land after 14:00, please secure your own transportation.",
      linkLabel: "Ride options",
      linkUrl: "/venue#getting",
    },
    {
      id: "d2",
      date: "2026-10-31",
      time: "15:30",
      title: "Arrive at villas, check in, get settled",
      details: "",
      linkLabel: "",
      linkUrl: "",
    },
  ],
  schedule: [
    { id: "s1", date: "2026-11-01", time: "", type: "practice", title: "Practice", opponent: "", opponentCode: "", round: "", field: "TBD", warmup: "", notes: "" },
    { id: "s2", date: "2026-11-01", time: "", type: "ceremony", title: "Opening Ceremony", opponent: "", opponentCode: "", round: "", field: "", warmup: "", notes: "" },
    { id: "s3", date: "2026-11-02", time: "14:30", type: "game", title: "", opponent: "Finland", opponentCode: "FIN", round: "Match 006", field: "Field 2", warmup: "", notes: "" },
    { id: "s4", date: "2026-11-02", time: "", type: "meeting", title: "Team meeting", opponent: "", opponentCode: "", round: "", field: "", warmup: "", notes: "Time will be posted here and in the group chat." },
    { id: "s5", date: "2026-11-03", time: "12:30", type: "game", title: "", opponent: "Italy", opponentCode: "ITA", round: "Match 013", field: "Field 2", warmup: "", notes: "" },
    { id: "s6", date: "2026-11-03", time: "", type: "meeting", title: "Team meeting", opponent: "", opponentCode: "", round: "", field: "", warmup: "", notes: "Time will be posted here and in the group chat." },
    { id: "s7", date: "2026-11-03", time: "17:00", type: "game", title: "", opponent: "Sweden", opponentCode: "SWE", round: "Match 018", field: "Field 1", warmup: "", notes: "" },
    { id: "s8", date: "2026-11-04", time: "", type: "practice", title: "Practice", opponent: "", opponentCode: "", round: "", field: "", warmup: "", notes: "No game today." },
    { id: "s9", date: "2026-11-05", time: "12:30", type: "game", title: "", opponent: "Switzerland", opponentCode: "SUI", round: "Match 031", field: "Field 2", warmup: "", notes: "" },
  ],
  staff: [
    { id: "st1", name: "Maddy Morrissey Buss", role: "Head Coach", phone: "", whatsapp: true, email: "" },
    { id: "st2", name: "Ashley O’Brien", role: "Defensive Coordinator", phone: "", whatsapp: true, email: "" },
    { id: "st3", name: "Justin Warner", role: "Offensive Coordinator", phone: "", whatsapp: true, email: "" },
    { id: "st4", name: "Amanda Kusiak", role: "Athletic Trainer", phone: "", whatsapp: true, email: "" },
    { id: "st5", name: "Catherine Conway", role: "National Teams Director", phone: "", whatsapp: true, email: "" },
    { id: "st6", name: "Kathleen Finnegan", role: "Heritage Director", phone: "", whatsapp: true, email: "" },
    { id: "st7", name: "Liz Mosher", role: "Manager", phone: "", whatsapp: true, email: "" },
  ],
  roster: [],
  rooming: [],
  meals: [],
  travel: {
    busDate: "2026-10-31",
    busTime: "14:00",
    busHeadline: "Bus leaves the airport for the villas",
    busText:
      "Players who are not ready to board by then will need to arrange their own transportation. The airport is about 1 to 1.5 hours from our accommodation, and a taxi or private transfer can be costly. We recommend booking a flight that lands early enough to clear passport control and collect your bags well before 14:00.",
    flightTitle: "Add your flight details",
    flightText:
      "Once you have booked your flight, please use this Google sheet to input your information. All players must input their information.",
    flightFormUrl: "",
    flightResponsesUrl: "",
    ridesTitle: "If you miss the bus",
    ridesLinkLabel: "Salou taxis on Mapilife",
    ridesLinkUrl: "https://www.mapilife.com/en/listings/salou-taxis/",
  },
  rides: [
    {
      id: "r1",
      name: "Traditional taxis",
      summary: "Official Salou fleet, runs 24/7",
      details:
        "The official Salou taxi fleet (around 50 cars across 9 ranks), hailed on the street, called, or booked via a dedicated app. They run 24/7 year-round, take credit cards, and offer everything from standard rides to 6-seat group cars, wheelchair-accessible vehicles, airport transfers, and excursions.",
    },
    {
      id: "r2",
      name: "Cabify",
      summary: "Best bet for an app-based ride",
      details:
        "Available in the Salou area, with a budget “Lite” option and a premium “Executive” option (Mercedes/Audi, up to 4 people). This is generally your best bet for an app-based rideshare, since Uber pulled back from parts of Catalonia.",
    },
    {
      id: "r3",
      name: "Uber",
      summary: "Spotty and unreliable here",
      details:
        "Uber suspended ride-hailing in nearby Barcelona after Catalan regulations imposed a mandatory 15-minute pickup delay, following taxi driver protests, so don’t count on it being available or convenient around Salou. Check the app when you arrive.",
    },
    {
      id: "r4",
      name: "FREENOW-style apps",
      summary: "Hail a regular taxi by phone",
      details:
        "Apps that let you hail and pay for a traditional taxi through your phone, essentially a digital layer on top of the regular taxi fleet.",
    },
    {
      id: "r5",
      name: "Fixed-price transfers",
      summary: "Pre-book airport runs",
      details:
        "GetTransfer, Kiwitaxi, Airporttaxis and similar. Good for pre-booked airport runs (Reus or Barcelona) or day trips to Barcelona or Tarragona, since they lock in a price in advance rather than metering. Book in advance for a fixed price.",
    },
  ],
  accommodation: {
    name: "Cambrils Park Resort",
    address: "Avinguda d'Europa, 43850 Cambrils, Tarragona",
    dates: "31 Oct – 10 Nov",
    villaName: "Carib: Villa Bonita",
    villaDetails: "2 bedrooms · 1 bathroom",
    villaNote: "10 min walk to the fields",
    amenities: [
      "Air conditioning / heating",
      "Wi-Fi",
      "Parking",
      "Fridge / freezer",
      "Dishwasher",
      "Microwave",
      "Kettle",
      "Toaster",
      "Coffee maker",
      "Hairdryer",
      "2 sofas",
      "Plasma TV",
      "Dining table",
    ],
  },
  venue: {
    name: "Mediterranean Sports Hub",
    address: "Via de Cavet, s/n, 43840 Cambrils, Tarragona, Spain",
    walkNote:
      "We will walk to all practices and matches. The walk from our villas will take approximately 10–15 minutes. All players are expected to arrive at the designated meeting location on time.",
    amenities: [
      "Changing rooms & showers",
      "Grass and turf fields",
      "Ice baths after games",
      "Medical & physio support",
      "Water source",
      "Spa",
      "Gym",
    ],
    notes: ["Spectators will be allowed. Tickets will be sold online and at the venue.", "Streaming info: coming soon."],
  },
  maps: [
    { id: "m1", title: "Resort map", image: "/seed/resort-map.jpg", placement: "villas" },
    { id: "m2", title: "Villa layout", image: "/seed/villa-bonita.jpg", placement: "villas" },
    { id: "m3", title: "Villas to fields", image: "/seed/villas-to-fields.jpg", placement: "fields" },
    { id: "m4", title: "Field map", image: "/seed/field-map.jpg", placement: "fields" },
  ],
  packing: [
    ...items("Clothing", "pc", [
      "2–3 sports shorts (black or navy)",
      "3–4 sports tops",
      "Underwear",
      "Sports bras",
      "Lounging apparel",
      "Socks",
      "PJs",
      "Rain jacket",
    ]),
    ...items("Shoes", "ps", ["Turfs", "Box floor shoes (basketball/volleyball)", "Athletic trainers", "Sliders / flip flops"]),
    ...items("Equipment", "pe", [
      ["3 balls (all players must bring 3)", true],
      "Lacrosse stick",
      "Gum shield",
      ["Screwdriver (checked bag only)", true],
      "Helmet (team helmet received at camp)",
      "Gloves (team gloves received at camp)",
      "Wrist guards",
      "Elbow pads",
      "Bicep pads",
      "Shoulder / chest pads",
      "Rib guards",
      "Braces (wrist, ankle, etc.)",
      "Electrical tape (several rolls)",
      "Other tape",
      "Water bottle",
    ]),
    ...items("Miscellaneous", "pm", [
      "Sunglasses",
      "Plug converters (Type E)",
      "Entertainment (books, laptop, cards)",
      "Ireland apparel",
      "Preferred protein bars (brands not sold in Prague)",
      "A European SIM or eSIM",
      "Shower shoes",
      "Optional: towel for venue showers",
    ]),
    ...items("Toiletries", "pt", [
      "Toothbrush + toothpaste",
      "Shampoo + conditioner",
      "Hairbrush",
      "Body wash",
      "Suncream + aftersun",
      "Insect repellent",
      "Hair ties",
      "Headbands",
    ]),
  ],
  packingNotes: [
    { id: "pn1", category: "", level: "info", text: "Laundry service by staff will be only for uniforms." },
    {
      id: "pn2",
      category: "Equipment",
      level: "warning",
      text: "Pack the screwdriver in your CHECKED bag, not your carry-on. Many players carry on the head of their stick and pack the shaft.",
    },
    {
      id: "pn3",
      category: "Toiletries",
      level: "warning",
      text: "Medications (including painkillers) must be reviewed with Allyson. Pack them in your CARRY-ON bag.",
    },
  ],
  packingInfo: {
    suppliedTitle: "You’ll get these at training camp",
    supplied: [
      "2 game jerseys",
      "2 game shorts",
      "2 practice shorts",
      "1 zip-up",
      "1 jogger",
      "4 T-shirts",
      "1 quarter-zip track jacket",
      "1 snapback hat",
      "1 laundry loop",
      "1 backpack",
      "1 helmet",
      "1 pair of gloves",
    ],
  },
  pages: [
    { id: "pg1", title: "Tournament rules", slug: "rules", group: "before", summary: "Passports, squad size", body: rules },
    { id: "pg2", title: "Conduct & team rules", slug: "conduct", group: "team", summary: "Check in & out, lights out, apparel", body: conduct },
    { id: "pg3", title: "Team activities", slug: "activities", group: "team", summary: "Barcelona trip", body: activities },
  ],
  anthem: {
    title: "Amhrán na bhFiann",
    requirement: "All players are required to memorise the anthem",
    intro:
      "Ireland Lacrosse represents the entire island of Ireland, both the Republic and the North. While we represent all of Ireland, we sing the National Anthem of the Republic at international competitions. The anthem is sung fully as Gaeilge (in Irish).",
    videoUrl: "https://www.youtube.com/watch?v=N480eiKXr60",
    videoLabel: "Watch the senior team sing it",
    lines: [
      "Shin-a feen-a fall",
      "A-thaw fwee yall egg air-inn",
      "Bween dar sloo",
      "Har-tin duh raw-nig coon",
      "Fair vode veh sair",
      "Shan-tear ar shin-shur fasta",
      "Nee aug-fur fween teer-awn naw fween trawl",
      "An-ukt a haym sah varn-a vwayl",
      "Leh gyan ar gwayl kun baws no sail",
      "Leh gun-nah sh-crake",
      "Fwee lawvrock nah be-lair",
      "Shuh liv con-nig ow-rawn nah veen",
    ],
    credit: "Phonetic version prepared by Eimear Fitzpatrick, member of the Women’s National Team programme since 2019.",
  },
  links: [
    {
      id: "l1",
      label: "Full Pool B schedule",
      url: "https://docs.google.com/spreadsheets/d/1w1AZLKIqm7Hn1UoOrIJrpYPv0AghAMeA/edit?usp=sharing",
      note: "Google Sheet",
    },
    { id: "l2", label: "Player bio form", url: "https://irelandlacrosse.ie", note: "irelandlacrosse.ie" },
    { id: "l3", label: "Salou taxis", url: "https://www.mapilife.com/en/listings/salou-taxis/", note: "Mapilife" },
    { id: "l4", label: "About the anthem", url: "https://en.wikipedia.org/wiki/Amhr%C3%A1n_na_bhFiann", note: "Wikipedia" },
  ],
};
