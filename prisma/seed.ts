import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Seed a predictable admin, organizer, and a published sample event so the
// examiner has working credentials and data to explore on first load.
async function main() {
  const passwordHash = await bcrypt.hash("Password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@pulse.app" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@pulse.app",
      passwordHash,
      role: "ADMIN",
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@pulse.app" },
    update: {},
    create: {
      name: "Ama Owusu",
      email: "organizer@pulse.app",
      passwordHash,
      role: "ORGANIZER",
    },
  });

  // A ready-made, published event with a dynamic form and benefits.
  const existing = await prisma.event.findFirst({
    where: { slug: { startsWith: "founders-mixer" } },
  });

  if (!existing) {
    const event = await prisma.event.create({
      data: {
        title: "Founders Mixer 2026",
        slug: "founders-mixer-demo1",
        description:
          "An evening for early-stage founders and operators to meet, swap notes, and grab a drink. Register at the door to confirm your seat and claim your welcome perk.",
        venue: "Accra Digital Centre",
        status: "PUBLISHED",
        organizerId: organizer.id,
        formSchema: [
          { key: "full_name", label: "Full name", type: "text", required: true },
          { key: "email", label: "Email", type: "email", required: true },
          { key: "phone", label: "Phone", type: "phone", required: false },
          {
            key: "role",
            label: "What best describes you?",
            type: "select",
            required: true,
            options: ["Founder", "Investor", "Operator", "Student"],
          },
        ],
        benefits: [
          { label: "Welcome drink", detail: "One drink of your choice at the bar" },
          { label: "Raffle entry", detail: "Automatic entry into the door prize" },
        ],
      },
    });

    // A few sample registrations and scans so analytics is not empty.
    const codes = ["PLS-7KQ4-M9TX", "PLS-2BRC-84LP", "PLS-QW9F-3HTN"];
    for (let i = 0; i < codes.length; i++) {
      await prisma.registration.create({
        data: {
          eventId: event.id,
          code: codes[i],
          redeemed: i === 0,
          redeemedAt: i === 0 ? new Date() : null,
          data: {
            full_name: ["Kojo Mensah", "Efua Boateng", "Yaw Darko"][i],
            email: ["kojo@example.com", "efua@example.com", "yaw@example.com"][i],
            role: ["Founder", "Operator", "Student"][i],
          },
        },
      });
    }
    await prisma.scanEvent.createMany({
      data: Array.from({ length: 7 }).map(() => ({ eventId: event.id })),
    });
  }

  console.log("Seed complete.");
  console.log("  Admin     -> admin@pulse.app / Password123");
  console.log("  Organizer -> organizer@pulse.app / Password123");
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
