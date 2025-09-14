// Calls the short monthly report API and triggers file download
export async function downloadShortMonthReport(reportMonth: string, includeInactiveUsers: boolean = true) {
	// Validate format YYYY-MM
	if (!/^\d{4}-\d{2}$/.test(reportMonth)) {
		throw new Error(`Invalid report_month format: ${reportMonth}. Expected YYYY-MM e.g. 2025-09`);
	}
	const url = 'https://mentify.srv880406.hstgr.cloud/api/download-short-monthly-report';
	const body = {
		report_month: reportMonth,
		include_inactive_users: includeInactiveUsers,
	};
	console.log('[downloadShortMonthReport] Sending:', body);
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'accept': 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		let errorMsg = 'Failed to download short report';
		try {
			const err = await response.json();
			if (err.detail) errorMsg = err.detail;
		} catch {}
		console.error('[downloadShortMonthReport] Error:', errorMsg);
		throw new Error(errorMsg);
	}
	// Get filename from content-disposition header
	const disposition = response.headers.get('content-disposition');
	let filename = 'short_monthly_report.pdf';
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
