// Seeded per-ward demographic dataset — stands in for Census/NFHS/data.gov.in
// in production (BUILD_SPEC.md §5). Numbers are illustrative placeholders,
// deliberately varied so the priority-ranking feature has something real to
// reason about; swap for live data later without changing the shape.
export interface WardDemographics {
  ward: string;
  schoolEnrollment: number;
  distanceToNearestFacilityKm: number;
  infraGapScore: number; // 0-100, higher = more underserved
  existingFacilities: string[];
}

export const WARD_DEMOGRAPHICS: Record<string, WardDemographics> = {
  Malkajgiri: {
    ward: "Malkajgiri",
    schoolEnrollment: 4200,
    distanceToNearestFacilityKm: 3.2,
    infraGapScore: 45,
    existingFacilities: ["Primary School", "Government Hospital", "Bus Depot"],
  },
  Uppal: {
    ward: "Uppal",
    schoolEnrollment: 6100,
    distanceToNearestFacilityKm: 5.8,
    infraGapScore: 68,
    existingFacilities: ["Primary School"],
  },
  Kapra: {
    ward: "Kapra",
    schoolEnrollment: 3300,
    distanceToNearestFacilityKm: 2.1,
    infraGapScore: 30,
    existingFacilities: ["Primary School", "PHC", "Vocational Training Centre"],
  },
  Mangalagiri: {
    ward: "Mangalagiri",
    schoolEnrollment: 5400,
    distanceToNearestFacilityKm: 4.5,
    infraGapScore: 55,
    existingFacilities: ["Primary School", "PHC"],
  },
  Tadepalli: {
    ward: "Tadepalli",
    schoolEnrollment: 7200,
    distanceToNearestFacilityKm: 6.9,
    infraGapScore: 72,
    existingFacilities: ["Primary School"],
  },
  Thullur: {
    ward: "Thullur",
    schoolEnrollment: 2800,
    distanceToNearestFacilityKm: 1.5,
    infraGapScore: 25,
    existingFacilities: [
      "Primary School",
      "Government Hospital",
      "Vocational Training Centre",
      "Community Park",
    ],
  },
};
