/**
 * NimbusPost Shipping Service
 * Handles all interactions with the NimbusPost API.
 * Token is cached in-memory and refreshed automatically on expiry.
 */

const NIMBUSPOST_BASE_URL = "https://api.nimbuspost.com/v1";

// ── In-memory token cache ──────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0; // unix ms

// ── Types ──────────────────────────────────────────────────────────

export interface CourierOption {
  courier_id: number;
  courier_name: string;
  rate: number;
  estimated_delivery: string;
  etd: string;
  min_weight: number;
  cod_charges?: number;
  is_recommended?: boolean;
}

export interface ServiceabilityParams {
  pickup_pincode: string;
  delivery_pincode: string;
  weight: number; // in kg
  cod: 0 | 1;
  order_amount?: number;
}

export interface CreateShipmentParams {
  order_number: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_country?: string;
  weight: number; // kg
  length?: number; // cm
  breadth?: number; // cm
  height?: number; // cm
  total_amount: number;
  payment_method: "COD" | "PREPAID";
  courier_id: number;
  items: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
}

export interface ShipmentResult {
  awb_number: string;
  shipment_id: string;
  courier_name: string;
  tracking_url: string;
}

export interface PickupScheduleParams {
  awb_numbers: string[]; // array of AWB numbers to schedule
  pickup_date?: string;  // YYYY-MM-DD, defaults to today
}

export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  remark?: string;
}

export interface TrackingResult {
  awb_number: string;
  current_status: string;
  tracking_events: TrackingEvent[];
}

// ── Token Management ───────────────────────────────────────────────

/**
 * Fetches a fresh token from NimbusPost using email/password from env vars.
 */
async function fetchNewToken(): Promise<string> {
  const email = process.env.NIMBUSPOST_EMAIL;
  const password = process.env.NIMBUSPOST_PASSWORD;

  if (!email || !password) {
    throw new Error("NimbusPost credentials are not configured in environment variables.");
  }

  const res = await fetch(`${NIMBUSPOST_BASE_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NimbusPost auth failed: ${res.status} — ${err}`);
  }

  const data = await res.json();

  // NimbusPost returns { status: true, data: "eyJ..." }
  if (!data.status || !data.data) {
    throw new Error(`NimbusPost auth error: ${JSON.stringify(data)}`);
  }

  return data.data as string;
}

/**
 * Returns a valid NimbusPost token, refreshing if expired.
 * Token is considered expired 10 minutes before actual expiry to be safe.
 */
export async function getNimbusPostToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt - 10 * 60 * 1000) {
    return cachedToken;
  }

  const token = await fetchNewToken();
  cachedToken = token;
  // NimbusPost tokens are typically valid for 24 hours
  tokenExpiresAt = now + 24 * 60 * 60 * 1000;
  return token;
}

/**
 * Helper: Perform authenticated request to NimbusPost API.
 */
async function nimbusRequest(
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: object
): Promise<any> {
  const token = await getNimbusPostToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const options: RequestInit = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${NIMBUSPOST_BASE_URL}${endpoint}`, options);

  if (res.status === 401) {
    // Token might have expired externally — invalidate cache and retry once
    cachedToken = null;
    tokenExpiresAt = 0;
    const freshToken = await getNimbusPostToken();
    headers.Authorization = `Bearer ${freshToken}`;
    const retry = await fetch(`${NIMBUSPOST_BASE_URL}${endpoint}`, options);
    if (!retry.ok) {
      const errText = await retry.text();
      throw new Error(`NimbusPost API error after token refresh: ${retry.status} — ${errText}`);
    }
    return retry.json();
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`NimbusPost API error: ${res.status} — ${errText}`);
  }

  return res.json();
}

// ── 1. Authentication (exposed for explicit token generation) ───────

export async function generateNimbusToken(): Promise<string> {
  cachedToken = null;
  tokenExpiresAt = 0;
  return getNimbusPostToken();
}

// ── 2. Courier Serviceability ──────────────────────────────────────

export async function getCourierServiceability(
  params: ServiceabilityParams
): Promise<CourierOption[]> {
  const { pickup_pincode, delivery_pincode, weight, cod, order_amount } = params;

  const data = await nimbusRequest("/courier/serviceability", "POST", {
    origin: pickup_pincode,
    destination: delivery_pincode,
    payment_type: cod ? "cod" : "prepaid",
    order_amount: order_amount ?? 0,
    weight,
    length: 10,
    breadth: 10,
    height: 10,
  });

  // NimbusPost returns { status: true, data: [...couriers] }
  if (!data.status) {
    throw new Error(`Serviceability check failed: ${data.message || JSON.stringify(data)}`);
  }

  const couriers = (data.data ?? []) as any[];

  return couriers.map((c: any) => ({
    courier_id: c.courier_id ?? c.id,
    courier_name: c.courier_name ?? c.name,
    rate: parseFloat(c.total_charges ?? c.rate ?? 0),
    estimated_delivery: c.estimated_delivery ?? c.etd ?? "N/A",
    etd: c.etd ?? c.estimated_delivery ?? "N/A",
    min_weight: parseFloat(c.min_weight ?? 0.5),
    cod_charges: parseFloat(c.cod_charges ?? 0),
    is_recommended: !!c.is_recommended,
  }));
}

// ── 3. Create Shipment ─────────────────────────────────────────────

export async function createShipment(
  params: CreateShipmentParams
): Promise<ShipmentResult> {
  const storePincode = process.env.STORE_PINCODE;
  if (!storePincode) {
    throw new Error("STORE_PINCODE environment variable is not set.");
  }

  const payload = {
    order_number: params.order_number,
    payment_type: params.payment_method === "COD" ? "cod" : "prepaid",
    package_weight: params.weight,
    package_length: params.length ?? 10,
    package_breadth: params.breadth ?? 10,
    package_height: params.height ?? 10,
    order_amount: params.total_amount,
    courier_id: params.courier_id,
    consignee: {
      name: params.shipping_name,
      phone: params.shipping_phone,
      address: params.shipping_address,
      city: params.shipping_city,
      state: params.shipping_state,
      pincode: params.shipping_pincode,
      country: params.shipping_country ?? "India",
    },
    pickup: {
      warehouse_name: "Primary Warehouse",
      name: "Store",
      phone: params.shipping_phone,
      address: "Primary Warehouse",
      city: "Surat",
      state: "Gujarat",
      pincode: storePincode,
      country: "India",
    },
    order_items: params.items.map((item) => ({
      name: item.name,
      qty: item.qty,
      price: item.price,
    })),
  };

  const data = await nimbusRequest("/shipments", "POST", payload);

  if (!data.status) {
    throw new Error(`Create shipment failed: ${data.message ?? JSON.stringify(data)}`);
  }

  const awb = data.data?.awb_number ?? data.awb_number ?? "";
  const shipmentId = String(data.data?.shipment_id ?? data.shipment_id ?? "");
  const courierName = data.data?.courier_name ?? params.courier_id.toString();

  return {
    awb_number: awb,
    shipment_id: shipmentId,
    courier_name: courierName,
    tracking_url: `https://nimbuspost.com/track?awb=${awb}`,
  };
}

// ── 4. Generate Shipping Label ─────────────────────────────────────

export async function generateShippingLabel(
  awbNumbers: string[]
): Promise<string> {
  // NimbusPost returns a PDF base64 or URL
  const data = await nimbusRequest("/shipments/label", "POST", {
    awb_numbers: awbNumbers,
  });

  if (!data.status) {
    throw new Error(`Generate label failed: ${data.message ?? JSON.stringify(data)}`);
  }

  // Returns PDF URL or base64
  return data.data?.label_url ?? data.label_url ?? data.data ?? "";
}

// ── 5. Schedule Pickup ─────────────────────────────────────────────

export async function schedulePickup(
  params: PickupScheduleParams
): Promise<{ success: boolean; message: string }> {
  const today = new Date();
  const defaultDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

  const data = await nimbusRequest("/shipments/schedule-pickup", "POST", {
    awb_numbers: params.awb_numbers,
    pickup_date: params.pickup_date ?? defaultDate,
  });

  if (!data.status) {
    throw new Error(`Schedule pickup failed: ${data.message ?? JSON.stringify(data)}`);
  }

  return {
    success: true,
    message: data.message ?? "Pickup scheduled successfully",
  };
}

// ── 6. Track Shipment ──────────────────────────────────────────────

export async function trackShipment(awbNumber: string): Promise<TrackingResult> {
  const data = await nimbusRequest(`/shipments/track/${awbNumber}`, "GET");

  if (!data.status) {
    throw new Error(`Track shipment failed: ${data.message ?? JSON.stringify(data)}`);
  }

  const rawEvents = data.data?.tracking ?? data.tracking ?? [];

  const events: TrackingEvent[] = rawEvents.map((e: any) => ({
    status: e.status ?? e.scan_type ?? "Unknown",
    location: e.location ?? e.city ?? "",
    timestamp: e.timestamp ?? e.updated_at ?? "",
    remark: e.remark ?? e.activity ?? "",
  }));

  return {
    awb_number: awbNumber,
    current_status: data.data?.status ?? data.status_label ?? "Unknown",
    tracking_events: events,
  };
}

// ── 7. Cancel Shipment ─────────────────────────────────────────────

export async function cancelShipment(
  awbNumbers: string[]
): Promise<{ success: boolean; message: string }> {
  const data = await nimbusRequest("/shipments/cancel", "POST", {
    awb_numbers: awbNumbers,
  });

  if (!data.status) {
    throw new Error(`Cancel shipment failed: ${data.message ?? JSON.stringify(data)}`);
  }

  return {
    success: true,
    message: data.message ?? "Shipment cancelled successfully",
  };
}
