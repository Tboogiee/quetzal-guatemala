"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteTrip as removeCloudTrip,
  isSupabaseConfigured,
  loadAccount,
  refreshSession,
  restoreSession,
  saveSession,
  saveTrip as persistTrip,
  signIn as supabaseSignIn,
  signOut as supabaseSignOut,
  signUp as supabaseSignUp,
  type CloudTrip,
  type SupabaseSession,
  type TripDraft,
} from "@/lib/supabase";

type AccountStatus = "loading" | "signed-out" | "authenticated";

export function useTravelAccount() {
  const [status, setStatus] = useState<AccountStatus>("loading");
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [trips, setTrips] = useState<CloudTrip[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const hydrate = useCallback(async (nextSession: SupabaseSession) => {
    const account = await loadAccount(nextSession);
    setDisplayName(account.displayName);
    setTrips(account.trips);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!isSupabaseConfigured) {
        if (active) setStatus("signed-out");
        return;
      }
      try {
        const restored = await restoreSession();
        if (!active) return;
        if (!restored) {
          setStatus("signed-out");
          return;
        }
        setSession(restored);
        await hydrate(restored);
        if (active) setStatus("authenticated");
      } catch {
        if (active) setStatus("signed-out");
      }
    })();
    return () => { active = false; };
  }, [hydrate]);

  useEffect(() => {
    if (!session) return;
    const refreshIn = Math.max(session.expires_at * 1000 - Date.now() - 60_000, 10_000);
    const timer = window.setTimeout(async () => {
      try {
        setSession(await refreshSession(session.refresh_token));
      } catch {
        saveSession(null);
        setSession(null);
        setStatus("signed-out");
      }
    }, refreshIn);
    return () => window.clearTimeout(timer);
  }, [session]);

  const clearFeedback = useCallback(() => {
    setMessage("");
    setError("");
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    clearFeedback();
    setBusy(true);
    try {
      const next = await supabaseSignIn(email.trim(), password);
      setSession(next);
      await hydrate(next);
      setStatus("authenticated");
      setMessage("Welcome back — your trips are ready.");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [clearFeedback, hydrate]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    clearFeedback();
    setBusy(true);
    try {
      const result = await supabaseSignUp(name.trim(), email.trim(), password);
      if (result.session) {
        setSession(result.session);
        await hydrate(result.session);
        setStatus("authenticated");
        setMessage("Account created — save your first trip.");
      } else {
        setMessage("Check your email to confirm your account, then return and sign in.");
      }
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create your account.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [clearFeedback, hydrate]);

  const signOut = useCallback(async () => {
    if (!session) return;
    clearFeedback();
    setBusy(true);
    try {
      await supabaseSignOut(session);
    } catch {
      saveSession(null);
    } finally {
      setSession(null);
      setDisplayName("");
      setTrips([]);
      setStatus("signed-out");
      setBusy(false);
    }
  }, [clearFeedback, session]);

  const saveTrip = useCallback(async (draft: TripDraft, id?: string) => {
    if (!session) {
      setError("Sign in to save this trip to your account.");
      return null;
    }
    clearFeedback();
    setBusy(true);
    try {
      const saved = await persistTrip(session, draft, id);
      setTrips(current => [saved, ...current.filter(trip => trip.id !== saved.id)]);
      setMessage("Trip saved to your account.");
      return saved;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your trip.");
      return null;
    } finally {
      setBusy(false);
    }
  }, [clearFeedback, session]);

  const deleteTrip = useCallback(async (id: string) => {
    if (!session) return false;
    clearFeedback();
    setBusy(true);
    try {
      await removeCloudTrip(session, id);
      setTrips(current => current.filter(trip => trip.id !== id));
      setMessage("Trip deleted.");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this trip.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [clearFeedback, session]);

  return {
    configured: isSupabaseConfigured,
    status,
    user: session?.user ?? null,
    displayName,
    trips,
    busy,
    message,
    error,
    clearFeedback,
    signIn,
    signUp,
    signOut,
    saveTrip,
    deleteTrip,
  };
}

export type TravelAccount = ReturnType<typeof useTravelAccount>;
