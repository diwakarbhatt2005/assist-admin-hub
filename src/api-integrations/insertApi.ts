// API utility for inserting new data into a table
// Usage: insertApi(tableName, [row1, row2, ...])

import { TABLE_TYPE_MAP } from './fetchTableData';

// API utility for inserting new data into a table
// Usage: insertApi(tableName, data, primaryKey)
export interface InsertOptions {
  // If true, convert null values to empty string for insert payloads.
  // Default: false (safer - omit null/empty so DB defaults or NULL apply)
  forceEmptyString?: boolean;
}

export async function insertApi(tableName: string, data: any[], primaryKey: string, options?: InsertOptions) {
  const { forceEmptyString = false } = options || {};
  // Clean each row: remove PK if blank/null/undefined. By default we omit null/empty fields (safer).
  // Only allow columns defined in the schema for this table
  const allowedCols = TABLE_TYPE_MAP[tableName] ? Object.keys(TABLE_TYPE_MAP[tableName]) : null;
  // Collect diagnostics: columns seen in original rows vs columns present in cleaned rows
  const origCols = new Set<string>();
  const cleanedCols = new Set<string>();

  const cleaned = data.map(row => {
    // Deep clone input row so we don't mutate caller objects and to have an original snapshot for debugging
    const originalRow = JSON.parse(JSON.stringify(row));
    Object.keys(originalRow).forEach(k => origCols.add(k));
    const cleanRow: any = {};
    if (allowedCols) {
      allowedCols.forEach(col => {
        let val = originalRow[col];
        // leave undefined out => DB default
        if (val === undefined) return;

        // Normalize strings: trim whitespace-only strings to empty string
        if (typeof val === 'string') {
          val = val.trim();
          // treat whitespace-only as empty
          if (val === '') {
            if (forceEmptyString) {
              cleanRow[col] = '';
            }
            return; // omit unless forceEmptyString
          }

          // Interpret explicit token "NULL" as a real null (case-insensitive)
          if (val.toLowerCase() === 'null') {
            // send explicit null to backend
            cleanRow[col] = null;
            cleanedCols.add(col);
            return;
          }
        }

        // Explicit null handling (non-string nulls)
        if (val === null) {
          if (forceEmptyString) {
            cleanRow[col] = '';
            cleanedCols.add(col);
          }
          return; // omit null unless forceEmptyString
        }

        // Preserve valid falsy values like 0 or false
        cleanRow[col] = val;
        cleanedCols.add(col);
      });
    } else {
      // fallback: include keys, honor options
      Object.keys(originalRow).forEach(key => {
        let val = originalRow[key];
        if (val === undefined) return;
        if (typeof val === 'string') {
          val = val.trim();
          if (val === '') {
            if (forceEmptyString) cleanRow[key] = '';
            return;
          }
        }
        if (val === null) {
          if (forceEmptyString) cleanRow[key] = '';
          return;
        }
        cleanRow[key] = val;
        cleanedCols.add(key);
      });
    }
    // Remove PK if blank/null/undefined
    // Remove primary key if blank so DB can auto-generate
    if (
      cleanRow[primaryKey] === undefined ||
      cleanRow[primaryKey] === null ||
      cleanRow[primaryKey] === ''
    ) {
      delete cleanRow[primaryKey];
    }

    // Debugging: show original vs cleaned row (minimal, helpful for tracing null propagation)
    try {
      console.log('[insertApi] originalRow:', originalRow, '=> cleanRow:', cleanRow);
    } catch (e) {
      /* ignore logging errors */
    }

    return cleanRow;
  });

  // Ensure each cleaned row has explicit keys for columns that exist in the schema
  // (or that appeared in the original CSV). Some backends expect a consistent
  // column set per row; omitting keys can lead to surprising behavior where a
  // single missing value affects column handling for the entire batch. We add
  // explicit null for missing cells so only that cell is null.
  try {
    const colsList = allowedCols && allowedCols.length ? allowedCols : Array.from(origCols);
    cleaned.forEach(r => {
      colsList.forEach(col => {
        if (col === primaryKey) return; // keep primaryKey omission behavior
        if (!(col in r)) {
          // mark missing cell explicitly as null so the backend treats it per-row
          r[col] = null;
        }
      });
    });
  } catch (e) {
    /* ignore - best-effort padding of rows */
  }

  // Diagnostic: compare columns seen in originals vs those present in cleaned rows
  try {
    const missingCols = [] as string[];
    origCols.forEach(c => {
      if (!cleanedCols.has(c)) missingCols.push(c);
    });
    if (missingCols.length > 0) {
      console.warn('[insertApi] Warning: the following columns were present in original rows but are missing from all cleaned rows (they may have been omitted because they were null/empty):', missingCols);
    }
  } catch (e) {
    /* ignore diagnostics errors */
  }
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
