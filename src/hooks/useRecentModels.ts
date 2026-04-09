import { useCallback, useEffect, useState } from "react";
import { get, set, del } from "idb-keyval";
import type { RecentModel, LoadedModel } from "@/types";

const STORAGE_KEY = "recent-models";
const MAX_RECENT = 20;

async function getRecent(): Promise<RecentModel[]> {
  const data = await get<RecentModel[]>(STORAGE_KEY);
  return data ?? [];
}

async function saveRecent(models: RecentModel[]): Promise<void> {
  await set(STORAGE_KEY, models.slice(0, MAX_RECENT));
}

export function useRecentModels() {
  const [recents, setRecents] = useState<RecentModel[]>([]);

  // Load on mount
  useEffect(() => {
    getRecent().then(setRecents);
  }, []);

  const addRecent = useCallback(
    async (model: LoadedModel, thumbnail: string) => {
      const entry: RecentModel = {
        id: `${model.info.name}-${Date.now()}`,
        name: model.info.name,
        format: model.info.format,
        fileSize: model.info.fileSize,
        date: Date.now(),
        thumbnail,
      };

      const updated = [entry, ...recents.filter((r) => r.name !== model.info.name)].slice(
        0,
        MAX_RECENT
      );
      setRecents(updated);
      await saveRecent(updated);
    },
    [recents]
  );

  const clearRecent = useCallback(async () => {
    setRecents([]);
    await del(STORAGE_KEY);
  }, []);

  return { recents, addRecent, clearRecent };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}
