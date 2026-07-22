"use client";

import { useEffect, useMemo, useState } from "react";

type Place = {
  id: string;
  name: string;
  region: string;
  type: string;
  vibe: string;
  days: string;
  altitude: string;
  cost: number;
  color: string;
  icon: string;
  description: string;
  highlights: string[];
  mapQuery: string;
};

const places: Place[] = [
  { id: "antigua", name: "Antigua", region: "Sacatepéquez", type: "Culture", vibe: "Cobblestone mornings", days: "2–3 days", altitude: "1,545 m", cost: 2, color: "sunset", icon: "✦", description: "Volcano views, courtyard cafés and centuries of stories in a city made for wandering.", highlights: ["Cerro de la Cruz", "Market morning", "Rooftop sunset"], mapQuery: "best restaurants and things to do in Antigua Guatemala" },
  { id: "atitlan", name: "Lake Atitlán", region: "Sololá", type: "Nature", vibe: "Slow lake days", days: "3–4 days", altitude: "1,562 m", cost: 2, color: "lake", icon: "≈", description: "A volcanic lake ringed by Maya towns, creative communities and quiet coves.", highlights: ["Sunrise paddle", "Village boat loop", "Indian Nose hike"], mapQuery: "best restaurants and activities Lake Atitlan Guatemala" },
  { id: "tikal", name: "Tikal & Flores", region: "Petén", type: "History", vibe: "Jungle awakening", days: "2–3 days", altitude: "128 m", cost: 3, color: "jungle", icon: "▲", description: "Ancient temples rise above the canopy while howler monkeys soundtrack the dawn.", highlights: ["Tikal sunrise", "Flores island walk", "Yaxhá sunset"], mapQuery: "best restaurants and activities Flores Peten Guatemala" },
  { id: "semuc", name: "Semuc Champey", region: "Alta Verapaz", type: "Adventure", vibe: "Wild-water reset", days: "2 days", altitude: "350 m", cost: 2, color: "aqua", icon: "~", description: "Turquoise limestone pools, cloud forest trails and a beautifully remote journey.", highlights: ["El Mirador", "Pool cascade", "K'an Ba caves"], mapQuery: "best restaurants and activities Semuc Champey Lanquin" },
  { id: "acatenango", name: "Acatenango", region: "Chimaltenango", type: "Adventure", vibe: "Above the clouds", days: "2 days", altitude: "3,976 m", cost: 3, color: "volcano", icon: "△", description: "A demanding overnight climb with front-row views of Fuego's glowing eruptions.", highlights: ["Basecamp sunset", "Fuego views", "Summit sunrise"], mapQuery: "Acatenango hike tour operators Guatemala" },
  { id: "rio-dulce", name: "Río Dulce", region: "Izabal", type: "Nature", vibe: "Caribbean current", days: "2–3 days", altitude: "Sea level", cost: 2, color: "caribbean", icon: "⌁", description: "River canyons, hot springs and Garifuna flavors on the route to the Caribbean.", highlights: ["Boat to Lívingston", "Finca Paraíso", "Castillo San Felipe"], mapQuery: "best restaurants and activities Rio Dulce Livingston Guatemala" },
];

const routes = [
  { title: "The Guatemala First-Timer", days: "10 days", pace: "Balanced", stops: "Antigua → Atitlán → Flores → Tikal", note: "The classics, without rushing", color: "route-blue" },
  { title: "Volcanoes & Verapaces", days: "8 days", pace: "Active", stops: "Antigua → Acatenango → Cobán → Semuc", note: "Big climbs, cool pools", color: "route-green" },
  { title: "Slow Road to the Caribbean", days: "12 days", pace: "Unhurried", stops: "Atitlán → Quetzaltenango → Río Dulce → Lívingston", note: "Markets, mountains, sea", color: "route-sand" },
];

const money = (cost: number) => "$".repeat(cost);
const mapsUrl = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export default function Home() {
  const [saved, setSaved] = useState<string[]>([]);
  const [plan, setPlan] = useState<string[]>(["antigua", "atitlan"]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showPlanner, setShowPlanner] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      setSaved(JSON.parse(localStorage.getItem("quetzal-saved") || "[]"));
      setPlan(JSON.parse(localStorage.getItem("quetzal-plan") || "[\"antigua\",\"atitlan\"]"));
    } catch { /* device storage can be unavailable */ }
  }, []);

  useEffect(() => { localStorage.setItem("quetzal-saved", JSON.stringify(saved)); }, [saved]);
  useEffect(() => { localStorage.setItem("quetzal-plan", JSON.stringify(plan)); }, [plan]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2400);
    return () => clearTimeout(timer);
  }, [notice]);

  const filtered = useMemo(() => places.filter((place) => {
    const matchesFilter = filter === "All" || place.type === filter;
    const q = search.toLowerCase();
    return matchesFilter && (!q || `${place.name} ${place.region} ${place.vibe} ${place.highlights.join(" ")}`.toLowerCase().includes(q));
  }), [filter, search]);
  const planPace = plan.length
    ? Math.round(plan.reduce((sum, id) => sum + (places.find((place) => place.id === id)?.cost || 1), 0) / plan.length)
    : 1;

  const toggleSave = (id: string) => {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setNotice(saved.includes(id) ? "Removed from your Guate Bag" : "Saved to your Guate Bag");
  };

  const togglePlan = (id: string) => {
    setPlan((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setNotice(plan.includes(id) ? "Removed from route" : "Added to your route");
  };

  const jump = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };

  return (
    <main>
      <header className="nav-wrap">
        <nav className="nav shell" aria-label="Main navigation">
          <button className="brand" onClick={() => jump("top")} aria-label="Quetzal home">
            <span className="brand-mark">Q</span><span>quetzal</span><small>GUATEMALA</small>
          </button>
          <div className={`nav-links ${menuOpen ? "open" : ""}`}>
            <button onClick={() => jump("discover")}>Discover</button>
            <button onClick={() => jump("routes")}>Routes</button>
            <button onClick={() => jump("field-notes")}>Field notes</button>
          </div>
          <div className="nav-actions">
            <button className="bag" onClick={() => { setFilter("All"); jump("discover"); }} aria-label={`${saved.length} saved places`}>♡ <span>Guate Bag</span><b>{saved.length}</b></button>
            <button className="plan-button" onClick={() => setShowPlanner(true)}>Build my trip <span>↗</span></button>
            <button className="menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? "×" : "☰"}</button>
          </div>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span>✦</span> The country of eternal spring</p>
            <h1>Find your way<br/><em>through wonder.</em></h1>
            <p className="hero-lede">A smarter field guide to Guatemala—curated places, flexible routes and the tiny details that make a good trip unforgettable.</p>
            <div className="search-box">
              <span>⌕</span>
              <label className="sr-only" htmlFor="hero-search">Search Guatemala</label>
              <input id="hero-search" value={search} onChange={(e) => setSearch(e.target.value)} onFocus={() => jump("discover")} placeholder="Where are you curious about?" />
              <button onClick={() => jump("discover")}>Explore</button>
            </div>
            <div className="quick-tags"><span>Try:</span>{["Lake Atitlán", "Jungle", "Volcano"].map(q => <button key={q} onClick={() => { setSearch(q); jump("discover"); }}>{q}</button>)}</div>
          </div>
          <div className="hero-compass" aria-hidden="true">
            <div className="map-blob blob-a"/><div className="map-blob blob-b"/><div className="map-blob blob-c"/>
            <div className="compass-ring"><i>N</i><strong>✦</strong><span>GUATEMALA<br/><b>15.7835° N</b></span></div>
            <div className="float-card float-weather"><span>☀</span><b>24°C</b><small>Antigua · now</small></div>
            <div className="float-card float-season"><span>☂</span><b>Green season</b><small>Pack a light shell</small></div>
            <div className="place-pin pin-one">1</div><div className="place-pin pin-two">2</div><div className="place-pin pin-three">3</div>
          </div>
        </div>
        <div className="hero-foot shell"><span>SCROLL TO ROAM</span><div/><p><b>22</b> departments · <b>37</b> volcanoes · one remarkable journey</p></div>
      </section>

      <section className="discover section shell" id="discover">
        <div className="section-head">
          <div><p className="kicker">PLACES WORTH THE DETOUR</p><h2>Pick a feeling,<br/>find a place.</h2></div>
          <p>From cloud-forest mornings to late-night tostadas, every stop has its own rhythm. Start with the one that feels like you.</p>
        </div>
        <div className="filter-row" role="group" aria-label="Filter destinations">
          {["All", "Culture", "Nature", "Adventure", "History"].map(item => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
          <label className="inline-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search places" aria-label="Search places"/></label>
        </div>
        <div className="place-grid">
          {filtered.map((place, index) => (
            <article className={`place-card ${place.color}`} key={place.id}>
              <div className="card-art"><span className="art-number">0{index + 1}</span><i>{place.icon}</i><p>{place.vibe}</p><button className={saved.includes(place.id) ? "save saved" : "save"} onClick={() => toggleSave(place.id)} aria-label={`${saved.includes(place.id) ? "Unsave" : "Save"} ${place.name}`}>{saved.includes(place.id) ? "♥" : "♡"}</button></div>
              <div className="card-body">
                <div className="card-title"><div><small>{place.region} · {place.type}</small><h3>{place.name}</h3></div><span>{money(place.cost)}</span></div>
                <p>{place.description}</p>
                <div className="chips">{place.highlights.map(h => <span key={h}>{h}</span>)}</div>
                <div className="card-meta"><span>◷ {place.days}</span><span>⌁ {place.altitude}</span></div>
                <div className="card-actions">
                  <button onClick={() => togglePlan(place.id)}>{plan.includes(place.id) ? "✓ In your route" : "+ Add to route"}</button>
                  <a href={mapsUrl(place.mapQuery)} target="_blank" rel="noreferrer">Open in Maps ↗</a>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!filtered.length && <div className="empty"><b>No trails found.</b><p>Try another place or feeling.</p><button onClick={() => { setSearch(""); setFilter("All"); }}>Clear search</button></div>}
      </section>

      <section className="routes section" id="routes">
        <div className="shell">
          <div className="section-head route-head"><div><p className="kicker">ROUTES WITH ROOM TO BREATHE</p><h2>Borrow a route.<br/>Make it yours.</h2></div><button className="text-link" onClick={() => setShowPlanner(true)}>Open trip builder ↗</button></div>
          <div className="route-list">
            {routes.map((route, i) => <article className={`route-card ${route.color}`} key={route.title}>
              <div className="route-index">0{i+1}</div><div><small>{route.days} · {route.pace}</small><h3>{route.title}</h3><p>{route.stops}</p></div><span>{route.note}</span><button onClick={() => { setShowPlanner(true); setNotice("Route ready to customize"); }} aria-label={`Customize ${route.title}`}>↗</button>
            </article>)}
          </div>
        </div>
      </section>

      <section className="field section shell" id="field-notes">
        <div className="field-intro"><p className="kicker">GOOD TO KNOW BEFORE YOU GO</p><h2>Your pocket<br/>field guide.</h2><p>Small, practical signals for smoother days—built for quick checks on the road.</p></div>
        <div className="field-grid">
          <article className="field-card rain"><span>☂</span><small>SEASON SENSE</small><h3>Afternoon rain is a feature, not a flaw.</h3><p>In green season, plan outdoor adventures before lunch and keep café or museum time for later.</p></article>
          <article className="field-card money"><span>Q</span><small>MONEY QUICK-CHECK</small><h3>Q 100 ≈ $13</h3><p>Cards work in cities; cash matters at markets, docks and rural trailheads.</p><div className="meter"><i/><i/><i/><i/></div></article>
          <article className="field-card words"><span>BA</span><small>WORDS THAT OPEN DOORS</small><h3>Buen día</h3><p>Good morning</p><hr/><h3>Matyox</h3><p>Thank you · Kaqchikel</p></article>
          <article className="field-card safe"><span>+</span><small>TRAVEL CARD</small><h3>Keep the essentials offline.</h3><p>Emergency: <b>110 / 120</b><br/>Tourist assistance: <b>1500</b></p><button onClick={() => setNotice("Travel card saved for this device")}>Save travel card ↓</button></article>
        </div>
      </section>

      <section className="cta">
        <div className="shell cta-inner"><div><p className="eyebrow"><span>✦</span> Your trip starts with a hunch</p><h2>Let’s turn it into<br/><em>a route.</em></h2></div><div><p>Save the places that pull you in. We’ll help you shape the days between them.</p><button onClick={() => setShowPlanner(true)}>Build my Guatemala trip <span>↗</span></button></div></div>
      </section>

      <footer className="footer shell"><div className="brand footer-brand"><span className="brand-mark">Q</span><span>quetzal</span></div><p>Made for curious travelers.<br/>Move slowly. Travel kindly.</p><div><a href="#discover">Places</a><a href="#routes">Routes</a><a href={mapsUrl("Guatemala travel attractions")} target="_blank" rel="noreferrer">Google Maps</a></div><small>Independent guide · Always verify local conditions</small></footer>

      {showPlanner && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowPlanner(false); }}>
        <aside className="planner" aria-modal="true" role="dialog" aria-labelledby="planner-title">
          <button className="close" onClick={() => setShowPlanner(false)} aria-label="Close planner">×</button>
          <p className="kicker">YOUR LOOSE-LEAF ITINERARY</p><h2 id="planner-title">The route so far.</h2><p className="planner-lede">Nothing is locked in. Add, remove and follow your curiosity.</p>
          <div className="plan-stats"><span><b>{plan.length}</b> stops</span><span><b>{Math.max(4, plan.length * 2 + 1)}</b> suggested days</span><span><b>{"$".repeat(Math.min(3, Math.max(1, planPace)))}</b> pace</span></div>
          <div className="plan-list">{plan.map((id, i) => { const place = places.find(p => p.id === id)!; return <div key={id}><span>DAY {i * 2 + 1}</span><i>{i + 1}</i><section><b>{place.name}</b><small>{place.vibe} · {place.days}</small></section><button onClick={() => togglePlan(id)} aria-label={`Remove ${place.name}`}>×</button></div>; })}</div>
          {!plan.length && <div className="plan-empty">Your route is wide open. Add a place that sparks something.</div>}
          <div className="planner-actions"><button onClick={() => { setShowPlanner(false); jump("discover"); }}>+ Add another stop</button><a href={mapsUrl(plan.map(id => places.find(p => p.id === id)?.name).join(" to ") + " Guatemala")} target="_blank" rel="noreferrer">See route in Maps ↗</a></div>
          <p className="local-note">✓ This plan is automatically saved on this device.</p>
        </aside>
      </div>}
      {notice && <div className="toast" role="status">✦ {notice}</div>}
    </main>
  );
}
