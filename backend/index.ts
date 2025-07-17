// This file is deprecated. The new server is in server.ts
// Run: bun run server.ts

console.log("⚠️  Please use 'bun run server.ts' instead of 'bun run index.ts'");
console.log("🚀 Starting Auto-Toon Backend server...");

// Import and start the new server
import('./server.js').then((module) => {
  console.log("✅ Server started successfully!");
}).catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
