// Seeds ~16 realistic demo complaints across wards/departments/statuses, with
// hand-authored AI classifications (skips the live Gemini call for seed data
// to conserve API quota) and two deliberately old-timestamped cases so the
// escalation feature is visibly demoable without waiting real days.
// Run with: node scripts/seed-complaints.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
}

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const PASSWORD = "Demo@12345";
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const CITIZENS = [
  { email: "citizen.anjali@projectbridge.demo", name: "Anjali Reddy" },
  { email: "citizen.vikram@projectbridge.demo", name: "Vikram Singh" },
  { email: "citizen.fatima@projectbridge.demo", name: "Fatima Begum" },
];

const WARD_COORDS = {
  Malkajgiri: { lat: 17.4585, lng: 78.5063, state: "Telangana" },
  Uppal: { lat: 17.4009, lng: 78.5602, state: "Telangana" },
  Kapra: { lat: 17.4667, lng: 78.5667, state: "Telangana" },
  Mangalagiri: { lat: 16.4307, lng: 80.5525, state: "Andhra Pradesh" },
  Tadepalli: { lat: 16.4823, lng: 80.6003, state: "Andhra Pradesh" },
  Thullur: { lat: 16.5074, lng: 80.518, state: "Andhra Pradesh" },
};
const MP_CONSTITUENCY_BY_WARD = {
  Malkajgiri: "Malkajgiri",
  Uppal: "Malkajgiri",
  Kapra: "Malkajgiri",
  Mangalagiri: "Mangalagiri",
  Tadepalli: "Mangalagiri",
  Thullur: "Mangalagiri",
};

function hoursAgo(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

function location(ward) {
  const c = WARD_COORDS[ward];
  return { lat: c.lat, lng: c.lng, state: c.state, ward, constituencyMP: MP_CONSTITUENCY_BY_WARD[ward] };
}

function complaint({
  citizenIdx,
  type = "Grievance",
  ward,
  rawText,
  department,
  category,
  subcategory,
  priority,
  sentiment,
  summary,
  escalateToRepresentative = false,
  escalationReason,
  status,
  createdHoursAgo,
  updatedHoursAgo,
  proofPhoto = false,
}) {
  const createdAt = hoursAgo(createdHoursAgo);
  const updatedAt = hoursAgo(updatedHoursAgo);
  const history = [{ status: "Submitted", updatedBy: "__CITIZEN__", updatedAt: createdAt }];
  if (status !== "Submitted") {
    history.push({
      status,
      updatedBy: "__OFFICER__",
      updatedAt,
      ...(proofPhoto ? { proofImageUrls: [TINY_PNG] } : {}),
    });
  }

  return {
    citizenIdx,
    type,
    rawText,
    imageUrls: [],
    location: location(ward),
    ai: {
      department,
      category,
      subcategory,
      priority,
      sentiment,
      summary,
      confidence: 0.9,
      escalateToRepresentative,
      ...(escalationReason ? { escalationReason } : {}),
    },
    status,
    history,
    createdAt,
    updatedAt,
  };
}

const COMPLAINTS = [
  complaint({
    citizenIdx: 0, ward: "Malkajgiri", department: "Roads & Infrastructure",
    rawText: "Deep pothole near the Ring Road bus stop, two-wheelers keep skidding.",
    category: "Road Maintenance", subcategory: "Pothole", priority: "Critical", sentiment: "Urgent",
    summary: "Deep pothole near Ring Road bus stop causing two-wheeler accidents.",
    status: "In Progress", createdHoursAgo: 30, updatedHoursAgo: 10,
  }),
  complaint({
    citizenIdx: 1, ward: "Malkajgiri", department: "Sanitation",
    rawText: "Garbage truck hasn't come to our street in over a week.",
    category: "Waste Collection", subcategory: "Missed Collection", priority: "High", sentiment: "Frustrated",
    summary: "Garbage collection missed for over a week on residential street.",
    status: "Pending Citizen Confirmation", createdHoursAgo: 60, updatedHoursAgo: 4, proofPhoto: true,
  }),
  complaint({
    citizenIdx: 2, ward: "Malkajgiri", department: "General Administration",
    rawText: "Street lighting on the whole colony road has been dark for days, feels unsafe at night.",
    category: "Public Safety", subcategory: "Poor Lighting", priority: "Medium", sentiment: "Neutral",
    summary: "Colony road street lighting non-functional, unsafe at night.",
    status: "Acknowledged", createdHoursAgo: 40, updatedHoursAgo: 20,
  }),
  complaint({
    citizenIdx: 0, ward: "Malkajgiri", type: "Suggestion", department: "General Administration",
    rawText: "We could really use a small community library in Malkajgiri for students.",
    category: "Community Development", subcategory: "New Facilities Request", priority: "Low", sentiment: "Suggestion",
    summary: "Suggestion for a new community library to support local students.",
    escalateToRepresentative: true,
    escalationReason: "New facility construction, requires budget allocation.",
    status: "Submitted", createdHoursAgo: 15, updatedHoursAgo: 15,
  }),

  complaint({
    citizenIdx: 1, ward: "Uppal", department: "Water Supply",
    rawText: "No piped water supply for the third day in our block.",
    category: "Water Supply", subcategory: "Supply Interruption", priority: "Critical", sentiment: "Urgent",
    summary: "No piped water supply for three consecutive days.",
    status: "Escalated", createdHoursAgo: 20, updatedHoursAgo: 6,
  }),
  complaint({
    citizenIdx: 2, ward: "Uppal", department: "Health & Public Services",
    rawText: "The local PHC has no doctor available most mornings, had to travel far for a checkup.",
    category: "Healthcare Access", subcategory: "Staff Shortage", priority: "High", sentiment: "Frustrated",
    summary: "Local PHC frequently has no doctor available in the mornings.",
    // Deliberately old — crosses into MP-level stuck (Critical/High threshold math below)
    status: "Acknowledged", createdHoursAgo: 100, updatedHoursAgo: 80,
  }),
  complaint({
    citizenIdx: 0, ward: "Uppal", type: "Suggestion", department: "General Administration",
    rawText: "Please build a vocational training centre in Uppal, our youth have nowhere to learn trade skills nearby.",
    category: "Skill Development", subcategory: "New Facilities Request", priority: "Medium", sentiment: "Suggestion",
    summary: "Suggestion to build a vocational training centre for local youth.",
    escalateToRepresentative: true,
    escalationReason: "New vocational infrastructure, requires capital investment.",
    status: "Submitted", createdHoursAgo: 12, updatedHoursAgo: 12,
  }),

  complaint({
    citizenIdx: 1, ward: "Kapra", department: "Electricity",
    rawText: "Frequent unannounced power cuts every evening for the past week.",
    category: "Power Supply", subcategory: "Unscheduled Outage", priority: "High", sentiment: "Frustrated",
    summary: "Frequent unannounced evening power cuts over the past week.",
    status: "In Progress", createdHoursAgo: 35, updatedHoursAgo: 8,
  }),
  complaint({
    citizenIdx: 2, ward: "Kapra", department: "Electricity",
    rawText: "Transformer near the school has been sparking, quite dangerous.",
    category: "Power Supply", subcategory: "Faulty Equipment", priority: "Critical", sentiment: "Urgent",
    summary: "Sparking transformer near school poses safety hazard.",
    status: "Resolved", createdHoursAgo: 90, updatedHoursAgo: 2,
  }),
  complaint({
    citizenIdx: 0, ward: "Kapra", department: "Electricity",
    rawText: "Streetlights on the main road stay off even after evening, reported before but not fixed.",
    category: "Power Supply", subcategory: "Non-functional Streetlight", priority: "Medium", sentiment: "Frustrated",
    summary: "Main road streetlights non-functional despite an earlier report.",
    status: "Reopened", createdHoursAgo: 150, updatedHoursAgo: 3,
  }),

  complaint({
    citizenIdx: 1, ward: "Mangalagiri", department: "Police & Public Safety",
    rawText: "Speeding vehicles near the school gate, no speed breakers or signage.",
    category: "Road Safety", subcategory: "Traffic Enforcement", priority: "High", sentiment: "Urgent",
    summary: "Speeding traffic near school gate lacks speed breakers or signage.",
    status: "Acknowledged", createdHoursAgo: 25, updatedHoursAgo: 15,
  }),
  complaint({
    citizenIdx: 2, ward: "Mangalagiri", type: "Suggestion", department: "Parks & Environment",
    rawText: "A public sports ground would help the youth here, we currently share one small ground between three colonies.",
    category: "Recreation", subcategory: "New Facilities Request", priority: "Low", sentiment: "Suggestion",
    summary: "Suggestion for a new public sports ground to serve local youth.",
    escalateToRepresentative: true,
    escalationReason: "New recreational infrastructure, requires land and budget allocation.",
    status: "Submitted", createdHoursAgo: 18, updatedHoursAgo: 18,
  }),

  complaint({
    citizenIdx: 0, ward: "Tadepalli", department: "Parks & Environment",
    rawText: "The community park has broken swings and no maintenance for months.",
    category: "Park Maintenance", subcategory: "Broken Equipment", priority: "Low", sentiment: "Neutral",
    summary: "Community park swings broken, unmaintained for months.",
    status: "Pending Citizen Confirmation", createdHoursAgo: 70, updatedHoursAgo: 5, proofPhoto: true,
  }),
  complaint({
    citizenIdx: 1, ward: "Tadepalli", type: "Suggestion", department: "Health & Public Services",
    rawText: "Tadepalli badly needs its own hospital, right now everyone travels 7km for even basic care.",
    category: "Healthcare Access", subcategory: "New Facilities Request", priority: "High", sentiment: "Suggestion",
    summary: "Suggestion for a new local hospital to reduce long travel for care.",
    escalateToRepresentative: true,
    escalationReason: "New healthcare facility, requires significant capital investment.",
    status: "Submitted", createdHoursAgo: 10, updatedHoursAgo: 10,
  }),

  complaint({
    citizenIdx: 2, ward: "Thullur", department: "Roads & Infrastructure",
    rawText: "Drainage overflow onto the main road every time it rains.",
    category: "Drainage", subcategory: "Overflow", priority: "Medium", sentiment: "Frustrated",
    summary: "Drainage overflow floods main road during rain.",
    status: "Closed", createdHoursAgo: 200, updatedHoursAgo: 1,
  }),
  complaint({
    citizenIdx: 0, ward: "Thullur", department: "Water Supply",
    rawText: "Water tastes and smells odd the last few days, worried about contamination.",
    category: "Water Quality", subcategory: "Contamination Concern", priority: "High", sentiment: "Urgent",
    summary: "Citizens report odd taste/smell in water supply, contamination concern.",
    status: "Submitted", createdHoursAgo: 8, updatedHoursAgo: 8,
  }),
];

async function getUidFor(citizen) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, citizen.email, PASSWORD);
    return cred.user.uid;
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      const cred = await signInWithEmailAndPassword(auth, citizen.email, PASSWORD);
      return cred.user.uid;
    }
    throw err;
  }
}

async function seed() {
  const byCitizen = new Map();
  for (const c of COMPLAINTS) {
    if (!byCitizen.has(c.citizenIdx)) byCitizen.set(c.citizenIdx, []);
    byCitizen.get(c.citizenIdx).push(c);
  }

  for (const [idx, complaints] of byCitizen) {
    const citizen = CITIZENS[idx];
    const uid = await getUidFor(citizen);
    console.log(`Signed in as ${citizen.email}, seeding ${complaints.length} complaints...`);

    for (const c of complaints) {
      const { citizenIdx, ...data } = c;
      data.citizenId = uid;
      data.history = data.history.map((h) => ({
        ...h,
        updatedBy: h.updatedBy === "__CITIZEN__" ? uid : "seed-officer",
      }));
      await addDoc(collection(db, "complaints"), data);
    }

    await signOut(auth);
  }

  console.log(`\nSeeded ${COMPLAINTS.length} complaints across ${byCitizen.size} citizens.`);
  process.exit(0);
}

seed();
