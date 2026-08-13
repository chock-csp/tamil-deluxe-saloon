import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const defaultPlaylists = [
  {
    order: 0,
    title: "90s Evergreen Barber Shop Hits",
    description: "Iconic 90s cassette classics from Ilaiyaraaja, Deva, SPB & K.S. Chithra playing on the vintage shop speaker.",
    youtubeId: "PL9bw4S5AgFmP-Q84K_N6V4d0n4X7V8X9a",
    category: "90s Classics",
    trackCount: 25,
    coverUrl: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&w=600&q=80",
  },
  {
    order: 1,
    title: "2000s Tea Kadai Melodies",
    description: "Warm piping hot tea & timeless melodies by A.R. Rahman, Vidyasagar & Hariharan.",
    youtubeId: "PLV_X8rZ20K4qY_F8K5t5d5z5e5r5t5y5",
    category: "2000s Melodies",
    trackCount: 30,
    coverUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
  },
  {
    order: 2,
    title: "Mass Kuthu & Deva Gaana Special",
    description: "High energy 90s Chennai Gaana beats by Deva, SA Rajkumar & Thenisai Thendral specials.",
    youtubeId: "PL7dJzW4d3mX9_k8Y7z6W5v4U3t2S1r0",
    category: "Gaana & Kuthu",
    trackCount: 20,
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
  },
  {
    order: 3,
    title: "Harris Jayaraj & Yuvan Barber Shop Magic",
    description: "Peak 2000s youth anthems, acoustic guitar intros, and electric synth vibes from Harris & U1.",
    youtubeId: "PL8Y3Z2W1X0_9V8U7T6S5R4Q3P2O1N",
    category: "2000s Youth",
    trackCount: 28,
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
  },
  {
    order: 4,
    title: "80s Vintage Radio Classics",
    description: "Golden analogue tape recordings from Ilaiyaraaja, SPB & S. Janaki on Ceylon Radio.",
    youtubeId: "PL0A1B2C3D4E5F6G7H8I9J0K1L2M3N",
    category: "80s Golden",
    trackCount: 35,
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80",
  },
  {
    order: 5,
    title: "Rainy Day Tea Shop Chill",
    description: "Soothing rain backdrop, warm ginger tea, and soul-stirring melodies for quiet afternoons.",
    youtubeId: "PL9M8N7O6P5Q4R3S2T1U0V9W8X7Y6Z",
    category: "Chill & Rain",
    trackCount: 22,
    coverUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80",
  },
  {
    order: 6,
    title: "Superstar & Thala-Thalapathy Mass Intros",
    description: "Adrenaline-filled hero intro tracks, trumpets, and whistle-worthy intro beats.",
    youtubeId: "PL1a2b3c4d5e6f7g8h9i0j1k2l3m4n",
    category: "Mass Intros",
    trackCount: 24,
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
  },
  {
    order: 7,
    title: "Midnight Saloon Acoustic Hits",
    description: "Late night quiet barber shop vibes, soft flute solos, and acoustic guitar gems.",
    youtubeId: "PL5n6m7l8k9j0i1h2g3f4e5d6c7b8a",
    category: "Acoustic Night",
    trackCount: 20,
    coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80",
  },
  {
    order: 8,
    title: "90s Kollywood Romantic Duets",
    description: "Heartwarming 90s duets sung by SPB, Sujatha, Hariharan & Swarnalatha.",
    youtubeId: "PLz1y2x3w4v5u6t7s8r9q0p1o2n3m4",
    category: "90s Duets",
    trackCount: 26,
    coverUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80",
  },
  {
    order: 9,
    title: "2000s Nostalgic College Hits",
    description: "Friendship songs, campus anthems, and nostalgia-drenched memories of school & college days.",
    youtubeId: "PL4a3b2c1d0e9f8g7h6i5j4k3l2m1n",
    category: "2000s Campus",
    trackCount: 30,
    coverUrl: "https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?auto=format&fit=crop&w=600&q=80",
  },
];

async function main() {
  console.log("🌱 Seeding Tamil Deluxe Saloon database...");

  // Seed Default Admin
  const password = process.env.ADMIN_INITIAL_PASSWORD || "saloon123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { username: "admin" },
    update: { passwordHash },
    create: {
      username: "admin",
      passwordHash,
    },
  });
  console.log("✅ Admin user initialized (username: admin)");

  // Seed Site Settings
  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      liveListenerBase: 48,
      sponsorBannerEnabled: true,
      adSenseEnabled: true,
      adSensePublisherId: "ca-pub-1234567890123456",
      bannerText: "வணக்கம்! தமிழ் டீ கடை & சலூன் 90s/2000s Hits 💈☕ 24/7 Retro Radio",
      spotifyUrl: "https://open.spotify.com",
      ytMusicUrl: "https://music.youtube.com",
    },
  });
  console.log("✅ Site settings initialized");

  // Seed Playlists
  await prisma.playlist.deleteMany({});
  for (const item of defaultPlaylists) {
    await prisma.playlist.create({
      data: item,
    });
  }
  console.log(`✅ ${defaultPlaylists.length} Daily Playlists seeded successfully!`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
