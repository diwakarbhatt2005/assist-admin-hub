// API utility for inserting new data into a table
// Usage: insertApi(tableName, [row1, row2, ...])

// API utility for inserting new data into a table
// Usage: insertApi(tableName, data, primaryKey)
export async function insertApi(tableName: string, data: any[], primaryKey: string) {
  // Clean each row: remove PK if blank/null/undefined
  const cleaned = data.map(row => {
    const cleanRow = { ...row };
    if (
      cleanRow[primaryKey] === undefined ||
      cleanRow[primaryKey] === null ||
      cleanRow[primaryKey] === ''
    ) {
      delete cleanRow[primaryKey];
    }
    // Remove empty/null/undefined fields
    Object.keys(cleanRow).forEach(key => {
      if (cleanRow[key] === null || cleanRow[key] === undefined || cleanRow[key] === '') {
        delete cleanRow[key];
      }
    });
    return cleanRow;
  });
  const response = await fetch('https://mentify.srv880406.hstgr.cloud/api/tables/insert', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      table_name: tableName,
      data: cleaned,
    }),
  });
  if (!response.ok) {
    let errorMsg = 'Failed to insert data';
    try {
      const err = await response.json();
      if (err.detail) errorMsg = err.detail;
    } catch {}
    throw new Error(errorMsg);
  }
  return response.json();
}
