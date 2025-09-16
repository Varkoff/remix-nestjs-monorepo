import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedUser = {
  name: string;
  email: string;
  passwordHash: string;
};

const PRESET_USERS: Array<{ name: string; email: string }> = [
  { name: "Jean Dupont", email: "jean.dupont+seed@coupdepouce.test" },
  { name: "Marie Curie", email: "marie.curie+seed@coupdepouce.test" },
  { name: "Paul Martin", email: "paul.martin+seed@coupdepouce.test" },
  { name: "Sophie Bernard", email: "sophie.bernard+seed@coupdepouce.test" },
  { name: "Luc Moreau", email: "luc.moreau+seed@coupdepouce.test" },
  { name: "Emma Lefevre", email: "emma.lefevre+seed@coupdepouce.test" },
  { name: "Hugo Garcia", email: "hugo.garcia+seed@coupdepouce.test" },
  { name: "Chloé Lambert", email: "chloe.lambert+seed@coupdepouce.test" },
  { name: "Louis Fontaine", email: "louis.fontaine+seed@coupdepouce.test" },
  { name: "Camille Mercier", email: "camille.mercier+seed@coupdepouce.test" },
  { name: "Nathan Garnier", email: "nathan.garnier+seed@coupdepouce.test" },
  { name: "Léa Faure", email: "lea.faure+seed@coupdepouce.test" },
  { name: "Julien Caron", email: "julien.caron+seed@coupdepouce.test" },
  { name: "Manon Chevalier", email: "manon.chevalier+seed@coupdepouce.test" },
  { name: "Mathis Lucas", email: "mathis.lucas+seed@coupdepouce.test" },
  { name: "Inès Robin", email: "ines.robin+seed@coupdepouce.test" },
  { name: "Tom Robert", email: "tom.robert+seed@coupdepouce.test" },
  { name: "Clara Gaillard", email: "clara.gaillard+seed@coupdepouce.test" },
  { name: "Noah Guerin", email: "noah.guerin+seed@coupdepouce.test" },
  { name: "Sarah Masson", email: "sarah.masson+seed@coupdepouce.test" },
];

const CATEGORIES = [
  "jardinage",
  "bricolage",
  "ménage",
  "cuisine",
  "garde d'enfants",
  "cours particuliers",
  "aide administrative",
  "informatique",
  "coaching sportif",
  "photographie",
  "musique",
  "déménagement",
  "livraison",
  "promenade d'animaux",
  "montage de meubles",
  "peinture",
  "plomberie légère",
  "électricité légère",
  "traduction",
  "rédaction",
] as const;

const SERVICE_DESCRIPTIONS = [
  "Service entre particuliers, flexible et au juste prix.",
  "Intervention rapide, sérieuse et conviviale.",
  "Matériel fourni si besoin, échanges simples et sécurisés.",
  "Expérience confirmée, satisfaction garantie.",
  "Idéal pour un coup de pouce près de chez vous.",
  "Horaires souples, adaptation à vos contraintes.",
  "Conseils personnalisés et suivi.",
  "Tarif transparent, sans surprise.",
];

const ADJECTIFS = [
  "rapide",
  "soigné",
  "fiable",
  "efficace",
  "sympa",
  "professionnel",
  "minutieux",
  "ponctuel",
  "attentionné",
  "rigoureux",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildTitle(): string {
  const cat = pick(CATEGORIES);
  const adj = pick(ADJECTIFS);
  // Ex: "Aide jardinage - service rapide et soigné"
  return `Aide ${cat} — service ${adj}`;
}

function buildDescription(): string {
  const d1 = pick(SERVICE_DESCRIPTIONS);
  const d2 = pick(SERVICE_DESCRIPTIONS);
  const d3 = pick(SERVICE_DESCRIPTIONS);
  return `${d1} ${d2} ${d3}`;
}

async function upsertUsers(): Promise<string[]> {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("motdepasse123", salt);

  const created = await Promise.all(
    PRESET_USERS.map(async (u) => {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name, password: passwordHash },
        create: { name: u.name, email: u.email, password: passwordHash },
        select: { id: true },
      });
      return user.id;
    })
  );

  return created;
}

async function main(): Promise<void> {
  const count = Number(process.env.SEED_OFFERS_COUNT ?? 1000);
  // Ensure we have a stable pool of users to attach offers to
  const userIds = await upsertUsers();

  // Generate 1000 distinct prices from 10.00€ upward, +0.01€ each
  // Guarantees uniqueness and realism for a P2P service marketplace
  const baseCents = 1000; // 10.00€

  const offerRows: Array<{
    title: string;
    description: string;
    price: number;
    active: boolean;
    recurring: boolean;
    userId: string;
  }> = [];

  for (let i = 0; i < count; i++) {
    const priceCents = baseCents + i; // unique price each time
    const price = Math.round(priceCents) / 100;
    const userId = userIds[i % userIds.length];

    offerRows.push({
      title: buildTitle(),
      description: buildDescription(),
      price,
      active: true,
      recurring: true,
      userId,
    });
  }

  // Clean up previous seed (optional): we keep idempotency by not deleting; prices are unique per run
  // Using createMany for performance
  const result = await prisma.offer.createMany({ data: offerRows });

  // eslint-disable-next-line no-console
  console.log(`✅ Création d'offres terminée: ${result.count} offres créées.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("❌ Erreur lors du seed des offres:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


