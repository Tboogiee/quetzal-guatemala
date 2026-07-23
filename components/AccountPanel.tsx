"use client";

import { useState, type FormEvent } from "react";
import { destinations } from "@/app/travel-data";
import type { TravelAccount } from "@/hooks/useTravelAccount";
import type { CloudTrip, TripDraft } from "@/lib/supabase";

type Props = {
  account: TravelAccount;
  currentTrip: Omit<TripDraft, "title">;
  onClose: () => void;
  onLoadTrip: (trip: CloudTrip) => void;
};

const placeName = (id: string) => destinations.find(place => place.id === id)?.name ?? id;

export default function AccountPanel({ account, currentTrip, onClose, onLoadTrip }: Props) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tripTitle, setTripTitle] = useState("My Guatemala trip");

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = mode === "sign-in"
      ? await account.signIn(email, password)
      : await account.signUp(name, email, password);
    if (ok) setPassword("");
  }

  async function saveCurrent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await account.saveTrip({ title: tripTitle.trim(), ...currentTrip });
    if (saved) setTripTitle("My next Guatemala trip");
  }

  return <div className="account-backdrop" onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <aside className="account-panel" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <button className="account-close" onClick={onClose} aria-label="Close account">×</button>

      {account.status === "loading" ? <div className="account-loading">
        <i>Q</i><h2 id="account-title">Opening your trips…</h2>
      </div> : account.status === "signed-out" ? <div className="auth-layout">
        <section className="auth-story">
          <p className="atlas-kicker">YOUR QUETZAL ACCOUNT</p>
          <h2 id="account-title">Your journey,<br/><em>wherever you go.</em></h2>
          <p>Save complete routes and reopen them on any device. Your local planner keeps working even before you sign in.</p>
          <div><span>⌁</span><b>Routes, dates, activities and saved places</b></div>
        </section>
        <section className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={mode === "sign-in"} className={mode === "sign-in" ? "active" : ""} onClick={() => { setMode("sign-in"); account.clearFeedback(); }}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "sign-up"} className={mode === "sign-up" ? "active" : ""} onClick={() => { setMode("sign-up"); account.clearFeedback(); }}>Create account</button>
          </div>
          {!account.configured ? <p className="account-notice error">Accounts are not configured in this build yet.</p> : <form className="auth-form" onSubmit={submitAuth}>
            {mode === "sign-up" && <label><span>Name</span><input required minLength={2} value={name} onChange={event => setName(event.target.value)} autoComplete="name" placeholder="How should we call you?"/></label>}
            <label><span>Email</span><input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com"/></label>
            <label><span>Password</span><input required type="password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} placeholder="At least 8 characters"/></label>
            <button className="auth-submit" disabled={account.busy}>{account.busy ? "One moment…" : mode === "sign-in" ? "Open my trips" : "Create my account"}</button>
          </form>}
          {account.message && <p className="account-notice">{account.message}</p>}
          {account.error && <p className="account-notice error">{account.error}</p>}
          <small>Your account data is private and protected by row-level security.</small>
        </section>
      </div> : <div className="trips-layout">
        <header className="trips-head">
          <div><p className="atlas-kicker">MY QUETZAL</p><h2 id="account-title">Hi, {account.displayName || "traveller"}.</h2><p>{account.user?.email}</p></div>
          <button onClick={() => void account.signOut()} disabled={account.busy}>Sign out</button>
        </header>
        {(account.message || account.error) && <p className={`account-notice ${account.error ? "error" : ""}`}>{account.error || account.message}</p>}
        <form className="save-trip-card" onSubmit={saveCurrent}>
          <div><p className="atlas-kicker">CURRENT PLAN</p><h3>{currentTrip.route.length} stops ready to save</h3><small>{currentTrip.startDate && currentTrip.endDate ? `${currentTrip.startDate} → ${currentTrip.endDate}` : "Dates can be added later"}</small></div>
          <div><input required maxLength={80} value={tripTitle} onChange={event => setTripTitle(event.target.value)} aria-label="Trip name"/><button disabled={account.busy || !currentTrip.route.length}>Save trip</button></div>
        </form>
        <section className="cloud-trips">
          <div className="cloud-trips-title"><div><p className="atlas-kicker">CLOUD-SAVED</p><h3>Your trips</h3></div><b>{account.trips.length}</b></div>
          {account.trips.length ? account.trips.map(trip => <article key={trip.id}>
            <div className="trip-number">{String(trip.route.length).padStart(2, "0")}<small>stops</small></div>
            <div><h4>{trip.title}</h4><p>{trip.route.slice(0, 4).map(placeName).join(" · ")}{trip.route.length > 4 ? " …" : ""}</p><small>{trip.startDate && trip.endDate ? `${trip.startDate} → ${trip.endDate}` : `Updated ${new Date(trip.updatedAt).toLocaleDateString()}`}</small></div>
            <div className="trip-actions"><button onClick={() => onLoadTrip(trip)}>Open</button><button className="delete" aria-label={`Delete ${trip.title}`} onClick={() => void account.deleteTrip(trip.id)}>×</button></div>
          </article>) : <div className="empty-cloud"><span>⌁</span><p>Your saved trips will appear here.</p></div>}
        </section>
      </div>}
    </aside>
  </div>;
}
