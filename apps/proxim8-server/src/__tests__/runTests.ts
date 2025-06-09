/**
 * Test runner script for manual testing during development
 *
 * Usage: npm run test:dev
 */

import { spawn } from "child_process";
import path from "path";

const runTests = () => {
  console.log("🧪 Starting Express server tests...\n");

  const jestPath = path.join(__dirname, "../../node_modules/.bin/jest");
  const testProcess = spawn("node", [jestPath, "--verbose", "--coverage"], {
    stdio: "inherit",
    cwd: path.join(__dirname, "../../.."),
  });

  testProcess.on("close", (code) => {
    if (code === 0) {
      console.log("\n✅ All tests passed!");
    } else {
      console.log(`\n❌ Tests failed with code ${code}`);
      process.exit(code);
    }
  });

  testProcess.on("error", (error) => {
    console.error("❌ Failed to start test process:", error);
    process.exit(1);
  });
};

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Test run interrupted");
  process.exit(0);
});

runTests();
