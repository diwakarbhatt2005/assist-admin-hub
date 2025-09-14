// Calls the monthly report API and triggers file download
export async function downloadFullMonthReport(reportMonth: string, includeInactiveUsers = false) {
  const url = 'https://mentify.srv880406.hstgr.cloud/api/download-monthly-report';
  const body = {
    report_month: reportMonth,
    include_inactive_users: includeInactiveUsers,
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let errorMsg = 'Failed to download report';
    try {
      const err = await response.json();
      if (err.detail) errorMsg = err.detail;
    } catch {}
    throw new Error(errorMsg);
  }
  // Get filename from content-disposition header
  const disposition = response.headers.get('content-disposition');
  let filename = 'monthly_report.pdf';
  if (disposition) {
    const match = disposition.match(/filename=([^;]+)/);
    if (match) filename = match[1];
  }
  const blob = await response.blob();
  const urlBlob = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = urlBlob;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(urlBlob);
}
