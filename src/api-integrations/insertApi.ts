// API utility for inserting new data into a table
// Usage: insertApi(tableName, [row1, row2, ...])

import { TABLE_TYPE_MAP } from './fetchTableData';

// API utility for inserting new data into a table
// Usage: insertApi(tableName, data, primaryKey)
export async function insertApi(tableName: string, data: any[], primaryKey: string) {
  // Clean each row: remove PK if blank/null/undefined, but allow null values for other fields
  // Only allow columns defined in the schema for this table
  const allowedCols = TABLE_TYPE_MAP[tableName] ? Object.keys(TABLE_TYPE_MAP[tableName]) : null;
  const cleaned = data.map(row => {
    const cleanRow: any = {};
    if (allowedCols) {
      allowedCols.forEach(col => {
        if (
          row[col] !== null &&
          row[col] !== undefined &&
          row[col] !== ''
        ) {
          cleanRow[col] = row[col];
        }
      });
    } else {
      // fallback: old logic if schema not found
      Object.keys(row).forEach(key => {
        if (row[key] !== null && row[key] !== undefined && row[key] !== '') {
          cleanRow[key] = row[key];
        }
      });
    }
    // Remove PK if blank/null/undefined
    if (
      cleanRow[primaryKey] === undefined ||
      cleanRow[primaryKey] === null ||
      cleanRow[primaryKey] === ''
    ) {
      delete cleanRow[primaryKey];
    }
    return cleanRow;
  });
  const payload = {
    table_name: tableName,
    data: cleaned,
  };
  console.log('[insertApi] Sending payload:', payload);
  const response = await fetch('https://mentify.srv880406.hstgr.cloud/api/tables/insert', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let errorMsg = 'Failed to insert data';
    try {
      const err = await response.json();
      console.error('[insertApi] Error response:', err);
      if (err.detail) errorMsg = err.detail;
    } catch (e) {
      console.error('[insertApi] Error parsing error response:', e);
    }
    throw new Error(errorMsg);
  }
  return response.json();
}
