"use client";
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Destination, destinations, faqs, phrases, sources } from "./travel-data";
import {
  currencies,
  departments,
  destinationMeta,
  eventDate,
  events,
  photoCreditUrl,
  seasonFor,
  TravelEvent,
} from "./companion-data";

type View = "explore" | "plan" | "events" | "guide";
type DetailTab = "story" | "do" | "eat" | "stay" | "transport";
type GuideSection = "language" | "faq";
type Geometry = { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
type MapFeature = { properties: Record<string, string>; geometry: Geometry };
type WeatherPulse = Record<string, { temperature: number; code: number }>;
type ChatMessage = { role: "user" | "assistant"; text: string };

const maps = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${query} Guatemala`)}`;

const tabs: { id: View; label: string; icon: string }[] = [
  { id: "explore", label: "Discover", icon: "⌖" },
  { id: "plan", label: "Plan", icon: "⌁" },
  { id: "events", label: "Events", icon: "◇" },
  { id: "guide", label: "Guide", icon: "A" },
];

const fallbackRates: Record<string, number> = {
  USD: 0.128, EUR: 0.118, GBP: 0.101, CAD: 0.174, MXN: 2.18, BZD: 0.256, HNL: 3.17, SVC: 1.12,
};

const mapEndpoint =
  "https://rmgir.proyectomesoamerica.org/server/rest/services/RMGIR/Guatemala_Datos_B%C3%A1sicos_WGS1984/MapServer/12/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson";

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

const kmBetween = (a: Destination, b: Destination) => {
  const one = destinationMeta[a.id];
  const two = destinationMeta[b.id];
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(two.lat - one.lat);
  const dLng = toRad(two.lng - one.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(one.lat)) * Math.cos(toRad(two.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const routeDistance = (places: Destination[]) =>
  places.slice(1).reduce((sum, place, index) => sum + kmBetween(places[index], place), 0);

const optimizeRoute = (ids: string[]) => {
  const places = ids.map(id => destinations.find(d => d.id === id)).filter(Boolean) as Destination[];
  if (places.length < 3) return ids;
  const remaining = places.slice(1);
  const ordered = [places[0]];
  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    let best = 0;
    remaining.forEach((candidate, index) => {
      if (kmBetween(last, candidate) < kmBetween(last, remaining[best])) best = index;
    });
    ordered.push(remaining.splice(best, 1)[0]);
  }
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < ordered.length - 2; i++) {
      for (let j = i + 1; j < ordered.length - 1; j++) {
        const candidate = [...ordered.slice(0, i), ...ordered.slice(i, j + 1).reverse(), ...ordered.slice(j + 1)];
        if (routeDistance(candidate) + 0.1 < routeDistance(ordered)) {
          ordered.splice(0, ordered.length, ...candidate);
          improved = true;
        }
      }
    }
  }
  return ordered.map(place => place.id);
};

const annualOccurrences = (event: TravelEvent, start: Date, end: Date) => {
  if (event.id.includes("market-chichi")) {
    const weekday = event.id.endsWith("thu") ? 4 : 0;
    const cursor = new Date(start);
    while (cursor.getDay() !== weekday && cursor <= end) cursor.setDate(cursor.getDate() + 1);
    return cursor <= end;
  }
  for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
    const date = eventDate(event, year);
    const last = new Date(date);
    last.setDate(last.getDate() + Math.max(0, event.duration - 1));
    if (date <= end && last >= start) return true;
  }
  return false;
};

const weatherLabel = (code: number) => {
  if (code <= 1) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Misty";
  if (code <= 67) return "Rain";
  if (code <= 82) return "Showers";
  return "Storm risk";
};

const projectPoint = ([lng, lat]: number[]) => [
  ((lng + 92.3) / 4.25) * 500,
  ((18.55 - lat) / 4.9) * 560,
];

const geometryPath = (geometry: Geometry) => {
  const polygons = geometry.type === "Polygon"
    ? [geometry.coordinates as number[][][]]
    : geometry.coordinates as number[][][][];
  return polygons
    .flatMap(polygon => polygon.map(ring =>
      ring.map((point, index) => {
        const [x, y] = projectPoint(point);
        return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ") + " Z"
    ))
    .join(" ");
};

function GuatemalaMap({ routePlaces }: { routePlaces: Destination[] }) {
  const [features, setFeatures] = useState<MapFeature[]>([]);
  const [failed, setFailed] = useState(false);
  const active = new Set(routePlaces.map(place => normalize(destinationMeta[place.id].department)));

  useEffect(() => {
    const controller = new AbortController();
    fetch(mapEndpoint, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("Map unavailable");
        return response.json();
      })
      .then(data => setFeatures((data.features || []) as MapFeature[]))
      .catch(error => {
        if (error.name !== "AbortError") setFailed(true);
      });
    return () => controller.abort();
  }, []);

  const line = routePlaces
    .map(place => projectPoint([destinationMeta[place.id].lng, destinationMeta[place.id].lat]).join(","))
    .join(" ");

  return <div className={`route-map ${failed ? "fallback" : ""}`}>
    <div className="map-head"><div><p className="atlas-kicker">LIVE ROUTE MAP</p><h3>Across Guatemala</h3></div><span>{routePlaces.length} stops · {active.size} departments</span></div>
    <svg viewBox="0 0 500 560" role="img" aria-label="Map of Guatemala departments and selected route">
      <defs><filter id="map-shadow"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity=".18"/></filter></defs>
      <g className="department-shapes" filter="url(#map-shadow)">
        {features.map((feature, index) => {
          const name = Object.values(feature.properties).find(value => typeof value === "string" && departments.some(d => normalize(d) === normalize(value))) || "";
          return <path key={`${name}-${index}`} d={geometryPath(feature.geometry)} className={active.has(normalize(name)) ? "selected" : ""}><title>{name}</title></path>;
        })}
      </g>
      {line && <polyline className="route-line-map" points={line}/>}
      {routePlaces.map((place, index) => {
        const [x, y] = projectPoint([destinationMeta[place.id].lng, destinationMeta[place.id].lat]);
        return <g className="map-stop" key={place.id} transform={`translate(${x} ${y})`}>
          <circle r="12"/><text y="3">{index + 1}</text><title>{place.name}</title>
        </g>;
      })}
    </svg>
    {!features.length && <div className="map-loading">{failed ? "Department outlines unavailable — route points are still positioned geographically." : "Loading department boundaries…"}</div>}
    <div className="department-key">{departments.map(department =>
      <span key={department} className={active.has(normalize(department)) ? "on" : ""}>{department}</span>
    )}</div>
  </div>;
}

export default function Home() {
  const [view, setView] = useState<View>("explore");
  const [selected, setSelected] = useState<Destination | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("story");
  const [guideSection, setGuideSection] = useState<GuideSection>("language");
  const [saved, setSaved] = useState<string[]>([]);
  const [route, setRoute] = useState<string[]>(["antigua", "atitlan", "peten"]);
  const [activities, setActivities] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [days, setDays] = useState(12);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [phraseGroup, setPhraseGroup] = useState("Basics");
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [toast, setToast] = useState("");
  const [eventMonth, setEventMonth] = useState(0);
  const [eventDepartment, setEventDepartment] = useState("All");
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [weather, setWeather] = useState<WeatherPulse>({});
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [currencyAmount, setCurrencyAmount] = useState("100");
  const [currencyDirection, setCurrencyDirection] = useState<"toGTQ" | "fromGTQ">("toGTQ");
  const [rates, setRates] = useState(fallbackRates);
  const [ratesLive, setRatesLive] = useState(false);
  const [ratesTime, setRatesTime] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMode, setChatMode] = useState("curated");
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "assistant", text: "Ask me about routes, transport, events, food or the best time to go." },
  ]);

  useEffect(() => {
    try {
      // Restore the travel workspace only after the browser storage is available.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(JSON.parse(localStorage.getItem("quetzal-saved-v3") || "[]"));
      setRoute(JSON.parse(localStorage.getItem("quetzal-route-v3") || "[\"antigua\",\"atitlan\",\"peten\"]"));
      setActivities(JSON.parse(localStorage.getItem("quetzal-activities-v3") || "[]"));
      setStartDate(localStorage.getItem("quetzal-start-v3") || "");
      setEndDate(localStorage.getItem("quetzal-end-v3") || "");
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem("quetzal-saved-v3", JSON.stringify(saved)); }, [saved]);
  useEffect(() => { localStorage.setItem("quetzal-route-v3", JSON.stringify(route)); }, [route]);
  useEffect(() => { localStorage.setItem("quetzal-activities-v3", JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem("quetzal-start-v3", startDate); }, [startDate]);
  useEffect(() => { localStorage.setItem("quetzal-end-v3", endDate); }, [endDate]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!selected) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/GTQ")
      .then(response => response.json())
      .then(data => {
        if (data.result === "success" && data.rates) {
          setRates(data.rates);
          setRatesLive(true);
          setRatesTime(data.time_last_update_utc || "");
        }
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => destinations.filter(d => {
    const text = `${d.name} ${d.region} ${d.category} ${d.bestFor.join(" ")} ${d.activities.map(a => a.name).join(" ")}`.toLowerCase();
    return (category === "All" || category === "Saved" || d.category === category) && (!query || text.includes(query.toLowerCase()));
  }), [query, category]);
  const exploreItems = category === "Saved" ? filtered.filter(d => saved.includes(d.id)) : filtered;
  const routePlaces = route.map(id => destinations.find(d => d.id === id)).filter(Boolean) as Destination[];
  const estimatedDays = routePlaces.reduce((sum, d) => sum + (d.days.includes("Half") ? 0.5 : parseInt(d.days) || 2), 0);
  const validDates = Boolean(startDate && endDate && new Date(`${endDate}T12:00:00`) >= new Date(`${startDate}T12:00:00`));
  const tripEvents = useMemo(() => {
    if (!validDates) return [];
    const start = new Date(`${startDate}T12:00:00`);
    const end = new Date(`${endDate}T12:00:00`);
    return events.filter(event => annualOccurrences(event, start, end));
  }, [startDate, endDate, validDates]);
  const season = seasonFor(startDate ? new Date(`${startDate}T12:00:00`).getMonth() + 1 : 1);
  const eventResults = events.filter(event =>
    (!eventMonth || event.month === eventMonth || event.duration === 365) &&
    (eventDepartment === "All" || event.department === eventDepartment)
  );

  const routeKey = route.join("|");
  useEffect(() => {
    const places = routeKey.split("|").map(id => destinations.find(destination => destination.id === id)).filter(Boolean) as Destination[];
    if (!places.length) return;
    const controller = new AbortController();
    Promise.all(places.slice(0, 5).map(async place => {
      const meta = destinationMeta[place.id];
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${meta.lat}&longitude=${meta.lng}&current=temperature_2m,weather_code&timezone=auto`, { signal: controller.signal });
      const data = await response.json();
      return [place.id, { temperature: Math.round(data.current.temperature_2m), code: data.current.weather_code }] as const;
    })).then(rows => setWeather(Object.fromEntries(rows))).catch(() => {});
    return () => controller.abort();
  }, [routeKey]);

  const open = (destination: Destination, tab: DetailTab = "story") => {
    setSelected(destination);
    setDetailTab(tab);
  };
  const close = () => {
    setSelected(null);
  };
  const toggleRoute = (id: string) => {
    setRoute(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    setToast(route.includes(id) ? "Removed from route" : "Added to your route");
  };
  const toggleSaved = (id: string) => {
    setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    setToast(saved.includes(id) ? "Removed from saved" : "Saved for later");
  };
  const addActivity = (destination: Destination, name: string) => {
    const id = `${destination.id}:${name}`;
    setActivities(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    setToast(activities.includes(id) ? "Activity removed" : "Activity added to route");
  };
  const optimize = () => {
    const next = optimizeRoute(route);
    setRoute(next);
    setToast(next.join() === route.join() ? "Your route is already efficient" : "Route order optimized");
  };
  const buildSuggestedRoute = () => {
    const eventStops = tripEvents.map(event =>
      destinations.find(destination => normalize(destinationMeta[destination.id].department) === normalize(event.department))?.id
    ).filter(Boolean) as string[];
    const seasonal = destinations.filter(destination => season.score.includes(destination.category)).slice(0, 3).map(destination => destination.id);
    const combined = [...new Set([...route, ...eventStops, ...seasonal])].slice(0, Math.max(3, Math.min(7, days / 2)));
    setRoute(optimizeRoute(combined));
    setToast("Smart route built around your dates");
  };
  const addEventStop = (event: TravelEvent) => {
    const match = destinations.find(destination => normalize(destinationMeta[destination.id].department) === normalize(event.department));
    if (!match) {
      setToast("Save this event — a nearby base is coming soon");
      return;
    }
    if (!route.includes(match.id)) setRoute(current => [...current, match.id]);
    setToast(`${match.name} added for ${event.name}`);
  };
  const setTripStart = (value: string) => {
    setStartDate(value);
    if (value && (!endDate || endDate < value)) {
      const next = new Date(`${value}T12:00:00`);
      next.setDate(next.getDate() + days - 1);
      setEndDate(next.toISOString().slice(0, 10));
    }
  };
  const setTripEnd = (value: string) => {
    setEndDate(value);
    if (startDate && value >= startDate) {
      setDays(Math.round((new Date(`${value}T12:00:00`).getTime() - new Date(`${startDate}T12:00:00`).getTime()) / 86400000) + 1);
    }
  };
  const converted = (() => {
    const amount = Number(currencyAmount) || 0;
    const rate = rates[currency] || fallbackRates[currency];
    return currencyDirection === "toGTQ" ? amount / rate : amount * rate;
  })();
  const sendChat = async (event?: FormEvent) => {
    event?.preventDefault();
    const message = chatInput.trim();
    if (!message || chatLoading) return;
    setChat(current => [...current, { role: "user", text: message }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, route: routePlaces.map(place => place.name), dates: validDates ? `${startDate} to ${endDate}` : "" }),
      });
      const data = await response.json();
      setChatMode(data.mode || "curated");
      setChat(current => [...current, { role: "assistant", text: data.answer || "I couldn’t answer that just now." }]);
    } catch {
      setChat(current => [...current, { role: "assistant", text: "I’m offline for a moment. Your saved route and guides still work." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return <main className="atlas-app">
    <header className="atlas-nav">
      <button className="atlas-brand" onClick={() => setView("explore")}><span>Q</span><div>quetzal<small>GUATEMALA COMPANION</small></div></button>
      <nav>{tabs.map(tab => <button key={tab.id} className={view === tab.id ? "active" : ""} onClick={() => setView(tab.id)}><i>{tab.icon}</i>{tab.label}{tab.id === "plan" && <b>{route.length}</b>}</button>)}</nav>
      <div className="nav-tools">
        <button className="currency-trigger" onClick={() => setCurrencyOpen(true)}>Q ⇄ $</button>
        <button className="route-cta" onClick={() => setView("plan")}>Open trip <span>↗</span></button>
      </div>
    </header>

    {view === "explore" && <>
      <section className="atlas-hero">
        <img src={destinationMeta.atitlan.image} alt="" className="hero-photo"/>
        <div className="hero-scrim"/>
        <div className="atlas-hero-copy"><p className="atlas-kicker">YOUR GUATEMALA, BEAUTIFULLY PLANNED</p><h1>Go beyond<br/><em>the postcard.</em></h1><p>Curated places, intelligent routes and practical help from the highlands to the Caribbean.</p>
          <div className="atlas-search"><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search places, ruins, food, hikes…" aria-label="Search destinations"/><kbd>{destinations.length} guides</kbd></div>
          <div className="hero-actions"><button onClick={() => setView("plan")}>Plan my trip <span>→</span></button><button onClick={() => setChatOpen(true)}>Ask Quetzal</button></div>
          <div className="hero-metrics"><span><b>{destinations.length}</b> travel bases</span><span><b>{destinations.reduce((count, destination) => count + destination.activities.length, 0)}+</b> curated stops</span><span><b>{events.length}</b> annual events</span></div>
        </div>
        <div className="route-preview">
          <div className="route-preview-head"><span>YOUR ROUTE</span><b>{route.length} STOPS</b></div>
          {routePlaces.slice(0, 4).map((place, index) => <button key={place.id} onClick={() => open(place)}><i>0{index + 1}</i><img src={destinationMeta[place.id].image} alt=""/><div><b>{place.name}</b><small>{place.region} · {place.days}</small></div><span>↗</span></button>)}
          <button className="preview-plan" onClick={() => setView("plan")}>Shape this trip <span>→</span></button>
        </div>
      </section>

      <section className="quick-tools">
        <button onClick={() => setView("plan")}><i>01</i><div><b>Build a route</b><span>Map + smart ordering</span></div><em>→</em></button>
        <button onClick={() => setView("events")}><i>02</i><div><b>Travel by date</b><span>{events.length} cultural moments</span></div><em>→</em></button>
        <button onClick={() => { setView("guide"); setGuideSection("language"); }}><i>03</i><div><b>Speak with ease</b><span>Pocket Spanish</span></div><em>→</em></button>
      </section>

      <section className="atlas-explore">
        <aside className="explore-rail"><p>EXPLORE BY MOOD</p>{["All", "Culture", "Nature", "Adventure", "History", "City", "Coast", "Offbeat"].map(item => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}><span>{item}</span><b>{item === "All" ? destinations.length : destinations.filter(destination => destination.category === item).length}</b></button>)}<hr/><button className={category === "Saved" ? "active" : ""} onClick={() => setCategory("Saved")}><span>♡ Saved</span><b>{saved.length}</b></button></aside>
        <div className="explore-main">
          <div className="explore-title"><div><p className="atlas-kicker">{category === "All" ? "THE FIELD GUIDE" : category.toUpperCase()}</p><h2>{category === "Saved" ? "Places you saved." : "Choose your next chapter."}</h2></div><span>{exploreItems.length} places</span></div>
          <div className="atlas-grid">{exploreItems.map((destination, index) => <article className="atlas-card" key={destination.id}>
            <button className={`atlas-save ${saved.includes(destination.id) ? "on" : ""}`} onClick={() => toggleSaved(destination.id)} aria-label={`${saved.includes(destination.id) ? "Unsave" : "Save"} ${destination.name}`}>{saved.includes(destination.id) ? "♥" : "♡"}</button>
            <button className="card-visual" onClick={() => open(destination)}><img src={destinationMeta[destination.id].image} alt={`${destination.name}, Guatemala`}/><span className="card-index">{String(index + 1).padStart(2, "0")}</span><span className="coordinates">{destinationMeta[destination.id].department}</span><p>{destination.mood}</p></button>
            <div className="atlas-card-body"><small>{destination.region} · {destination.category}</small><h3><button onClick={() => open(destination)}>{destination.name}</button></h3><p>{destination.intro}</p><div className="best-for">{destination.bestFor.slice(0, 3).map(item => <span key={item}>{item}</span>)}</div><div className="card-facts"><span>◷ {destination.days}</span><span>⌁ {destination.altitude}</span><span>{"$".repeat(destination.budget)}</span></div><div className="card-footer"><button className={route.includes(destination.id) ? "added" : ""} onClick={() => toggleRoute(destination.id)}>{route.includes(destination.id) ? "✓ In route" : "+ Add to route"}</button><button onClick={() => open(destination)}>Open guide ↗</button></div></div>
          </article>)}</div>
          {!exploreItems.length && <div className="atlas-empty"><span>♡</span><h3>Your map is still wide open.</h3><p>Save places as you explore and they’ll gather here.</p><button onClick={() => setCategory("All")}>Explore all places</button></div>}
        </div>
      </section>
    </>}

    {view === "plan" && <section className="planner-page">
      <div className="planner-top"><div><p className="atlas-kicker">INTELLIGENT TRIP BUILDER</p><h1>Make every day<br/><em>feel effortless.</em></h1></div>
        <div className="date-controls"><label>ARRIVE<input type="date" value={startDate} onChange={event => setTripStart(event.target.value)}/></label><span>→</span><label>LEAVE<input type="date" min={startDate} value={endDate} onChange={event => setTripEnd(event.target.value)}/></label></div>
      </div>
      <div className="planner-dashboard">
        <div className="planner-main">
          <GuatemalaMap routePlaces={routePlaces}/>
          <div className="route-board">
            <div className="board-head"><div><p className="atlas-kicker">YOUR JOURNEY</p><h2>{route.length} stops, one clear route</h2></div><div><span className={estimatedDays > days ? "over" : ""}>{estimatedDays} suggested / {days} days</span><button onClick={optimize} disabled={route.length < 3}>Optimize order</button></div></div>
            {routePlaces.map((destination, index) => <article className="route-stop" key={destination.id}><div className="route-line"><i>{index + 1}</i>{index < routePlaces.length - 1 && <span/>}</div><img className="stop-art" src={destinationMeta[destination.id].image} alt=""/><div className="stop-info"><small>STOP {String(index + 1).padStart(2, "0")} · {destinationMeta[destination.id].department}</small><h3>{destination.name}</h3><p>{destination.days} suggested · {destination.mood}</p>{weather[destination.id] && <span className="weather-chip">{weather[destination.id].temperature}° · {weatherLabel(weather[destination.id].code)} now</span>}<div>{activities.filter(item => item.startsWith(`${destination.id}:`)).map(item => <span key={item}>{item.split(":")[1]} <button onClick={() => addActivity(destination, item.split(":")[1])}>×</button></span>)}</div><button onClick={() => open(destination, "do")}>Choose activities →</button></div><button className="remove-stop" onClick={() => toggleRoute(destination.id)}>×</button></article>)}
            {!route.length && <div className="atlas-empty"><h3>No route yet.</h3><button onClick={() => setView("explore")}>Find your first stop</button></div>}
            <button className="add-stop" onClick={() => setView("explore")}>＋ Add another destination</button>
          </div>
        </div>
        <aside className="smart-panel">
          <p className="atlas-kicker">TRIP PULSE</p><h2>{validDates ? season.name : "Add your dates"}</h2><p>{validDates ? season.tone : "Unlock event matches, season guidance and a suggested route."}</p>
          {validDates && <><div className="pulse-row"><span>Days</span><b>{days}</b></div><div className="pulse-row"><span>Events on your dates</span><b>{tripEvents.length}</b></div><div className="pulse-row"><span>Route distance</span><b>~{Math.round(routeDistance(routePlaces))} km</b></div></>}
          <button className="smart-build" disabled={!validDates} onClick={buildSuggestedRoute}>✦ Build around my dates</button>
          {tripEvents.slice(0, 3).map(event => <button className="event-mini" key={event.id} onClick={() => { setView("events"); setEventDepartment(event.department); }}><time>{event.month}/{event.day}</time><span><b>{event.name}</b><small>{event.town}</small></span><em>↗</em></button>)}
          <a href={maps(routePlaces.map(destination => destination.name).join(" to "))} target="_blank" rel="noreferrer">Open route in Google Maps ↗</a>
          <small>Optimization reduces straight-line distance. Confirm real road conditions and journey times locally.</small>
        </aside>
      </div>
    </section>}

    {view === "events" && <section className="events-page">
      <div className="page-lede events-lede"><div><p className="atlas-kicker">TRAVEL WITH THE CALENDAR</p><h1>Be there when<br/><em>Guatemala gathers.</em></h1><p>Patron fairs, markets and cultural traditions across all 22 departments. Annual dates are a planning signal—always reconfirm the current program.</p></div>
        <div className="event-date-box"><label>MY TRIP<input type="date" value={startDate} onChange={event => setTripStart(event.target.value)}/></label><span>to</span><label><input aria-label="Trip end date" type="date" min={startDate} value={endDate} onChange={event => setTripEnd(event.target.value)}/></label>{validDates && <b>{tripEvents.length} matches</b>}</div>
      </div>
      <div className="event-filters">
        <select aria-label="Filter events by month" value={eventMonth} onChange={event => setEventMonth(Number(event.target.value))}><option value={0}>Any month</option>{Array.from({ length: 12 }, (_, index) => <option value={index + 1} key={index}>{new Date(2026, index, 1).toLocaleString("en", { month: "long" })}</option>)}</select>
        <select aria-label="Filter events by department" value={eventDepartment} onChange={event => setEventDepartment(event.target.value)}><option>All</option>{departments.map(department => <option key={department}>{department}</option>)}</select>
        <span>{eventResults.length} dates</span>
      </div>
      {validDates && tripEvents.length > 0 && <section className="trip-match-strip"><div><p className="atlas-kicker">ON YOUR DATES</p><h2>{tripEvents.length} moments worth routing around</h2></div><div>{tripEvents.slice(0, 5).map(event => <button key={event.id} onClick={() => addEventStop(event)}><time>{event.month}/{event.day}</time><span>{event.name}<small>{event.town}</small></span><b>＋</b></button>)}</div></section>}
      <div className="events-grid">{eventResults.slice(0, showAllEvents ? eventResults.length : 18).map(event => <article className={validDates && tripEvents.some(match => match.id === event.id) ? "matched" : ""} key={event.id}>
        <div className="event-date"><b>{new Date(2026, event.month - 1, event.day).toLocaleString("en", { month: "short" })}</b><span>{event.day}</span></div>
        <div className="event-info"><small>{event.type} · {event.department}</small><h3>{event.name}</h3><p>{event.town}</p><span className={event.status}>{event.status === "verified" ? "Listed edition" : "Annual · reconfirm"}</span></div>
        <button onClick={() => addEventStop(event)}>＋ route</button>
      </article>)}</div>
      {eventResults.length > 18 && <button className="show-events" onClick={() => setShowAllEvents(current => !current)}>{showAllEvents ? "Show fewer" : `Show all ${eventResults.length} events`}</button>}
      <p className="events-source">Festival dates are planning references drawn from Guatemala’s tourism fair directory and cultural calendars. Local programs can shift.</p>
    </section>}

    {view === "guide" && <section className="guide-page">
      <div className="guide-switch"><button className={guideSection === "language" ? "active" : ""} onClick={() => setGuideSection("language")}>Pocket Spanish</button><button className={guideSection === "faq" ? "active" : ""} onClick={() => setGuideSection("faq")}>Travel essentials</button></div>
      {guideSection === "language" && <><div className="page-lede"><p className="atlas-kicker">POCKET SPANISH</p><h1>A little language<br/><em>goes a long way.</em></h1><p>Tap a phrase to hear it. Guatemala is multilingual; Spanish helps widely, while learning local greetings shows care.</p></div><div className="phrase-layout"><aside>{phrases.map(group => <button key={group[0]} className={phraseGroup === group[0] ? "active" : ""} onClick={() => setPhraseGroup(group[0])}>{group[0]} <span>→</span></button>)}</aside><div className="phrase-list">{phrases.find(group => group[0] === phraseGroup)?.[1].map((phrase, index) => <button key={phrase[0]} onClick={() => { if ("speechSynthesis" in window) { speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(phrase[0]); utterance.lang = "es-GT"; speechSynthesis.speak(utterance); } setToast("Playing phrase"); }}><i>{String(index + 1).padStart(2, "0")}</i><div><b>{phrase[0]}</b><small>{phrase[1]}</small></div><span>◖))</span></button>)}</div></div><div className="language-note"><b>Travel respectfully</b><p>Guatemala recognizes 22 Maya languages alongside Spanish, Xinka and Garifuna. Ask before photographing people, ceremonies or sacred spaces.</p></div></>}
      {guideSection === "faq" && <><div className="page-lede"><p className="atlas-kicker">BEFORE YOU GO</p><h1>The practical<br/><em>Guatemala briefing.</em></h1><p>Clear answers for safer, smoother planning. Recheck official guidance close to departure.</p></div><div className="faq-layout"><div className="faq-list">{faqs.map((faq, index) => <article key={faq.q} className={faqOpen === index ? "open" : ""}><button onClick={() => setFaqOpen(faqOpen === index ? null : index)}><span>{String(index + 1).padStart(2, "0")}</span><b>{faq.q}</b><i>{faqOpen === index ? "−" : "+"}</i></button>{faqOpen === index && <p>{faq.a}</p>}</article>)}</div><aside className="source-card"><p className="atlas-kicker">LIVE CHECKS</p><h2>Verify before departure.</h2><p>Entry rules, health advice, volcano access and security conditions change.</p>{sources.map(source => <a key={source[0]} href={source[1]} target="_blank" rel="noreferrer">{source[0]} <span>↗</span></a>)}<div><b>Emergency numbers</b><p>Police 110 / 120<br/>Fire 122 / 123<br/>CONRED 119<br/>Tourist assistance 1500</p></div></aside></div></>}
    </section>}

    {selected && <div className="guide-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}><aside className="destination-guide" role="dialog" aria-modal="true" aria-label={`${selected.name} guide`}>
      <button className="guide-close" onClick={close} aria-label="Close destination guide">×</button><header className="guide-hero"><img src={destinationMeta[selected.id].image} alt={`${selected.name}, Guatemala`}/><div/><p>{destinationMeta[selected.id].department} / {selected.category}</p><h2>{selected.name}</h2><span>{selected.mood}</span><a href={photoCreditUrl} target="_blank" rel="noreferrer">Photo via Pexels ↗</a></header>
      <nav className="guide-tabs">{([["story", "Story"], ["do", "Do & see"], ["eat", "Eat"], ["stay", "Stay"], ["transport", "Get there"]] as [DetailTab, string][]).map(tab => <button key={tab[0]} className={detailTab === tab[0] ? "active" : ""} onClick={() => setDetailTab(tab[0])}>{tab[1]}</button>)}</nav>
      <div className="guide-content">{detailTab === "story" && <div className="story-tab"><p className="big-intro">{selected.intro}</p><div className="guide-facts"><span><b>{selected.days}</b>Suggested time</span><span><b>{selected.altitude}</b>Altitude</span><span><b>{"$".repeat(selected.budget)}</b>Budget</span></div><h3>Why it matters</h3><p>{selected.history}</p><h3>The Quetzal take</h3><p className="tip-box">✦ {selected.tip}</p>{selected.caution && <p className="caution-box"><b>Check before you go</b>{selected.caution}</p>}</div>}
        {detailTab !== "story" && <div className="detail-list"><div className="detail-heading"><p className="atlas-kicker">{detailTab === "do" ? "CURATED, NOT CROWDED" : detailTab === "eat" ? "GOOD PLACES TO START" : detailTab === "stay" ? "SLEEP WITH A SENSE OF PLACE" : "THE PRACTICAL ROUTE"}</p><h3>{detailTab === "do" ? "What to do" : detailTab === "eat" ? "Where to eat" : detailTab === "stay" ? "Where to stay" : "How to get there"}</h3></div>{(detailTab === "do" ? selected.activities : detailTab === "eat" ? selected.eat : detailTab === "stay" ? selected.stay : selected.transport).map((item, index) => <article key={item.name}><i>{String(index + 1).padStart(2, "0")}</i><div><h4>{item.name}</h4><p>{item.note}</p>{item.tag && <span>{item.tag}</span>}</div><div className="detail-actions">{detailTab === "do" && <button className={activities.includes(`${selected.id}:${item.name}`) ? "on" : ""} onClick={() => addActivity(selected, item.name)}>{activities.includes(`${selected.id}:${item.name}`) ? "✓" : "+"}</button>}<a href={maps(item.map || item.name)} target="_blank" rel="noreferrer" aria-label={`Open ${item.name} in Google Maps`}>↗</a></div></article>)}<p className="verify-note">Curated starting points. Verify current hours, prices and availability before setting out.</p></div>}
      </div><footer className="guide-footer"><button className={route.includes(selected.id) ? "added" : ""} onClick={() => toggleRoute(selected.id)}>{route.includes(selected.id) ? "✓ In your route" : "+ Add destination to route"}</button><a href={maps(selected.name)} target="_blank" rel="noreferrer">View area in Maps ↗</a></footer>
    </aside></div>}

    {currencyOpen && <div className="tool-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setCurrencyOpen(false); }}><aside className="currency-panel" role="dialog" aria-modal="true" aria-label="Quetzal currency converter"><button className="tool-close" onClick={() => setCurrencyOpen(false)}>×</button><p className="atlas-kicker">QUETZAL CONVERTER</p><h2>Know what it costs.</h2><div className="rate-status"><i className={ratesLive ? "live" : ""}/>{ratesLive ? "Live reference rate" : "Offline reference rate"}</div>
      <div className="conversion-box"><label>{currencyDirection === "toGTQ" ? currency : "GTQ"}<input inputMode="decimal" value={currencyAmount} onChange={event => setCurrencyAmount(event.target.value)}/></label><button onClick={() => setCurrencyDirection(current => current === "toGTQ" ? "fromGTQ" : "toGTQ")}>⇅</button><div><span>{currencyDirection === "toGTQ" ? "GTQ" : currency}</span><b>{new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(converted)}</b></div></div>
      <select value={currency} onChange={event => setCurrency(event.target.value)}>{currencies.map(item => <option value={item[0]} key={item[0]}>{item[0]} · {item[1]}</option>)}</select><p>Rates are indicative and exclude card, bank or exchange-counter fees. Pay in quetzales when offered dynamic currency conversion.</p>{ratesTime && <small>Provider update: {ratesTime}</small>}</aside></div>}

    <button className={`chat-launcher ${chatOpen ? "open" : ""}`} onClick={() => setChatOpen(current => !current)} aria-label="Ask Quetzal travel assistant"><span>Q</span><b>{chatOpen ? "Close" : "Ask Quetzal"}</b></button>
    {chatOpen && <aside className="chat-panel" aria-label="Quetzal travel assistant"><header><div><i>Q</i><span><b>Quetzal</b><small>{chatMode === "ai" ? "AI travel companion" : "Curated travel companion"}</small></span></div><button onClick={() => setChatOpen(false)}>×</button></header><div className="chat-messages">{chat.map((message, index) => <p className={message.role} key={index}>{message.text}</p>)}{chatLoading && <p className="assistant typing">Thinking…</p>}</div><div className="chat-prompts">{["Plan 10 days", "Best in November", "Antigua to Atitlán"].map(prompt => <button key={prompt} onClick={() => setChatInput(prompt)}>{prompt}</button>)}</div><form onSubmit={sendChat}><input value={chatInput} onChange={event => setChatInput(event.target.value)} placeholder="Ask anything about Guatemala…"/><button aria-label="Send question">↑</button></form><small>Check official sources for live safety, health, weather and entry advice.</small></aside>}
    {toast && <div className="atlas-toast" role="status">✦ {toast}</div>}
  </main>;
}
