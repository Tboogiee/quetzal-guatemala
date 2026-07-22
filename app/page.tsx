"use client";

import { useEffect, useMemo, useState } from "react";
import { Destination, destinations, faqs, phrases, sources } from "./travel-data";

type View = "explore" | "plan" | "language" | "faq";
type DetailTab = "story" | "do" | "eat" | "stay" | "transport";

const maps = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + " Guatemala")}`;
const tabs: {id:View;label:string;icon:string}[] = [
  {id:"explore",label:"Explore",icon:"⌖"},{id:"plan",label:"My route",icon:"⌁"},{id:"language",label:"Spanish",icon:"A"},{id:"faq",label:"Travel FAQ",icon:"?"}
];

export default function Home(){
  const [view,setView]=useState<View>("explore");
  const [selected,setSelected]=useState<Destination|null>(null);
  const [detailTab,setDetailTab]=useState<DetailTab>("story");
  const [saved,setSaved]=useState<string[]>([]);
  const [route,setRoute]=useState<string[]>(["antigua","atitlan","peten"]);
  const [activities,setActivities]=useState<string[]>([]);
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("All");
  const [days,setDays]=useState(12);
  const [phraseGroup,setPhraseGroup]=useState("Basics");
  const [faqOpen,setFaqOpen]=useState<number|null>(0);
  const [toast,setToast]=useState("");

  useEffect(()=>{try{setSaved(JSON.parse(localStorage.getItem("quetzal-saved-v2")||"[]"));setRoute(JSON.parse(localStorage.getItem("quetzal-route-v2")||"[\"antigua\",\"atitlan\",\"peten\"]"));setActivities(JSON.parse(localStorage.getItem("quetzal-activities-v2")||"[]"));}catch{}},[]);
  useEffect(()=>{localStorage.setItem("quetzal-saved-v2",JSON.stringify(saved))},[saved]);
  useEffect(()=>{localStorage.setItem("quetzal-route-v2",JSON.stringify(route))},[route]);
  useEffect(()=>{localStorage.setItem("quetzal-activities-v2",JSON.stringify(activities))},[activities]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(""),2200);return()=>clearTimeout(timer)},[toast]);

  const filtered=useMemo(()=>destinations.filter(d=>{
    const text=`${d.name} ${d.region} ${d.category} ${d.bestFor.join(" ")} ${d.activities.map(a=>a.name).join(" ")}`.toLowerCase();
    return(category==="All"||d.category===category)&&(!query||text.includes(query.toLowerCase()));
  }),[query,category]);
  const routePlaces=route.map(id=>destinations.find(d=>d.id===id)).filter(Boolean) as Destination[];
  const estimatedDays=routePlaces.reduce((sum,d)=>sum+(d.days.includes("Half")?0.5:parseInt(d.days)||2),0);

  const open=(d:Destination,tab:DetailTab="story")=>{setSelected(d);setDetailTab(tab);document.body.style.overflow="hidden"};
  const close=()=>{setSelected(null);document.body.style.overflow=""};
  const toggleRoute=(id:string)=>{setRoute(r=>r.includes(id)?r.filter(x=>x!==id):[...r,id]);setToast(route.includes(id)?"Removed from route":"Added to your route")};
  const toggleSaved=(id:string)=>{setSaved(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);setToast(saved.includes(id)?"Removed from saved":"Saved for later")};
  const addActivity=(destination:Destination,name:string)=>{const id=`${destination.id}:${name}`;setActivities(a=>a.includes(id)?a.filter(x=>x!==id):[...a,id]);setToast(activities.includes(id)?"Activity removed":"Activity added to route")};

  return <main className="atlas-app">
    <header className="atlas-nav">
      <button className="atlas-brand" onClick={()=>setView("explore")}><span>Q</span><div>quetzal<small>FIELD GUIDE / GUATEMALA</small></div></button>
      <nav>{tabs.map(t=><button key={t.id} className={view===t.id?"active":""} onClick={()=>setView(t.id)}><i>{t.icon}</i>{t.label}{t.id==="plan"&&<b>{route.length}</b>}</button>)}</nav>
      <div className="nav-tools"><button className="saved-counter" onClick={()=>{setView("explore");setCategory("Saved")}}>♡ {saved.length}</button><button className="route-cta" onClick={()=>setView("plan")}>Open trip <span>↗</span></button></div>
    </header>

    {view==="explore"&&<>
      <section className="atlas-hero">
        <div className="atlas-contour contour-a"/><div className="atlas-contour contour-b"/>
        <div className="atlas-hero-copy"><p className="atlas-kicker">GUATEMALA, CURATED DEEPLY</p><h1>Go beyond<br/><em>the postcard.</em></h1><p>Build a route through living Maya culture, volcanic landscapes and Caribbean currents—one well-planned stop at a time.</p>
          <div className="atlas-search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search places, ruins, food, hikes…" aria-label="Search destinations"/><kbd>⌘ K</kbd></div>
          <div className="hero-metrics"><span><b>{destinations.length}</b> travel bases</span><span><b>{destinations.reduce((n,d)=>n+d.activities.length,0)}+</b> specific stops</span><span><b>5</b> practical layers</span></div>
        </div>
        <div className="route-preview">
          <div className="route-preview-head"><span>YOUR ROUTE, SO FAR</span><b>{route.length} STOPS</b></div>
          {routePlaces.slice(0,4).map((d,i)=><button key={d.id} onClick={()=>open(d)}><i>0{i+1}</i><div><b>{d.name}</b><small>{d.region} · {d.days}</small></div><span>↗</span></button>)}
          <button className="preview-plan" onClick={()=>setView("plan")}>Shape this trip <span>→</span></button>
        </div>
      </section>

      <section className="atlas-explore">
        <aside className="explore-rail"><p>EXPLORE BY MOOD</p>{["All","Culture","Nature","Adventure","History","City","Coast","Offbeat"].map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}><span>{c}</span><b>{c==="All"?destinations.length:destinations.filter(d=>d.category===c).length}</b></button>)}<hr/><button className={category==="Saved"?"active":""} onClick={()=>setCategory("Saved")}><span>♡ Saved</span><b>{saved.length}</b></button></aside>
        <div className="explore-main">
          <div className="explore-title"><div><p className="atlas-kicker">{category==="All"?"THE FULL FIELD GUIDE":category.toUpperCase()}</p><h2>{category==="Saved"?"Places you saved.":"Choose your next chapter."}</h2></div><span>{category==="Saved"?saved.length:filtered.length} places</span></div>
          <div className="atlas-grid">{(category==="Saved"?destinations.filter(d=>saved.includes(d.id)):filtered).map((d,i)=><article className={`atlas-card tone-${d.color}`} key={d.id}>
            <button className={`atlas-save ${saved.includes(d.id)?"on":""}`} onClick={()=>toggleSaved(d.id)} aria-label={`${saved.includes(d.id)?"Unsave":"Save"} ${d.name}`}>{saved.includes(d.id)?"♥":"♡"}</button>
            <button className="card-visual" onClick={()=>open(d)}><span className="card-index">{String(i+1).padStart(2,"0")}</span><div className="landform"><i/><i/><i/></div><span className="coordinates">{d.coordinates}</span><p>{d.mood}</p></button>
            <div className="atlas-card-body"><small>{d.region} · {d.category}</small><h3><button onClick={()=>open(d)}>{d.name}</button></h3><p>{d.intro}</p><div className="best-for">{d.bestFor.slice(0,3).map(x=><span key={x}>{x}</span>)}</div><div className="card-facts"><span>◷ {d.days}</span><span>⌁ {d.altitude}</span><span>{"$".repeat(d.budget)}</span></div><div className="card-footer"><button className={route.includes(d.id)?"added":""} onClick={()=>toggleRoute(d.id)}>{route.includes(d.id)?"✓ In route":"+ Add to route"}</button><button onClick={()=>open(d)}>Open guide ↗</button></div></div>
          </article>)}</div>
          {category==="Saved"&&!saved.length&&<div className="atlas-empty"><span>♡</span><h3>Your map is still wide open.</h3><p>Save places as you explore and they’ll gather here.</p><button onClick={()=>setCategory("All")}>Explore all places</button></div>}
        </div>
      </section>
    </>}

    {view==="plan"&&<section className="planner-page">
      <div className="planner-top"><div><p className="atlas-kicker">ROUTE WORKSPACE</p><h1>Make the days<br/><em>fit the feeling.</em></h1></div><div className="days-control"><span>TRIP LENGTH</span><button onClick={()=>setDays(Math.max(3,days-1))}>−</button><b>{days} days</b><button onClick={()=>setDays(Math.min(30,days+1))}>+</button></div></div>
      <div className="planner-layout"><div className="route-board">
        <div className="board-head"><h2>Your route</h2><span className={estimatedDays>days?"over":""}>{estimatedDays} suggested days / {days} available</span></div>
        {routePlaces.map((d,i)=><article className="route-stop" key={d.id}><div className="route-line"><i>{i+1}</i>{i<routePlaces.length-1&&<span/>}</div><div className={`stop-art tone-${d.color}`}><div className="mini-landform"/></div><div className="stop-info"><small>STOP {String(i+1).padStart(2,"0")} · {d.region}</small><h3>{d.name}</h3><p>{d.days} suggested · {d.mood}</p><div>{activities.filter(a=>a.startsWith(d.id+":")).map(a=><span key={a}>{a.split(":")[1]} <button onClick={()=>addActivity(d,a.split(":")[1])}>×</button></span>)}</div><button onClick={()=>open(d,"do")}>Choose activities →</button></div><button className="remove-stop" onClick={()=>toggleRoute(d.id)}>×</button></article>)}
        {!route.length&&<div className="atlas-empty"><h3>No route yet.</h3><button onClick={()=>setView("explore")}>Find your first stop</button></div>}
        <button className="add-stop" onClick={()=>setView("explore")}>＋ Add another destination</button>
      </div><aside className="trip-summary"><p className="atlas-kicker">TRIP PULSE</p><h2>{estimatedDays<=days?"Comfortably paced":"A little ambitious"}</h2><p>{estimatedDays<=days?`You have ${Math.max(0,days-estimatedDays)} flexible day${days-estimatedDays===1?"":"s"} for weather, rest or a beautiful detour.`:"Remove a stop or add days to avoid spending the trip in transit."}</p><div className="summary-stat"><span>Destinations</span><b>{route.length}</b></div><div className="summary-stat"><span>Saved activities</span><b>{activities.length}</b></div><div className="summary-stat"><span>Budget rhythm</span><b>{routePlaces.length?"$".repeat(Math.round(routePlaces.reduce((n,d)=>n+d.budget,0)/routePlaces.length)):"—"}</b></div><a href={maps(routePlaces.map(d=>d.name).join(" to "))} target="_blank" rel="noreferrer">Open route in Google Maps ↗</a><small>Road times vary. This link is a starting point, not a booking.</small></aside></div>
    </section>}

    {view==="language"&&<section className="language-page"><div className="page-lede"><p className="atlas-kicker">POCKET SPANISH</p><h1>A little language<br/><em>goes a long way.</em></h1><p>Tap any phrase to hear yourself practice it. Guatemala is multilingual; Spanish helps widely, while learning a greeting in the local Maya language shows care.</p></div><div className="phrase-layout"><aside>{phrases.map(g=><button key={g[0]} className={phraseGroup===g[0]?"active":""} onClick={()=>setPhraseGroup(g[0])}>{g[0]} <span>→</span></button>)}</aside><div className="phrase-list">{phrases.find(g=>g[0]===phraseGroup)?.[1].map((p,i)=><button key={p[0]} onClick={()=>{if("speechSynthesis" in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(p[0]))}setToast("Playing phrase")}}><i>{String(i+1).padStart(2,"0")}</i><div><b>{p[0]}</b><small>{p[1]}</small></div><span>◖))</span></button>)}</div></div><div className="language-note"><b>Respectful travel note</b><p>Guatemala recognizes 22 Maya languages alongside Spanish, Xinka and Garifuna. Don’t assume Spanish is everyone’s first language, and always ask before photographing people.</p></div></section>}

    {view==="faq"&&<section className="faq-page"><div className="page-lede"><p className="atlas-kicker">BEFORE YOU GO</p><h1>The practical<br/><em>Guatemala briefing.</em></h1><p>Clear answers for route planning, grounded in official travel, health and emergency guidance. Last reviewed July 2026.</p></div><div className="faq-layout"><div className="faq-list">{faqs.map((f,i)=><article key={f.q} className={faqOpen===i?"open":""}><button onClick={()=>setFaqOpen(faqOpen===i?null:i)}><span>{String(i+1).padStart(2,"0")}</span><b>{f.q}</b><i>{faqOpen===i?"−":"+"}</i></button>{faqOpen===i&&<p>{f.a}</p>}</article>)}</div><aside className="source-card"><p className="atlas-kicker">LIVE CHECKS</p><h2>Verify before departure.</h2><p>Conditions, entry rules and advisories change. Use these official starting points close to your travel date.</p>{sources.map(s=><a key={s[0]} href={s[1]} target="_blank" rel="noreferrer">{s[0]} <span>↗</span></a>)}<div><b>Emergency numbers</b><p>Police 110 / 120<br/>Fire 122 / 123<br/>CONRED 119<br/>Tourist assistance 1500</p></div></aside></div></section>}

    {selected&&<div className="guide-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><aside className="destination-guide" role="dialog" aria-modal="true" aria-label={`${selected.name} guide`}>
      <button className="guide-close" onClick={close} aria-label="Close destination guide">×</button><header className={`guide-hero tone-${selected.color}`}><p>{selected.region} / {selected.category}</p><h2>{selected.name}</h2><span>{selected.mood}</span><div className="guide-landform"><i/><i/><i/></div></header>
      <nav className="guide-tabs">{([['story','Story'],['do','Do & see'],['eat','Eat'],['stay','Stay'],['transport','Get there']] as [DetailTab,string][]).map(t=><button key={t[0]} className={detailTab===t[0]?"active":""} onClick={()=>setDetailTab(t[0])}>{t[1]}</button>)}</nav>
      <div className="guide-content">{detailTab==="story"&&<div className="story-tab"><p className="big-intro">{selected.intro}</p><div className="guide-facts"><span><b>{selected.days}</b>Suggested time</span><span><b>{selected.altitude}</b>Altitude</span><span><b>{"$".repeat(selected.budget)}</b>Budget</span></div><h3>Why it matters</h3><p>{selected.history}</p><h3>The Quetzal take</h3><p className="tip-box">✦ {selected.tip}</p>{selected.caution&&<p className="caution-box"><b>Check before you go</b>{selected.caution}</p>}</div>}
        {detailTab!=="story"&&<div className="detail-list"><div className="detail-heading"><p className="atlas-kicker">{detailTab==="do"?"CURATED, NOT CROWDED":detailTab==="eat"?"GOOD PLACES TO START":detailTab==="stay"?"SLEEP WITH A SENSE OF PLACE":"THE PRACTICAL ROUTE"}</p><h3>{detailTab==="do"?"What to do":detailTab==="eat"?"Where to eat":detailTab==="stay"?"Where to stay":"How to get there"}</h3></div>{(detailTab==="do"?selected.activities:detailTab==="eat"?selected.eat:detailTab==="stay"?selected.stay:selected.transport).map((item,i)=><article key={item.name}><i>{String(i+1).padStart(2,"0")}</i><div><h4>{item.name}</h4><p>{item.note}</p>{item.tag&&<span>{item.tag}</span>}</div><div className="detail-actions">{detailTab==="do"&&<button className={activities.includes(`${selected.id}:${item.name}`)?"on":""} onClick={()=>addActivity(selected,item.name)}>{activities.includes(`${selected.id}:${item.name}`)?"✓":"+"}</button>}<a href={maps(item.map||item.name)} target="_blank" rel="noreferrer" aria-label={`Open ${item.name} in Google Maps`}>↗</a></div></article>)}<p className="verify-note">Listings are curated starting points. Verify current hours, prices and availability in Maps or directly before setting out.</p></div>}
      </div><footer className="guide-footer"><button className={route.includes(selected.id)?"added":""} onClick={()=>toggleRoute(selected.id)}>{route.includes(selected.id)?"✓ In your route":"+ Add destination to route"}</button><a href={maps(selected.name)} target="_blank" rel="noreferrer">View area in Maps ↗</a></footer>
    </aside></div>}
    {toast&&<div className="atlas-toast" role="status">✦ {toast}</div>}
  </main>
}
