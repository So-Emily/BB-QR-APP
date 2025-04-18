export const fetchScans = async (userId: string) => {
  if (!userId) throw new Error("❌ userId is missing in fetchScans!");

  const res = await fetch(`/api/scans/fetch-scans?userId=${userId}&includeTop=true`);
  if (!res.ok) throw new Error("Failed to fetch scan data");

  const data = await res.json();
  console.log("Fetched scan data:", data);

  return {
    scanData: data.scanData ?? [],
    topItem: data.topItem ?? null,
    topStore: data.topStore ?? null,
  };
};
