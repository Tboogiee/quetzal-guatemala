export type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: SupabaseUser;
};

export type TripDraft = {
  title: string;
  startDate: string;
  endDate: string;
  route: string[];
  activities: string[];
  savedPlaces: string[];
};

export type CloudTrip = TripDraft & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

type AuthPayload = Partial<SupabaseSession> & {
  user?: SupabaseUser;
  id?: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type ProfileRow = { display_name: string };
type TripRow = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  route: unknown;
  activities: unknown;
  saved_places: unknown;
  created_at: string;
  updated_at: string;
};

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const sessionStorageKey = "quetzal-supabase-session-v1";

export const isSupabaseConfigured = Boolean(projectUrl && publishableKey);

function errorMessage(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") return fallback;
  const record = value as Record<string, unknown>;
  const message = record.message ?? record.msg ?? record.error_description ?? record.error;
  return typeof message === "string" && message ? message : fallback;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

async function request<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  if (!projectUrl || !publishableKey) {
    throw new Error("Accounts are not configured for this deployment yet.");
  }
  const headers = new Headers(init.headers);
  headers.set("apikey", publishableKey);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${projectUrl}${path}`, { ...init, headers });
  const payload = await parseResponse(response);
  if (!response.ok) throw new Error(errorMessage(payload, `Account request failed (${response.status}).`));
  return payload as T;
}

function normalizeSession(payload: AuthPayload): SupabaseSession | null {
  const user = payload.user ?? (payload.id ? {
    id: payload.id,
    email: payload.email,
    user_metadata: payload.user_metadata,
  } : undefined);
  if (!payload.access_token || !payload.refresh_token || !payload.expires_in || !user) return null;
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_in: payload.expires_in,
    expires_at: payload.expires_at ?? Math.floor(Date.now() / 1000) + payload.expires_in,
    token_type: payload.token_type ?? "bearer",
    user,
  };
}

export function saveSession(session: SupabaseSession | null) {
  if (typeof window === "undefined") return;
  if (!session) window.localStorage.removeItem(sessionStorageKey);
  else window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

function storedSession() {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(sessionStorageKey);
  if (!value) return null;
  try {
    return JSON.parse(value) as SupabaseSession;
  } catch {
    window.localStorage.removeItem(sessionStorageKey);
    return null;
  }
}

async function getUser(accessToken: string) {
  return request<SupabaseUser>("/auth/v1/user", { method: "GET" }, accessToken);
}

export async function refreshSession(refreshToken: string) {
  const payload = await request<AuthPayload>("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const session = normalizeSession(payload);
  if (!session) throw new Error("Supabase did not return a valid refreshed session.");
  saveSession(session);
  return session;
}

function sessionFromRedirect() {
  if (typeof window === "undefined" || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const expiresIn = Number(params.get("expires_in"));
  return accessToken && refreshToken && expiresIn ? { accessToken, refreshToken, expiresIn } : null;
}

export async function restoreSession() {
  if (!isSupabaseConfigured || typeof window === "undefined") return null;
  const redirect = sessionFromRedirect();
  if (redirect) {
    const user = await getUser(redirect.accessToken);
    const session: SupabaseSession = {
      access_token: redirect.accessToken,
      refresh_token: redirect.refreshToken,
      expires_in: redirect.expiresIn,
      expires_at: Math.floor(Date.now() / 1000) + redirect.expiresIn,
      token_type: "bearer",
      user,
    };
    saveSession(session);
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
    return session;
  }
  const session = storedSession();
  if (!session) return null;
  try {
    if (session.expires_at <= Math.floor(Date.now() / 1000) + 60) {
      return await refreshSession(session.refresh_token);
    }
    const verified = { ...session, user: await getUser(session.access_token) };
    saveSession(verified);
    return verified;
  } catch {
    saveSession(null);
    return null;
  }
}

export async function signUp(displayName: string, email: string, password: string) {
  const redirectTo = typeof window === "undefined" ? undefined : window.location.origin;
  const query = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : "";
  const payload = await request<AuthPayload>(`/auth/v1/signup${query}`, {
    method: "POST",
    body: JSON.stringify({ email, password, data: { display_name: displayName } }),
  });
  const session = normalizeSession(payload);
  if (session) saveSession(session);
  return { session, user: session?.user ?? payload.user ?? payload };
}

export async function signIn(email: string, password: string) {
  const payload = await request<AuthPayload>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const session = normalizeSession(payload);
  if (!session) throw new Error("Supabase did not return a valid session.");
  saveSession(session);
  return session;
}

export async function signOut(session: SupabaseSession) {
  try {
    await request<null>("/auth/v1/logout", { method: "POST" }, session.access_token);
  } finally {
    saveSession(null);
  }
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapTrip(row: TripRow): CloudTrip {
  return {
    id: row.id,
    title: row.title,
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    route: stringList(row.route),
    activities: stringList(row.activities),
    savedPlaces: stringList(row.saved_places),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadAccount(session: SupabaseSession) {
  const userId = encodeURIComponent(session.user.id);
  const [profiles, trips] = await Promise.all([
    request<ProfileRow[]>(
      `/rest/v1/profiles?id=eq.${userId}&select=display_name`,
      { method: "GET" },
      session.access_token,
    ),
    request<TripRow[]>(
      `/rest/v1/trips?user_id=eq.${userId}&select=*&order=updated_at.desc`,
      { method: "GET" },
      session.access_token,
    ),
  ]);
  const metadataName = session.user.user_metadata?.display_name;
  return {
    displayName: profiles[0]?.display_name ||
      (typeof metadataName === "string" ? metadataName : "") ||
      session.user.email?.split("@")[0] || "Traveller",
    trips: trips.map(mapTrip),
  };
}

export async function saveTrip(session: SupabaseSession, draft: TripDraft, id?: string) {
  const tripId = id || crypto.randomUUID();
  const rows = await request<TripRow[]>("/rest/v1/trips?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      id: tripId,
      user_id: session.user.id,
      title: draft.title,
      start_date: draft.startDate || null,
      end_date: draft.endDate || null,
      route: draft.route,
      activities: draft.activities,
      saved_places: draft.savedPlaces,
      updated_at: new Date().toISOString(),
    }),
  }, session.access_token);
  if (!rows[0]) throw new Error("Your trip could not be saved.");
  return mapTrip(rows[0]);
}

export async function deleteTrip(session: SupabaseSession, id: string) {
  await request<null>(
    `/rest/v1/trips?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(session.user.id)}`,
    { method: "DELETE", headers: { Prefer: "return=minimal" } },
    session.access_token,
  );
}
