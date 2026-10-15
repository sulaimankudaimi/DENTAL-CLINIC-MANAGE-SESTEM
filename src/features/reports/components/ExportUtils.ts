/**
 * Utilities for exporting tabular data to Excel (CSV with UTF-8 BOM) and printing
 */

export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  metadataRows?: string[]
): void {
  const processCell = (val: string | number): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows: string[] = [];

  // Write filter metadata header if provided
  if (metadataRows && metadataRows.length > 0) {
    for (const meta of metadataRows) {
      csvRows.push(processCell(meta));
    }
    csvRows.push(''); // blank row separator
  }

  csvRows.push(headers.map(processCell).join(','));

  for (const row of rows) {
    csvRows.push(row.map(processCell).join(','));
  }

  const csvString = csvRows.join('\r\n');
  // UTF-8 BOM (\uFEFF) ensures Excel opens Arabic correctly
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function triggerPrint(): void {
  window.print();
}
