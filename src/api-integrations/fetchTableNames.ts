// API utility for fetching table names
export async function fetchTableNames() {
  const response = await fetch('https://mentify.srv880406.hstgr.cloud/api/tables', {
    headers: { 'accept': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to fetch table names');
  return response.json();
}
