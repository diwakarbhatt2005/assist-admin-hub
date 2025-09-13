// API utility for month-end calculation
// Usage: monthEndCalculationApi(calculationMonth: string, forceRecalculate: boolean)

export interface MonthEndCalcResponse {
  success: boolean;
  message: string;
  details: any;
}

export async function monthEndCalculationApi(calculationMonth: string, forceRecalculate = false): Promise<MonthEndCalcResponse> {
  if (!calculationMonth) throw new Error('calculationMonth is required');
  const response = await fetch('https://mentify.srv880406.hstgr.cloud/api/monthendcalapi', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      calculation_month: calculationMonth,
      force_recalculate: forceRecalculate,
    }),
  });
  const resData = await response.json();
  if (!response.ok) {
    let errorMsg = 'Month-end calculation failed';
    if (resData && resData.detail) errorMsg = typeof resData.detail === 'string' ? resData.detail : JSON.stringify(resData.detail);
    throw new Error(errorMsg);
  }
  return resData;
}
