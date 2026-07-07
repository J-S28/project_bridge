// Seeded demo geography covering every Indian state and union territory, a
// few wards each, so officer/citizen routing and signup genuinely work
// nationwide — not just in the 3 states with real seeded complaint data
// (Telangana, Andhra Pradesh, Delhi). Same list BUILD_SPEC.md §5 needs for
// the seeded per-ward demographic dataset — easy to extend later.
export const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;
export type StateName = (typeof STATES)[number];

export const WARDS_BY_STATE: Record<StateName, string[]> = {
  Telangana: ["Malkajgiri", "Uppal", "Kapra"],
  "Andhra Pradesh": ["Mangalagiri", "Tadepalli", "Thullur"],
  Delhi: ["Karol Bagh", "Chandni Chowk", "Dwarka"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun"],
  Assam: ["Guwahati", "Dispur"],
  Bihar: ["Patna", "Gaya"],
  Chhattisgarh: ["Raipur", "Bilaspur"],
  Goa: ["Panaji", "Margao"],
  Gujarat: ["Ahmedabad", "Surat"],
  Haryana: ["Gurugram", "Faridabad"],
  "Himachal Pradesh": ["Shimla", "Manali"],
  Jharkhand: ["Ranchi", "Jamshedpur"],
  Karnataka: ["Bengaluru", "Mysuru"],
  Kerala: ["Thiruvananthapuram", "Kochi"],
  "Madhya Pradesh": ["Bhopal", "Indore"],
  Maharashtra: ["Mumbai", "Pune"],
  Manipur: ["Imphal", "Churachandpur"],
  Meghalaya: ["Shillong", "Tura"],
  Mizoram: ["Aizawl", "Lunglei"],
  Nagaland: ["Kohima", "Dimapur"],
  Odisha: ["Bhubaneswar", "Cuttack"],
  Punjab: ["Ludhiana", "Amritsar"],
  Rajasthan: ["Jaipur", "Udaipur"],
  Sikkim: ["Gangtok", "Namchi"],
  "Tamil Nadu": ["Chennai", "Coimbatore"],
  Tripura: ["Agartala", "Dharmanagar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur"],
  Uttarakhand: ["Dehradun", "Haridwar"],
  "West Bengal": ["Kolkata", "Howrah"],
  "Andaman and Nicobar Islands": ["Port Blair", "Diglipur"],
  Chandigarh: ["Sector 17", "Manimajra"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Silvassa", "Daman"],
  "Jammu and Kashmir": ["Srinagar", "Jammu"],
  Ladakh: ["Leh", "Kargil"],
  Lakshadweep: ["Kavaratti", "Agatti"],
  Puducherry: ["Puducherry", "Karaikal"],
};

// Each MP (parliamentary) constituency groups several MLA wards. In real
// geography these two happen to share a name with their home ward, so the
// mapping below is deliberately simple for the demo.
export const MP_CONSTITUENCIES = [
  "Malkajgiri",
  "Mangalagiri",
  "Chandni Chowk",
  "West Delhi",
  "Itanagar",
  "Guwahati",
  "Patna",
  "Raipur",
  "Panaji",
  "Ahmedabad",
  "Gurugram",
  "Shimla",
  "Ranchi",
  "Bengaluru",
  "Thiruvananthapuram",
  "Bhopal",
  "Mumbai",
  "Imphal",
  "Shillong",
  "Aizawl",
  "Kohima",
  "Bhubaneswar",
  "Ludhiana",
  "Jaipur",
  "Gangtok",
  "Chennai",
  "Agartala",
  "Lucknow",
  "Dehradun",
  "Kolkata",
  "Port Blair",
  "Sector 17",
  "Silvassa",
  "Srinagar",
  "Leh",
  "Kavaratti",
  "Puducherry",
] as const;
export type MPConstituency = (typeof MP_CONSTITUENCIES)[number];

export const MP_CONSTITUENCY_BY_WARD: Record<string, MPConstituency> = {
  Malkajgiri: "Malkajgiri",
  Uppal: "Malkajgiri",
  Kapra: "Malkajgiri",
  Mangalagiri: "Mangalagiri",
  Tadepalli: "Mangalagiri",
  Thullur: "Mangalagiri",
  "Karol Bagh": "Chandni Chowk",
  "Chandni Chowk": "Chandni Chowk",
  Dwarka: "West Delhi",
  Itanagar: "Itanagar",
  Naharlagun: "Itanagar",
  Guwahati: "Guwahati",
  Dispur: "Guwahati",
  Patna: "Patna",
  Gaya: "Patna",
  Raipur: "Raipur",
  Bilaspur: "Raipur",
  Panaji: "Panaji",
  Margao: "Panaji",
  Ahmedabad: "Ahmedabad",
  Surat: "Ahmedabad",
  Gurugram: "Gurugram",
  Faridabad: "Gurugram",
  Shimla: "Shimla",
  Manali: "Shimla",
  Ranchi: "Ranchi",
  Jamshedpur: "Ranchi",
  Bengaluru: "Bengaluru",
  Mysuru: "Bengaluru",
  Thiruvananthapuram: "Thiruvananthapuram",
  Kochi: "Thiruvananthapuram",
  Bhopal: "Bhopal",
  Indore: "Bhopal",
  Mumbai: "Mumbai",
  Pune: "Mumbai",
  Imphal: "Imphal",
  Churachandpur: "Imphal",
  Shillong: "Shillong",
  Tura: "Shillong",
  Aizawl: "Aizawl",
  Lunglei: "Aizawl",
  Kohima: "Kohima",
  Dimapur: "Kohima",
  Bhubaneswar: "Bhubaneswar",
  Cuttack: "Bhubaneswar",
  Ludhiana: "Ludhiana",
  Amritsar: "Ludhiana",
  Jaipur: "Jaipur",
  Udaipur: "Jaipur",
  Gangtok: "Gangtok",
  Namchi: "Gangtok",
  Chennai: "Chennai",
  Coimbatore: "Chennai",
  Agartala: "Agartala",
  Dharmanagar: "Agartala",
  Lucknow: "Lucknow",
  Kanpur: "Lucknow",
  Dehradun: "Dehradun",
  Haridwar: "Dehradun",
  Kolkata: "Kolkata",
  Howrah: "Kolkata",
  "Port Blair": "Port Blair",
  Diglipur: "Port Blair",
  "Sector 17": "Sector 17",
  Manimajra: "Sector 17",
  Silvassa: "Silvassa",
  Daman: "Silvassa",
  Srinagar: "Srinagar",
  Jammu: "Srinagar",
  Leh: "Leh",
  Kargil: "Leh",
  Kavaratti: "Kavaratti",
  Agatti: "Kavaratti",
  Puducherry: "Puducherry",
  Karaikal: "Puducherry",
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

// Real district names for the 3 originally-seeded states; every other ward
// defaults to "<constituency> District", the same simplification already
// used for MP constituencies themselves.
const DISTRICT_OVERRIDES: Record<string, string> = {
  Malkajgiri: "Medchal–Malkajgiri District",
  Uppal: "Medchal–Malkajgiri District",
  Kapra: "Medchal–Malkajgiri District",
  Mangalagiri: "Guntur District",
  Tadepalli: "Guntur District",
  Thullur: "Guntur District",
  "Karol Bagh": "Central Delhi District",
  "Chandni Chowk": "Central Delhi District",
  Dwarka: "South West Delhi District",
};

export function districtForWard(ward: string): string {
  return (
    DISTRICT_OVERRIDES[ward] ?? `${MP_CONSTITUENCY_BY_WARD[ward] ?? ward} District`
  );
}

// Approximate real-world centers for each ward, used only to auto-match a
// citizen's GPS location to the nearest demo ward (no Geocoding API needed).
export const WARD_COORDS: Record<string, { lat: number; lng: number }> = {
  Malkajgiri: { lat: 17.4585, lng: 78.5063 },
  Uppal: { lat: 17.4009, lng: 78.5602 },
  Kapra: { lat: 17.4667, lng: 78.5667 },
  Mangalagiri: { lat: 16.4307, lng: 80.5525 },
  Tadepalli: { lat: 16.4823, lng: 80.6003 },
  Thullur: { lat: 16.5074, lng: 80.518 },
  "Karol Bagh": { lat: 28.6519, lng: 77.1909 },
  "Chandni Chowk": { lat: 28.6506, lng: 77.2303 },
  Dwarka: { lat: 28.5921, lng: 77.046 },
  Itanagar: { lat: 27.1, lng: 93.62 },
  Naharlagun: { lat: 27.1, lng: 93.7 },
  Guwahati: { lat: 26.14, lng: 91.74 },
  Dispur: { lat: 26.14, lng: 91.79 },
  Patna: { lat: 25.59, lng: 85.14 },
  Gaya: { lat: 24.8, lng: 85.0 },
  Raipur: { lat: 21.25, lng: 81.63 },
  Bilaspur: { lat: 22.09, lng: 82.15 },
  Panaji: { lat: 15.49, lng: 73.83 },
  Margao: { lat: 15.27, lng: 73.96 },
  Ahmedabad: { lat: 23.02, lng: 72.57 },
  Surat: { lat: 21.17, lng: 72.83 },
  Gurugram: { lat: 28.46, lng: 77.03 },
  Faridabad: { lat: 28.41, lng: 77.31 },
  Shimla: { lat: 31.1, lng: 77.17 },
  Manali: { lat: 32.24, lng: 77.19 },
  Ranchi: { lat: 23.34, lng: 85.31 },
  Jamshedpur: { lat: 22.8, lng: 86.18 },
  Bengaluru: { lat: 12.97, lng: 77.59 },
  Mysuru: { lat: 12.3, lng: 76.64 },
  Thiruvananthapuram: { lat: 8.52, lng: 76.94 },
  Kochi: { lat: 9.93, lng: 76.27 },
  Bhopal: { lat: 23.26, lng: 77.41 },
  Indore: { lat: 22.72, lng: 75.86 },
  Mumbai: { lat: 19.08, lng: 72.88 },
  Pune: { lat: 18.52, lng: 73.86 },
  Imphal: { lat: 24.82, lng: 93.94 },
  Churachandpur: { lat: 24.34, lng: 93.68 },
  Shillong: { lat: 25.58, lng: 91.89 },
  Tura: { lat: 25.52, lng: 90.2 },
  Aizawl: { lat: 23.73, lng: 92.72 },
  Lunglei: { lat: 22.89, lng: 92.74 },
  Kohima: { lat: 25.67, lng: 94.11 },
  Dimapur: { lat: 25.9, lng: 93.73 },
  Bhubaneswar: { lat: 20.3, lng: 85.82 },
  Cuttack: { lat: 20.47, lng: 85.88 },
  Ludhiana: { lat: 30.9, lng: 75.86 },
  Amritsar: { lat: 31.63, lng: 74.87 },
  Jaipur: { lat: 26.91, lng: 75.79 },
  Udaipur: { lat: 24.58, lng: 73.68 },
  Gangtok: { lat: 27.34, lng: 88.61 },
  Namchi: { lat: 27.17, lng: 88.36 },
  Chennai: { lat: 13.08, lng: 80.27 },
  Coimbatore: { lat: 11.02, lng: 76.97 },
  Agartala: { lat: 23.83, lng: 91.28 },
  Dharmanagar: { lat: 24.37, lng: 92.17 },
  Lucknow: { lat: 26.85, lng: 80.95 },
  Kanpur: { lat: 26.45, lng: 80.33 },
  Dehradun: { lat: 30.32, lng: 78.03 },
  Haridwar: { lat: 29.95, lng: 78.16 },
  Kolkata: { lat: 22.57, lng: 88.36 },
  Howrah: { lat: 22.59, lng: 88.31 },
  "Port Blair": { lat: 11.62, lng: 92.72 },
  Diglipur: { lat: 13.25, lng: 92.98 },
  "Sector 17": { lat: 30.74, lng: 76.78 },
  Manimajra: { lat: 30.72, lng: 76.83 },
  Silvassa: { lat: 20.27, lng: 73.02 },
  Daman: { lat: 20.42, lng: 72.83 },
  Srinagar: { lat: 34.08, lng: 74.79 },
  Jammu: { lat: 32.73, lng: 74.87 },
  Leh: { lat: 34.16, lng: 77.58 },
  Kargil: { lat: 34.56, lng: 76.13 },
  Kavaratti: { lat: 10.57, lng: 72.64 },
  Agatti: { lat: 10.85, lng: 72.19 },
  Puducherry: { lat: 11.94, lng: 79.83 },
  Karaikal: { lat: 10.92, lng: 79.83 },
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
