// API utility for month-end calculation
// Usage: monthEndCalculationApi(calculationMonth: string, forceRecalculate: boolean)

export interface MonthEndCalcResponse {
  success: boolean;
  message: string;
  details: any;
}

export async function monthEndCalculationApi(calculationMonth: string, forceRecalculate = false): Promise<MonthEndCalcResponse> {
  if (!calculationMonth) throw new Error('calculationMonth is required');
  // Basic format validation: expect YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(calculationMonth)) {
    throw new Error('calculationMonth must be in YYYY-MM format');
  }

  const response = await fetch('https://mentify.srv880406.hstgr.cloud/api/monthly-calculations', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      calculation_month: calculationMonth,
      force_recalculate: !!forceRecalculate,
    }),
  });
  const resData = await response.json();
  if (!response.ok) {
    // Compose a helpful error message. Backend may return validation errors in resData.detail
    let errorMsg = 'Month-end calculation failed';
    if (resData && resData.detail) {
      if (typeof resData.detail === 'string') errorMsg = resData.detail;
      else if (Array.isArray(resData.detail)) errorMsg = JSON.stringify(resData.detail);
      else errorMsg = JSON.stringify(resData.detail);
    }
    throw new Error(errorMsg);
  }
  return resData;
}
