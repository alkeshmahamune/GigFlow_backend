import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/smartleads";

function logMongoStartupWarning(error: unknown): void {
  console.error("\n==============================================");
  console.error("MongoDB startup warning:");
  console.error("- Failed to connect to the configured MongoDB instance.");
  console.error("- Please verify that MongoDB is running and reachable at:", MONGO_URI);
  console.error("- If you are using Docker, run: docker compose up --build");
  console.error("- Ensure your local `mongod` is listening on 127.0.0.1:27017 if not using a container.");
  console.error("- Check your .env MONGO_URI or the connection string used by the app.");
  console.error("- Actual error:", error);
  console.error("==============================================\n");
}

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI as string);
    console.log("MongoDB connected");
  } catch (originalError) {
    logMongoStartupWarning(originalError);

    if (MONGO_URI.includes("localhost")) {
      const fallbackUri = MONGO_URI.replace("localhost", "127.0.0.1");
      console.log(`Retrying MongoDB connection with ${fallbackUri}`);

      try {
        await mongoose.connect(fallbackUri);
        console.log("MongoDB connected on fallback URI");
        return;
      } catch (fallbackError) {
        logMongoStartupWarning(fallbackError);
      }
    }

    throw originalError;
  }
}
