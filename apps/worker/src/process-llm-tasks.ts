import { getDb } from "@portfolio/db/client";
import { processNextPendingTask, setGlobalDb } from "../../../packages/llm/src/task-runner";

/**
 * Worker entry point for processing LLM tasks.
 * Processes pending tasks in a loop or single pass based on command-line flags.
 */

const SLEEP_INTERVAL_MS = 5000; // Check every 5 seconds

async function main() {
  console.log("Starting LLM Task Worker...");
  
  const db = getDb();
  setGlobalDb(db);

  const singleProcess = process.argv.includes("--single") || process.argv.includes("-s");
  console.log(singleProcess ? "Running single pass..." : "Running in continuous mode...");

  try {
    let processedCount = 0;
    
    while (true) {
      const taskId = await processNextPendingTask({ db });
      
      if (taskId) {
        processedCount++;
        console.log(`Processed task: ${taskId}`);
      } else {
        console.log("No pending tasks found.");
        if (singleProcess) {
          break;
        }
      }

      // Only sleep if we didn't process a task
      if (!taskId && !singleProcess) {
        await new Promise((resolve) => setTimeout(resolve, SLEEP_INTERVAL_MS));
      }
    }

    console.log(`Worker finished. Processed ${processedCount} tasks.`);
  } catch (error) {
    console.error("Worker error:", error);
    process.exit(1);
  }
}

main();
