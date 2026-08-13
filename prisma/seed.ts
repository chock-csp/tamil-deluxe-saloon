import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

const defaultPlaylists = [
  {
    order: 0,
    title: "Row 1 - 90s Evergreen Saloon Hits",
    description: "Iconic 90s cassette classics from Ilaiyaraaja, Deva, SPB & K.S. Chithra.",
    youtubeId: "PL9bw4S5AgFmP-Q84K_N6V4d0n4X7V8X9a",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DXa7aEa6s0nQe",
    ytMusicUrl: "https://music.youtube.com/playlist?list=PL9bw4S5AgFmP-Q84K_N6V4d0n4X7V8X9a",
    category: "90s Hits",
    trackCount: 25,
  },
  {
    order: 1,
    title: "Row 2 - 2000s Tea Kadai Melodies",
    description: "Warm piping hot tea & timeless melodies by A.R. Rahman, Vidyasagar & Hariharan.",
    youtubeId: "PLV_X8rZ20K4qY_F8K5t5d5z5e5r5t5y5",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DWYw4K5a5e5r5",
    ytMusicUrl: "https://music.youtube.com/playlist?list=PLV_X8rZ20K4qY_F8K5t5d5z5e5r5t5y5",
    category: "2000s Melodies",
    trackCount: 30,
  },
  {
    order: 2,
    title: "Row 3 - Mass Kuthu & Deva Gaana Special",
    description: "High energy 90s Chennai Gaana beats by Deva & SA Rajkumar.",
    youtubeId: "PL7dJzW4d3mX9_k8Y7z6W5v4U3t2S1r0",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX4t2S1r0nQe",
    ytMusicUrl: "https://music.youtube.com/playlist?list=PL7dJzW4d3mX9_k8Y7z6W5v4U3t2S1r0",
    category: "Gaana & Kuthu",
    trackCount: 20,
  },
  {
    order: 3,
    title: "Row 4 - Harris Jayaraj & Yuvan Barber Shop Magic",
    description: "Peak 2000s youth anthems and electric synth vibes from Harris & U1.",
    youtubeId: "PL8Y3Z2W1X0_9V8U7T6S5R4Q3P2O1N",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX3P2O1NnQe",
    ytMusicUrl: "https://music.youtube.com/playlist?list=PL8Y3Z2W1X0_9V8U7T6S5R4Q3P2O1N",
    category: "2000s Youth",
    trackCount: 28,
  },
  {
    order: 4,
    title: "Row 5 - 80s Vintage Radio Classics",
    description: "Golden analogue tape recordings from Ilaiyaraaja, SPB & S. Janaki.",
    youtubeId: "PL0A1B2C3D4E5F6G7H8I9J0K1L2M3N",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX1L2M3NnQe",
    ytMusicUrl: "https://music.youtube.com/playlist?list=PL0A1B2C3D4E5F6G7H8I9J0K1L2M3N",
    category: "80s Golden",
    trackCount: 35,
  },
  {
    order: 5,
    title: "Row 6 - Rainy Day Tea Shop Chill",
    description: "Soothing rain backdrop, warm ginger tea, and soul-stirring melodies.",
    youtubeId: "PL9M8N7O6P5Q4R3S2T1U0V9W8X7Y6Z",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX8X7Y6ZnQe",
    ytMusicUrl: "https://music.youtube.com/playlist?list=PL9M8N7O6P5Q4R3S2T1U0V9W8X7Y6Z",
    category: "Chill & Rain",
    trackCount: 22,
  },
  {
    order: 6,
    title: "Row 7 - Superstar & Thala-Thalapathy Mass Intros",
    description: "Adrenaline-filled hero intro tracks, trumpets, and whistle-worthy intro beats.",
    youtubeId: "PL1a2b3c4d5e6f7g8h9i0j1k2l3m4n",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX2l3m4nnQe",
    ytMusicUrl: "https://music.youtube.com/playlist?list=PL1a2b3c4d5e6f7g8h9i0j1k2l3m4n",
    category: "Mass Intros",
    trackCount: 24,
  },
  {
    order: 7,
    title: "Row 8 - Midnight Saloon Acoustic Hits",
    description: "Late night quiet barber shop vibes, soft flute solos, and acoustic guitar gems.",
    youtubeId: "PL5n6m7l8k9j0i1h2g3f4e5d6c7b8a",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX6c7b8anQe",
    ytMusicUrl: "https://music.youtube.com/playlist?list=PL5n6m7l8k9j0i1h2g3f4e5d6c7b8a",
    category: "Acoustic Night",
    trackCount: 20,
  },
  {
    order: 8,
    title: "Row 9 - 90s Kollywood Romantic Duets",
    description: "Heartwarming 90s duets sung by SPB, Sujatha, Hariharan & Swarnalatha.",
    youtubeId: "PLz1y2x3w4v5u6t7s8r9q0p1o2n3m4",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX1o2n3mnQe",
    ytMusicUrl: "https://music.youtube.com/playlist?list=PLz1y2x3w4v5u6t7s8r9q0p1o2n3m4",
    category: "90s Duets",
    trackCount: 26,
  },
  {
    order: 9,
    title: "Row 10 - 2000s Nostalgic College Hits",
    description: "Friendship songs, campus anthems, and nostalgia-drenched school memories.",
    youtubeId: "PL4a3b2c1d0e9f8g7h6i5j4k3l2m1n",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX3l2m1nnQe",
    ytMusicUrl: "https://music.youtube.com/playlist?list=PL4a3b2c1d0e9f8g7h6i5j4k3l2m1n",
    category: "2000s Campus",
    trackCount: 30,
  },
];

async function main() {
  console.log("🌱 Seeding Tamil Deluxe Saloon 10-row database...");

  // Seed Admin
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
  console.log(`✅ ${defaultPlaylists.length} Paired Playlist Rows seeded successfully!`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
