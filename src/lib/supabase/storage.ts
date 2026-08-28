export function normalizeAssetStoragePath(storagePath: string): string {
  if (!storagePath.includes("/storage/v1/object/")) return storagePath;
  const path = storagePath.split("/assets/")[1] ?? storagePath;
  return decodeURIComponent(path.split("?")[0]);
}
