// MVP placeholder: a small mix of wards across two states/constituencies,
// so officer/citizen routing is demonstrably scoped by area, not just
// department. Same list BUILD_SPEC.md §5 needs for the seeded per-ward
// demographic dataset — easy to rename/extend later.
export const STATES = ["Telangana", "Andhra Pradesh"] as const;
export type StateName = (typeof STATES)[number];

export const WARDS_BY_STATE: Record<StateName, string[]> = {
  Telangana: ["Malkajgiri", "Uppal", "Kapra"],
  "Andhra Pradesh": ["Mangalagiri", "Tadepalli", "Thullur"],
};

// Each MP (parliamentary) constituency groups several MLA wards. In real
// geography these two happen to share a name with their home ward, so the
// mapping below is deliberately simple for the demo.
export const MP_CONSTITUENCIES = ["Malkajgiri", "Mangalagiri"] as const;
export type MPConstituency = (typeof MP_CONSTITUENCIES)[number];

export const MP_CONSTITUENCY_BY_WARD: Record<string, MPConstituency> = {
  Malkajgiri: "Malkajgiri",
  Uppal: "Malkajgiri",
  Kapra: "Malkajgiri",
  Mangalagiri: "Mangalagiri",
  Tadepalli: "Mangalagiri",
  Thullur: "Mangalagiri",
};

export function wardsInMPConstituency(constituency: string): string[] {
  return Object.entries(MP_CONSTITUENCY_BY_WARD)
    .filter(([, mp]) => mp === constituency)
    .map(([ward]) => ward);
}

export function stateForMPConstituency(constituency: string): StateName {
  const [firstWard] = wardsInMPConstituency(constituency);
  return STATES.find((s) => WARDS_BY_STATE[s].includes(firstWard))!;
}

// Approximate real-world centers for each ward, used only to auto-match a
// citizen's GPS location to the nearest demo ward (no Geocoding API needed).
const WARD_COORDS: Record<string, { lat: number; lng: number }> = {
  Malkajgiri: { lat: 17.4585, lng: 78.5063 },
  Uppal: { lat: 17.4009, lng: 78.5602 },
  Kapra: { lat: 17.4667, lng: 78.5667 },
  Mangalagiri: { lat: 16.4307, lng: 80.5525 },
  Tadepalli: { lat: 16.4823, lng: 80.6003 },
  Thullur: { lat: 16.5074, lng: 80.518 },
};

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function findNearestWard(
  lat: number,
  lng: number
): { state: StateName; ward: string } {
  let bestWard = Object.keys(WARD_COORDS)[0];
  let bestDistance = Infinity;

  for (const ward of Object.keys(WARD_COORDS)) {
    const distance = haversineKm({ lat, lng }, WARD_COORDS[ward]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestWard = ward;
    }
  }

  const state = STATES.find((s) => WARDS_BY_STATE[s].includes(bestWard))!;
  return { state, ward: bestWard };
}
