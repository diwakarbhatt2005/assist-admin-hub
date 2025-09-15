// API utility for calculating commissions for specific transactions
// Usage: calculateCommissionsApi(tableName, operation, affectedRows)

export interface CommissionDetails {
  operation: string;
  table_name: string;
  rows_processed: number;
  calculation_timestamp: string;
  [key: string]: any;
}

export interface CommissionBreakdown {
  [key: string]: any;
}

export interface CalculateCommissionsResponse {
  success: boolean;
  total_commissions_paid: string;
  commission_breakdown: CommissionBreakdown[];
  pool_contributions: string;
  company_share: string;
  details: CommissionDetails;
  [key: string]: any;
}

export async function calculateCommissionsApi(
  tableName: string,
  operation: string,
  affectedRows: any[]
): Promise<CalculateCommissionsResponse> {
  const response = await fetch('https://mentify.srv880406.hstgr.cloud/api/calculate-commissions', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      table_name: tableName,
      operation,
      affected_rows: affectedRows,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail || 'Failed to calculate commissions');
  }
  return data;
}
