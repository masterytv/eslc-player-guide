import type { Guide, SectionKey } from "./schema";

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

// The coaches' own words: Justin Warner's offensive principles and Ashley O’Brien's defensive
// principles, both from 12 Oct 2026, laid out like their slides: a card per slide, its labelled
// boxes, and its bottom line.
const offence = `## Offensive philosophy — less is more
A simple identity, repeated with purpose.

Our offence is built around pace, spacing, East/West ball movement, clock awareness, and playing simple lacrosse.

**Move the ball. Move your feet. Stay wide. Create space. Make the defence move.**

### Our approach
Few concepts, understood extremely well.

### Our advantage
Make defenders shift, communicate and decide.

### Our standard
Trust the next pass, the cutter and each other.

>> Less is more.

## Fast break / transition
Attack when the opportunity is there — never force it.

### Clear opportunity
GO! Attack the advantage.

### No clear opportunity
Get the ball LOW and organize.

**On a turnover, no more than TWO players transition on the fast break.**

If there is no clear scoring opportunity, get the ball into the low corner, allow everyone to get organized, and flow directly into settled offence.

>> Don’t turn a good possession into a bad possession.

## Settled offence & spacing
Everything starts LOW.

**Pass down → pick → move East/West**

### Move the defence
Avoid unnecessary North/South play. Move the defence before trying to beat it.

### Start wide
On every set, start AS WIDE AS POSSIBLE. Gradually get tighter as the possession develops.

### Keep the middle open
Outside of 5-on-4, never simply stand in the middle. Make it available for cutters, slips, dodges, picks and crease opportunities.

>> Create space before attacking space.

## Clock awareness
The clock can be our friend.

### Ideal shooting window
**15–7 seconds.** Make the defence work before we shoot.

### At ~10 seconds
Top players begin fading back and preparing for possession / transition.

### Stay patient
Outside a clear fast break, we don’t need to rush shots.

**A defence that has defended for 20+ seconds is easier to break down than one that has defended for five.**

>> Know the clock. Make the defence work.

## Base offence — “Magic”
Our base offence is a 3–2.

### Personnel option A
3 lefties / 2 righties

### Personnel option B
3 righties / 2 lefties

### 3-man side: 1, 2, 3
Swing ball • Fill spots • Pass, cut, clear, replace

### 2-man side: 4, 5
Picks • Slips • Seals • Off-ball movement

>> Nobody watches their pass.

## Wheel motion
A favourite action out of Magic.

1. **Pass.** Ball carrier passes to the weak side.
2. **Cut.** After passing, immediately drive / cut through.
3. **Fill.** Next player fills the cutter’s original spot.
4. **Find.** Look immediately for the player filling that space.

The defence must decide whether to follow the cutter, switch, or protect the middle. We attack that moment of hesitation.

>> Pass → cut → fill → find

## Sweep action
Attack top side at full speed from the shooting spots.

1. **Sweep hard.** Be confident attacking top side at full speed.
2. **Draw the slide.** The goal is to force a defensive slide — not always to score yourself.
3. **Move the ball.** Dish to the opposite side as the defence rotates.

**While the defence rotates, send a cutter through the middle.**

### If they don’t slide
Keep going & shoot.

### If they slide
Move the ball.

>> Sweep → draw slide → dish → cutter

## Man-up offence
Three primary options.

### 01 — Drag & dump
Ball carrier attacks and drags the defender. As the defender commits, dish into the shooting spot.
First read: **step-down shot**
Second read: **crease**

### 02 — Boro
1. Top passes and immediately cuts.
2. Receiver passes down.
3. Pass down → pick down.
4. Carry and swing to opposite side.
5. Pass down again; find the ORIGINAL player arriving on crease.

The goal: force one defender to make a decision, then attack the space they leave. Ball movement creates the opportunity.

>> Create the decision. Attack the space.

## Man-up — old school
Free roam.

**If you hear “GO PLAY!” or “PLAY CATCH!” — I’m giving you freedom.**

### Read
Read the defence and attack a matchup.

### Move
Move, pick, cut and play a 2-man game.

### Trust
Trust your lacrosse IQ and make something happen.

>> Play with freedom. Make a read. Trust yourself.

## Our offensive identity
We don’t need 25 different plays. We need a few concepts understood extremely well.

- Fast break when it’s there.
- Get low when it’s not.
- Start wide.
- Move East/West.
- Pass down & pick.
- Pass → cut → fill.
- Sweep hard & force a slide.
- Use the clock.
- Don’t clog the middle.
- Less is more.

**Move the defence. Trust the next pass. Trust the cutter. Trust each other.**

Excited to get to work.
— Coach Warner`;

const defence = `## Identity
Gold Rip • Man-to-man • Areas of pressure • Disciplined help

### 01 — How we defend
We will utilize areas of pressure to make strong decisions. We communicate early, stay organized and connected.

### 02 — Gold Rip
Man-to-man settled defence with areas of pressure supported by disciplined help.

### 03 — Transition
Early touch, “toes to where she is going,” pressure wide, protect the middle.

>> Strong decisions • Communication • Anticipation

## Transition defence
Early pressure & recovery.

1. **Early touch.** Make an early touch by the 20-yard line and push the ball wide — “toes to where she’s going.”
2. **Funnel & trap.** Pressure the ball carrier toward the sideline and through X. Be ready to trap / double.
3. **Drop into help.** Off-ball defenders drop into help posture while tracking matchups.
4. **Backside communicates.** Backside is the primary communicator; be ready to send pressure via push slide.

>> Protect the middle first; build pressure as teammates recover.

## Transition defence / clear
Pressure levels & clear.

### Level 1 — Manage
If the ball is moving fast: light pressure, manage the fast break and funnel outside.

### Level 2 — Pressure
If they are running the box and have an opportunity: high pressure on the ball carrier, funneled into a double-trap.

### Clear — first option
Prioritize the quick clear. The field player who gave up the shot breaks out immediately for the clear.

### Clear — second option
Allow for box change over.

>> Manage the fast break. Recognize when to apply pressure.

## Gold Rip / transition
Forcing angles: house pattern.

### 01 — Shade the house
Shade the top of the house. Protect the middle — Guard the Yard.

### 02 — Send wide
Direct offensive players toward the alley off the elbow.

### 03 — Low drives
Direct low drives toward X and be ready to send a double / help slide on rolls.

### 04 — Move on the pass
Move while the ball is in the air, anticipate and commit to strong contact.

>> Dictate: set the angle before applying pressure.

## Gold Rip: communication
Be specific: NAME → COMMAND.

- **Help left / help right:** adjacents
- **Got your second:** two away
- **Swing:** ball moves through X
- **Skip:** ball moves on diagonal or two away from current ball carrier
- **Crash:** shot is imminent — slide to middle
- **Send it / hammer:** double in area of pressure

>> Backside is responsible for organizing the next action.

## Gold Rip: on-ball fundamentals
1. **Dictate the driver.** Establish body position first. See hips and rely on footwork.
2. **Be physical.** Bounce the offensive player and redirect down forcing lines or into the pressure zone.
3. **Contact on the pass.** Approach / move while the ball is in the air. Make strong contact, pin elbow — no hands-free shots.
4. **Be ready to double.** Be ready to set the double if near the elbow region.

>> Get strong initial contact — establish positioning.

## Gold Rip: off-ball help & slide
1. **Scout & pressure.** Know scout looks and areas of pressure. In Gold Rip, be prepared to send early slides / doubles in the elbow region.
2. **Adjacent.** Hedge and be ready to help the ball or send pressure. Keep sticks big in passing lanes.
3. **Second slide.** Pinch toward the ball, get in tight and be ready to dead-end the ball.
4. **Check in.** As the ball travels, bump cutters and protect goal-side space.

>> Help with discipline. Recover with purpose.

## Gold Rip: cutters & recovery
### 01 — Ball-side
Always be ball-side based on the feed threat; sticks in passing lanes.

### 02 — Frontside
On-ball and adjacent: pressure and manage immediate threats.

### 03 — Backside
Two-away and goalie: communicate, check in and cover the next threat.

### 04 — Recover
Recover into shape after help or a cut. BUMP CUTTERS.

>> Sticks up in passing lanes during recovery and check-ins.

## Gold Rip: slide calls, picks & doubles
1. **Areas of pressure.** When settled in Gold Rip, our areas of pressure are in the elbow region of the field.
2. **Adjacent double.** Adjacent defender is ready to send the double from the top if the on-ball defender is in the pressure area.
3. **If the double breaks down.** Sliding defender stays; defender who received the help slide recovers through the backside or bumps short.
4. **On picks.** Call direction early; switch only when defenders are even.
5. **On rolls.** Get goalie side and pin elbow.

>> Communicate early. Commit to the plan. Recover together.`;

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
    weatherPlace: "",
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
    { id: "s3", date: "2026-11-02", time: "14:30", type: "game", title: "", opponent: "Finland", opponentCode: "FIN", round: "Match 005", field: "Field 2", warmup: "14:00", notes: "" },
    { id: "s4", date: "2026-11-02", time: "", type: "meeting", title: "Team meeting", opponent: "", opponentCode: "", round: "", field: "", warmup: "", notes: "Time will be posted here and in the group chat." },
    { id: "s5", date: "2026-11-03", time: "12:30", type: "game", title: "", opponent: "Italy", opponentCode: "ITA", round: "Match 012", field: "Field 2", warmup: "12:00", notes: "" },
    { id: "s6", date: "2026-11-03", time: "", type: "meeting", title: "Team meeting", opponent: "", opponentCode: "", round: "", field: "", warmup: "", notes: "Time will be posted here and in the group chat." },
    { id: "s7", date: "2026-11-03", time: "15:30", type: "game", title: "", opponent: "Sweden", opponentCode: "SWE", round: "Match 016", field: "Field 1", warmup: "15:00", notes: "New time: this game was moved up from 17:00." },
    { id: "s8", date: "2026-11-04", time: "", type: "practice", title: "Practice", opponent: "", opponentCode: "", round: "", field: "", warmup: "", notes: "No game today." },
    { id: "s9", date: "2026-11-05", time: "12:30", type: "game", title: "", opponent: "Switzerland", opponentCode: "SUI", round: "Match 028", field: "Field 2", warmup: "12:00", notes: "" },
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
  roster: [
    { id: "pl1", number: "17", firstName: "Aisling", lastName: "Boyd", position: "" },
    { id: "pl2", number: "40", firstName: "Haley", lastName: "Crosson", position: "" },
    { id: "pl3", number: "28", firstName: "Catherine", lastName: "DeKorte", position: "" },
    { id: "pl4", number: "50", firstName: "Amelie", lastName: "Devine", position: "" },
    { id: "pl5", number: "1", firstName: "Aine", lastName: "Devine", position: "" },
    { id: "pl6", number: "7", firstName: "Maggie", lastName: "Egan", position: "" },
    { id: "pl7", number: "26", firstName: "Amelia", lastName: "Heisler", position: "" },
    { id: "pl8", number: "2", firstName: "Orla", lastName: "Howlett", position: "" },
    { id: "pl9", number: "14", firstName: "Amy", lastName: "Bolton", position: "" },
    { id: "pl10", number: "34", firstName: "Mimi", lastName: "Painting", position: "" },
    { id: "pl11", number: "30", firstName: "Niamh", lastName: "Pfaff", position: "" },
    { id: "pl12", number: "8", firstName: "Gillian", lastName: "Smith", position: "" },
    { id: "pl13", number: "", firstName: "Gabby", lastName: "Rosenzweig", position: "Player liaison" },
  ],
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
    notes: ["Spectators are welcome. Tickets are sold at the venue only (see Tickets below).", "Streaming info: coming soon."],
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
      text: "Medications (including painkillers) must be reviewed with Amanda. Pack them in your CARRY-ON bag.",
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
  playbook: [
    { id: "gp1", title: "Offence", slug: "offence", coach: "Justin Warner, Offensive Coordinator", summary: "Less is more", body: offence },
    { id: "gp2", title: "Defence", slug: "defence", coach: "Ashley O’Brien, Defensive Coordinator", summary: "Strong decisions • Communication • Anticipation", body: defence },
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
  nearby: [
    { id: "nb1", category: "groceries", name: "Mercadona", town: "Cambrils", walk: "7 min", hours: "Closed Sun and Mon", rating: "", note: "" },
    { id: "nb2", category: "groceries", name: "Plusfresc", town: "Cambrils", walk: "7 min", hours: "", rating: "", note: "" },
    { id: "nb3", category: "groceries", name: "Mi Alcampo", town: "Cambrils", walk: "9 min", hours: "Daily 8am–11pm", rating: "", note: "" },
    { id: "nb4", category: "groceries", name: "Michelangelo VII", town: "Cambrils", walk: "11 min", hours: "Daily 8:30am–11pm", rating: "", note: "" },
    { id: "nb5", category: "groceries", name: "Supermarket Max", town: "Cambrils", walk: "14 min", hours: "", rating: "", note: "" },
    { id: "nb6", category: "coffee", name: "O'Clock Brunch", town: "Cambrils", walk: "12 min", hours: "Closed Wed", rating: "4.8", note: "" },
    { id: "nb7", category: "coffee", name: "Forn Sant Salvador", town: "Cambrils", walk: "16 min", hours: "", rating: "", note: "" },
    { id: "nb8", category: "coffee", name: "La Granja de Vilafortuny", town: "Cambrils", walk: "16 min", hours: "", rating: "", note: "" },
    { id: "nb9", category: "coffee", name: "Coffee Break Salou", town: "Salou", walk: "32 min", hours: "", rating: "4.7", note: "" },
    { id: "nb10", category: "coffee", name: "jacaranda.coffee", town: "Cambrils", walk: "About 1 hr", hours: "Closed Tue", rating: "4.5", note: "" },
    { id: "nb11", category: "restaurants", name: "Tulsi", town: "Cambrils", walk: "11 min", hours: "", rating: "5.0", note: "Indian" },
    { id: "nb12", category: "restaurants", name: "Liam's Gastrobar", town: "Cambrils", walk: "10 min", hours: "Closed Wed", rating: "", note: "" },
    { id: "nb13", category: "restaurants", name: "Les Barques", town: "Cambrils", walk: "11 min", hours: "", rating: "3.9", note: "" },
    { id: "nb14", category: "restaurants", name: "Brisas de Mar", town: "Cambrils", walk: "25 min", hours: "", rating: "4.6", note: "" },
    { id: "nb15", category: "things", name: "Platja de Vilafortuny", town: "Cambrils", walk: "9 min", hours: "", rating: "", note: "Beach" },
    { id: "nb16", category: "things", name: "Passeig Jaume I", town: "Salou", walk: "41 min", hours: "", rating: "", note: "Seafront promenade in Salou" },
    { id: "nb17", category: "things", name: "Reserva Marina del Cavet", town: "Cambrils", walk: "48 min", hours: "", rating: "", note: "" },
    { id: "nb18", category: "things", name: "Jumpland and Saltapark", town: "Cambrils", walk: "50–60 min", hours: "", rating: "", note: "Trampoline and activity parks. Taxi advised." },
    { id: "nb19", category: "pharmacy", name: "Farmàcia Vilafortuny", town: "Cambrils", walk: "25 min", hours: "Daily 9am–10pm", rating: "", note: "" },
  ],
  tickets: {
    heading: "Tickets for family and friends",
    intro:
      "Tickets are sold only at the venue. You can't buy them online or ahead of time, so buy yours at the entrance when you arrive. Cash and card are both accepted.",
    prices: [
      "€8: One-day ticket. Gets you in for one day of games.",
      "€50: Whole women's tournament. Gets you in every day from 2 to 9 November.",
    ],
    tip: "Coming on 7 or more days? The €50 tournament ticket is cheaper than buying day tickets.",
  },
  nearbyInfo: {
    notes: [
      "Walking times are estimates, not routed. Check Google Maps.",
      "Opening hours can change. Check before you go.",
      "Sunday 1 Nov is a public holiday in Spain, so many shops may be closed.",
      "The seafront path toward Salou is narrow and shared with bikes.",
    ],
  },
};

/**
 * Sections whose starting content was rewritten after the guide went live, and when. On the first
 * tournament, a copy saved before then gives way to the new starting content; anything saved after
 * it shows as usual. The coaches replaced the game plan with new principles on 12 Oct 2026, and the
 * ELF's revised master schedule (new match numbers, warm-ups, Sweden moved to 15:30) came on 18 Oct 2026.
 */
export const SEED_REWRITTEN: Partial<Record<SectionKey, string>> = {
  playbook: "2026-10-12T13:00:00.000Z",
  schedule: "2026-10-18T17:30:00.000Z",
};

/** Whether a first-tournament section saved at `updatedAt` predates its rewritten starting content. */
export function olderThanSeed(key: SectionKey, updatedAt: string): boolean {
  const rewritten = SEED_REWRITTEN[key];
  return !!rewritten && Date.parse(updatedAt) < Date.parse(rewritten);
}
