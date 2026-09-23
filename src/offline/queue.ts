import { openDB, DBSchema } from "idb";
import { QueuedOfflineReport } from "../types";

interface RescueChainDB extends DBSchema {
  offlineReports: {
    key: string;
    value: QueuedOfflineReport;
    indexes: { "by-date": string };
  };
}

const DB_NAME = "rescuechain-offline-db";
const DB_VERSION = 1;

async function getDB() {
  return openDB<RescueChainDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("offlineReports")) {
        const store = db.createObjectStore("offlineReports", { keyPath: "clientId" });
        store.createIndex("by-date", "reportedAt");
      }
    }
  });
}

export async function queueOfflineReport(report: QueuedOfflineReport): Promise<void> {
  const db = await getDB();
  await db.put("offlineReports", report);
}

export async function getQueuedOfflineReports(): Promise<QueuedOfflineReport[]> {
  const db = await getDB();
  return db.getAllFromIndex("offlineReports", "by-date");
}

export async function removeQueuedReport(clientId: string): Promise<void> {
  const db = await getDB();
  await db.delete("offlineReports", clientId);
}

export async function getQueuedCount(): Promise<number> {
  const db = await getDB();
  return db.count("offlineReports");
}
