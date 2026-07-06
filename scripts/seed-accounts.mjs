// Seeds fixed demo accounts (8 department officers, 2 MLAs, 1 MP) so the
// demo video/pitch never needs a live signup or a credential hunt.
// Run with: node scripts/seed-accounts.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

const ACCOUNTS = [
  // Department officers
  { role: "officer", name: "Ravi Kumar", email: "officer.roads@projectbridge.demo", department: "Roads & Infrastructure", state: "Telangana", constituency: "Malkajgiri" },
  { role: "officer", name: "Lakshmi Devi", email: "officer.water@projectbridge.demo", department: "Water Supply", state: "Telangana", constituency: "Uppal" },
  { role: "officer", name: "Suresh Reddy", email: "officer.sanitation@projectbridge.demo", department: "Sanitation", state: "Telangana", constituency: "Malkajgiri" },
  { role: "officer", name: "Priya Sharma", email: "officer.electricity@projectbridge.demo", department: "Electricity", state: "Telangana", constituency: "Kapra" },
  { role: "officer", name: "Anil Rao", email: "officer.police@projectbridge.demo", department: "Police & Public Safety", state: "Andhra Pradesh", constituency: "Mangalagiri" },
  { role: "officer", name: "Kavitha Reddy", email: "officer.parks@projectbridge.demo", department: "Parks & Environment", state: "Andhra Pradesh", constituency: "Tadepalli" },
  { role: "officer", name: "Manoj Kumar", email: "officer.health@projectbridge.demo", department: "Health & Public Services", state: "Telangana", constituency: "Uppal" },
  { role: "officer", name: "Sunitha Rani", email: "officer.admin@projectbridge.demo", department: "General Administration", state: "Telangana", constituency: "Malkajgiri" },
  // Department heads (oversee one department across all wards in a constituency)
  { role: "department_head", name: "Krishna Murthy", email: "depthead.roads@projectbridge.demo", department: "Roads & Infrastructure", state: "Telangana", constituency: "Malkajgiri" },
  { role: "department_head", name: "Deepa Iyer", email: "depthead.health@projectbridge.demo", department: "Health & Public Services", state: "Telangana", constituency: "Malkajgiri" },
  // MLAs
  { role: "mla", name: "Venkat Rao", email: "mla.malkajgiri@projectbridge.demo", state: "Telangana", constituency: "Malkajgiri" },
  { role: "mla", name: "Padma Naidu", email: "mla.mangalagiri@projectbridge.demo", state: "Andhra Pradesh", constituency: "Mangalagiri" },
  // MP
  { role: "mp", name: "Dr. Ramesh Chandra", email: "mp.malkajgiri@projectbridge.demo", state: "Telangana", constituency: "Malkajgiri" },
];

async function seed() {
  const created = [];
  for (const account of ACCOUNTS) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, account.email, PASSWORD);
      const { role, name, email, department, state, constituency } = account;
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        email,
        name,
        role,
        ...(department ? { department } : {}),
        state,
        constituency,
        createdAt: new Date().toISOString(),
      });
      console.log(`Created ${account.role}: ${account.email}`);
      created.push(account);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        console.log(`Already exists, skipping: ${account.email}`);
        created.push(account);
      } else {
        console.error(`Failed to create ${account.email}:`, err.message);
      }
    }
  }

  const lines = [
    "# Demo Logins",
    "",
    `Fixed password for every account below: \`${PASSWORD}\``,
    "",
    "## Department Officers",
    "",
    "| Department | Ward | Email |",
    "|---|---|---|",
    ...ACCOUNTS.filter((a) => a.role === "officer").map(
      (a) => `| ${a.department} | ${a.constituency}, ${a.state} | ${a.email} |`
    ),
    "",
    "## Department Heads",
    "",
    "| Department | Constituency | Email |",
    "|---|---|---|",
    ...ACCOUNTS.filter((a) => a.role === "department_head").map(
      (a) => `| ${a.department} | ${a.constituency} | ${a.email} |`
    ),
    "",
    "## MLAs",
    "",
    "| Ward | Email |",
    "|---|---|",
    ...ACCOUNTS.filter((a) => a.role === "mla").map(
      (a) => `| ${a.constituency}, ${a.state} | ${a.email} |`
    ),
    "",
    "## MP",
    "",
    "| Constituency | Email |",
    "|---|---|",
    ...ACCOUNTS.filter((a) => a.role === "mp").map(
      (a) => `| ${a.constituency} | ${a.email} |`
    ),
    "",
  ];

  fs.writeFileSync(path.join(__dirname, "..", "DEMO_LOGINS.md"), lines.join("\n"));
  console.log("\nWrote DEMO_LOGINS.md");
  process.exit(0);
}

seed();
