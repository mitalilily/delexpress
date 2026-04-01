const RAW_API_BASE_URL = import.meta.env.VITE_API_URL;
const DEFAULT_API_BASE_URL = "https://api.expressopro.in/api";

function getApiBaseUrl() {
  const fallback = DEFAULT_API_BASE_URL.replace(/\/+$/, "");

  try {
    if (!RAW_API_BASE_URL) return fallback;

    const candidate = new URL(RAW_API_BASE_URL, window.location.origin);
    const currentHost = window.location.hostname;
    const isNetlifyPreview = currentHost.endsWith("netlify.app");
    const pointsBackToFrontend = candidate.hostname === currentHost;

    if (isNetlifyPreview && pointsBackToFrontend) {
      return fallback;
    }

    const normalized = candidate.href.replace(/\/+$/, "");
    if (normalized.endsWith("/api") || normalized.includes("/api/")) return normalized;
    return `${normalized}/api`;
  } catch {
    return fallback;
  }
}

function toPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function roundWeight(weight) {
  return Number.isFinite(weight) ? Number(weight.toFixed(3)) : 0;
}

export function calculateWeightBreakdown(formValues) {
  const actualWeightKg = toPositiveNumber(formValues.packageWeight) || 0;
  const length = toPositiveNumber(formValues.length) || 0;
  const breadth = toPositiveNumber(formValues.breadth) || 0;
  const height = toPositiveNumber(formValues.height) || 0;

  const volumetricWeightKg =
    length > 0 && breadth > 0 && height > 0 ? (length * breadth * height) / 5000 : 0;

  const actualWeightGrams = actualWeightKg > 0 ? actualWeightKg * 1000 : 0;
  const volumetricWeightGrams = volumetricWeightKg > 0 ? volumetricWeightKg * 1000 : 0;
  const applicableWeightGrams = Math.max(actualWeightGrams, volumetricWeightGrams, 500);

  return {
    actualWeightKg: roundWeight(actualWeightKg),
    volumetricWeightKg: roundWeight(volumetricWeightKg),
    applicableWeightKg: roundWeight(applicableWeightGrams / 1000),
    applicableSource:
      actualWeightGrams >= volumetricWeightGrams ? "Actual weight" : "Volumetric weight",
    applicableWeightGrams,
  };
}

export async function fetchPincodeLocation(pincode, signal) {
  const normalizedPincode = String(pincode || "").trim();

  if (!/^\d{6}$/.test(normalizedPincode)) {
    return null;
  }

  const url = new URL(`${getApiBaseUrl()}/serviceability/locations`);
  url.searchParams.set("pincode", normalizedPincode);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error("Unable to verify this pincode right now.");
  }

  const match = Array.isArray(data?.data) ? data.data[0] : null;

  if (!match?.city || !match?.state) {
    return null;
  }

  return {
    pincode: normalizedPincode,
    city: match.city,
    state: match.state,
  };
}

export async function fetchGuestRateEstimate(formValues, signal) {
  const weightBreakdown = calculateWeightBreakdown(formValues);
  const payload = {
    origin: Number(formValues.pickupPincode),
    destination: Number(formValues.deliveryPincode),
    payment_type: formValues.paymentType || "prepaid",
    order_amount: toPositiveNumber(formValues.orderAmount),
    weight: weightBreakdown.applicableWeightGrams,
    length: toPositiveNumber(formValues.length),
    breadth: toPositiveNumber(formValues.breadth),
    height: toPositiveNumber(formValues.height),
  };

  const response = await fetch(`${getApiBaseUrl()}/couriers/available-to-guest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(data?.error || "Unable to fetch shipping rates right now.");
  }

  return Array.isArray(data.data) ? data.data : [];
}
