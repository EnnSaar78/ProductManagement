import { db, newId, schema } from "./index";
import { hashPassword } from "../lib/password";
import { eq } from "drizzle-orm";

const [email, password, name, role] = process.argv.slice(2);
if (!email || !password) {
  console.error('Kasutus: npm run user:create -- <email> <parool> "<Nimi>" [admin|editor|viewer]');
  process.exit(1);
}
if (password.length < 10) {
  console.error("Parool peab olema vähemalt 10 märki.");
  process.exit(1);
}
const r = (role ?? "admin") as "admin" | "editor" | "viewer";
const existing = db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).get();
const passwordHash = hashPassword(password);
if (existing) {
  db.update(schema.users).set({ passwordHash, role: r, name: name ?? existing.name, active: true }).where(eq(schema.users.id, existing.id)).run();
  console.log(`Kasutaja ${email} uuendatud (roll: ${r}).`);
} else {
  db.insert(schema.users).values({ id: newId(), email: email.toLowerCase(), name: name ?? email, passwordHash, role: r }).run();
  console.log(`Kasutaja ${email} loodud (roll: ${r}).`);
}
