// Fetch table schema (columns, types, primary keys) from backend
export interface ColumnSchema {
  column_name: string;
  data_type: string;
  udt_name?: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  column_default?: string | null;
  character_maximum_length?: number | null;
  numeric_precision?: number | null;
  numeric_scale?: number | null;
  foreign_key?: any | null;
}

export interface TableSchema {
  table_name: string;
  columns: ColumnSchema[];
  primary_keys: string[];
}

export async function fetchTableSchema(tableName: string): Promise<TableSchema> {
  if (!tableName) throw new Error('tableName is required');
  const url = `https://mentify.srv880406.hstgr.cloud/api/tables/${tableName}/schema`;
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) {
    let msg = `Failed to fetch schema for ${tableName}`;
    try {
      const err = await res.json();
      if (err.detail) msg = err.detail;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}
