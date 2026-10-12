const PATHS = {
  today: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  schedule: <><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  team: <><circle cx="9" cy="9" r="3.2" /><path d="M3.5 19.5c.8-3.1 3-4.7 5.5-4.7s4.7 1.6 5.5 4.7" /><circle cx="17" cy="10" r="2.4" /><path d="M15.6 14.7c2.3-.4 4.1.9 4.9 3.5" /></>,
  venue: <><path d="M12 21s-6.5-5.8-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.2-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></>,
  more: <><circle cx="6" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="18" cy="12" r="1.6" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  chev: <path d="M9 5l7 7-7 7" />,
  ext: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  phone: <path d="M6.6 3.8h2.9l1.6 4.1-2 1.3a10.4 10.4 0 0 0 5.7 5.7l1.3-2 4.1 1.6v2.9a2 2 0 0 1-2.1 2A15.6 15.6 0 0 1 4.6 5.9a2 2 0 0 1 2-2.1z" />,
  chat: <path d="M4.5 19.5l1.2-3.6A7.7 7.7 0 1 1 8.6 18.6z" />,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" /></>,
  calplus: <><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M4 10h16M9 3v4M15 3v4M12 13v5M9.5 15.5h5" /></>,
  map: <><path d="M9 4.5L3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z" /><path d="M9 4.5v13M15 6.5v13" /></>,
  anthem: <><path d="M9 18V6.5l10-2V16" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
  lock: <><rect x="5" y="11" width="14" height="9.5" rx="2.2" /><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" /></>,
  bag: <><rect x="4" y="8" width="16" height="12" rx="2.5" /><path d="M9 8V6.2A2.2 2.2 0 0 1 11.2 4h1.6A2.2 2.2 0 0 1 15 6.2V8M4 13h16" /></>,
  shield: <><path d="M12 3.2l7 2.8v5.3c0 4.4-2.9 7.9-7 9.5-4.1-1.6-7-5.1-7-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>,
  board: <><rect x="5" y="4.5" width="14" height="16" rx="2.2" /><path d="M9.5 3h5v3h-5zM8.5 10l2.6 2.6M11.1 10l-2.6 2.6" /><circle cx="15" cy="16" r="1.6" /></>,
  book: <><path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H18v14H6.5A1.5 1.5 0 0 0 5 19.5z" /><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H18v-3" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  sheet: <><rect x="4" y="4" width="16" height="16" rx="2.2" /><path d="M4 9.5h16M4 14.8h16M10 4v16" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.2M12 7.8h.01" /></>,
  plane: <path d="M10.5 13.5L4 11l1.3-1.5 7.2.8 4.2-4.5a1.9 1.9 0 0 1 2.7 2.7l-4.5 4.2.8 7.2L14.5 21l-2.5-6.5" />,
  warn: <><path d="M12 4l9 16H3z" /><path d="M12 10v4.2M12 17h.01" /></>,
  walk: <><circle cx="13" cy="4.8" r="1.8" /><path d="M10.5 21l1.8-6-2.3-2.2.8-4 3.2 3 2.5.7M9.5 9l-2.4 1.6L6.5 14M12.3 15l2.7 2 .8 4" /></>,
  pencil: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  trash: <><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /></>,
  logout: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 16l-4-4 4-4M6 12h10" /></>,
  photo: <><rect x="3.5" y="5" width="17" height="14" rx="2.5" /><circle cx="9" cy="10" r="1.8" /><path d="M20.5 16l-5-5-8 8" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="M11 12l8-8M16 7l2 2M14 9l2 2" /></>,
  // Weather (see describeWeather in lib/weather-data.ts)
  "wx-sun": <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></>,
  "wx-moon": <path d="M19.5 14.6A7.6 7.6 0 0 1 9.4 4.5a7.6 7.6 0 1 0 10.1 10.1z" />,
  "wx-cloud": <path d="M7.5 18.5h9.5a3.75 3.75 0 0 0 .4-7.48A5.25 5.25 0 0 0 7.3 10a4.25 4.25 0 0 0 .2 8.5z" />,
  "wx-cloudsun": <><path d="M8.6 4.2v1.2M3.6 9.2h1.2M5.1 5.7l.9.9M12.1 5.7l-.9.9M5.3 12.4a3.6 3.6 0 1 1 6.3-3.6" /><path d="M9.5 19.5h8a3.2 3.2 0 0 0 .35-6.38A4.5 4.5 0 0 0 9.3 12.3a3.6 3.6 0 0 0 .2 7.2z" /></>,
  "wx-cloudmoon": <><path d="M11.6 8.4A4.4 4.4 0 0 1 6.1 3.4a4.4 4.4 0 0 0-1.4 7.8" /><path d="M9.5 19.5h8a3.2 3.2 0 0 0 .35-6.38A4.5 4.5 0 0 0 9.3 12.3a3.6 3.6 0 0 0 .2 7.2z" /></>,
  "wx-fog": <path d="M5 7.5h14M3.5 11h17M5 14.5h14M7.5 18h9" />,
  "wx-rain": <><path d="M7.5 15h9.5a3.75 3.75 0 0 0 .4-7.48A5.25 5.25 0 0 0 7.3 6.5a4.25 4.25 0 0 0 .2 8.5z" /><path d="M8.5 18l-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5" /></>,
  "wx-snow": <><path d="M7.5 15h9.5a3.75 3.75 0 0 0 .4-7.48A5.25 5.25 0 0 0 7.3 6.5a4.25 4.25 0 0 0 .2 8.5z" /><path d="M8.5 19h.01M12 20.5h.01M15.5 19h.01" /></>,
  "wx-storm": <><path d="M7.5 15h9.5a3.75 3.75 0 0 0 .4-7.48A5.25 5.25 0 0 0 7.3 6.5a4.25 4.25 0 0 0 .2 8.5z" /><path d="M12.6 15.5l-2 3.4h3l-2 3.4" /></>,
  drop: <path d="M12 3.5s-5.5 6.2-5.5 10.2a5.5 5.5 0 0 0 11 0C17.5 9.7 12 3.5 12 3.5z" />,
  wind: <path d="M3.5 9h11a2.75 2.75 0 1 0-2.75-2.75M3.5 13h15a2.75 2.75 0 1 1-2.75 2.75M3.5 17h7" />,
  radar: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><path d="M12 12l6-6" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size, className }: { name: IconName; size?: "sm"; className?: string }) {
  return (
    <svg className={["ic", size, className].filter(Boolean).join(" ")} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
