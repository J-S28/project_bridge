// One-off addition: a complaint genuinely stuck at MP level (escalation
// level 3), correctly timed this time (High priority threshold is 72h, so
// level 3 needs >= 3x72 = 216h since last update).
// Run with: node scripts/seed-extra-stuck.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
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

function hoursAgo(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

async function seed() {
  const cred = await signInWithEmailAndPassword(auth, "citizen.vikram@projectbridge.demo", "Demo@12345");
  const uid = cred.user.uid;
  const createdAt = hoursAgo(230);
  const updatedAt = hoursAgo(220);

  await addDoc(collection(db, "complaints"), {
    citizenId: uid,
    type: "Grievance",
    rawText: "Transformer fault has been reported multiple times, power keeps tripping every night in our lane.",
    imageUrls: [],
    location: { lat: 17.4667, lng: 78.5667, state: "Telangana", ward: "Kapra", constituencyMP: "Malkajgiri" },
    ai: {
      department: "Electricity",
      category: "Power Supply",
      subcategory: "Recurring Fault",
      priority: "High",
      sentiment: "Frustrated",
      summary: "Recurring nightly power trips from an unresolved transformer fault.",
      confidence: 0.9,
      escalateToRepresentative: false,
    },
    status: "In Progress",
    history: [
      { status: "Submitted", updatedBy: uid, updatedAt: createdAt },
      { status: "Acknowledged", updatedBy: "seed-officer", updatedAt: hoursAgo(225) },
      { status: "In Progress", updatedBy: "seed-officer", updatedAt },
    ],
    createdAt,
    updatedAt,
  });

  console.log("Seeded one MP-level-stuck complaint (Kapra, Electricity, level 3).");
  process.exit(0);
}

seed();
