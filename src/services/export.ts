/* ============================================================
   LeadScaper Pro — Export Service
   ============================================================ */

import type { Lead, ExportFormat, ExportRecord, FilterState, BusinessHours } from '@/types';
import { addExportRecord } from './database';
import { generateId } from '@/utils/constants';

/**
 * Export leads to the specified format and trigger download.
 */
export async function exportLeads(
  leads: Lead[],
  format: ExportFormat,
  filters?: FilterState | null
): Promise<void> {
  let blob: Blob;
  let fileName: string;
  const timestamp = new Date().toISOString().split('T')[0];

  switch (format) {
    case 'csv':
      blob = generateCSV(leads);
      fileName = `leadscaper-export-${timestamp}.csv`;
      break;
    case 'xlsx':
      blob = await generateXLSX(leads);
      fileName = `leadscaper-export-${timestamp}.xlsx`;
      break;
    case 'json':
      blob = generateJSON(leads);
      fileName = `leadscaper-export-${timestamp}.json`;
      break;
  }

  // Trigger download
  downloadBlob(blob, fileName);

  // Record export
  const record: ExportRecord = {
    id: generateId(),
    format,
    leadCount: leads?.length || 0,
    fileName,
    exportedAt: new Date().toISOString(),
    filters: filters ?? null,
  };
  await addExportRecord(record);
}

/**
 * Generate CSV blob from leads.
 */
function generateCSV(leads: Lead[]): Blob {
  const headers = [
    'S.No', 'Business Name', 'Category', 'Rating', 'Reviews', 'Phone',
    'Website', 'Email(s)', 'Full Address', 'City', 'State',
    'Postal Code', 'Country', 'Google Maps URL', 'Latitude', 'Longitude',
    'Status', 'Business Hours', 'Facebook', 'Instagram', 'LinkedIn',
    'Twitter', 'YouTube', 'Scraped At',
  ];

  const rows = (leads || []).map((lead, index) => [
    (index + 1).toString(),
    escapeCsvField(lead.businessName),
    escapeCsvField(lead.category),
    lead.rating?.toString() ?? '',
    lead.reviewCount?.toString() ?? '',
    escapeCsvField(lead.phone ?? ''),
    escapeCsvField(lead.website ?? ''),
    escapeCsvField((lead.emails || []).join('; ')),
    escapeCsvField(lead.fullAddress ?? ''),
    escapeCsvField(lead.city ?? ''),
    escapeCsvField(lead.state ?? ''),
    escapeCsvField(lead.postalCode ?? ''),
    escapeCsvField(lead.country ?? ''),
    escapeCsvField(lead.googleMapsUrl ?? ''),
    lead.latitude?.toString() ?? '',
    lead.longitude?.toString() ?? '',
    lead.status,
    lead.businessHours ? formatBusinessHours(lead.businessHours) : '',
    escapeCsvField(lead.socialMedia.facebook ?? ''),
    escapeCsvField(lead.socialMedia.instagram ?? ''),
    escapeCsvField(lead.socialMedia.linkedin ?? ''),
    escapeCsvField(lead.socialMedia.twitter ?? ''),
    escapeCsvField(lead.socialMedia.youtube ?? ''),
    lead.scrapedAt,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Generate XLSX blob from leads.
 */
async function generateXLSX(leads: Lead[]): Promise<Blob> {
  // Dynamically import xlsx to keep bundle smaller
  const XLSX = await import('xlsx');

  const worksheetData = (leads || []).map((lead, index) => ({
    'S.No': index + 1,
    'Business Name': lead.businessName,
    'Category': lead.category,
    'Rating': lead.rating ?? '',
    'Reviews': lead.reviewCount ?? '',
    'Phone': lead.phone ?? '',
    'Website': lead.website ?? '',
    'Email(s)': (lead.emails || []).join('; '),
    'Full Address': lead.fullAddress ?? '',
    'City': lead.city ?? '',
    'State': lead.state ?? '',
    'Postal Code': lead.postalCode ?? '',
    'Country': lead.country ?? '',
    'Google Maps URL': lead.googleMapsUrl ?? '',
    'Latitude': lead.latitude ?? '',
    'Longitude': lead.longitude ?? '',
    'Status': lead.status,
    'Facebook': lead.socialMedia.facebook ?? '',
    'Instagram': lead.socialMedia.instagram ?? '',
    'LinkedIn': lead.socialMedia.linkedin ?? '',
    'Twitter': lead.socialMedia.twitter ?? '',
    'YouTube': lead.socialMedia.youtube ?? '',
    'Scraped At': lead.scrapedAt,
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

  // Auto-size columns
  const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({
    wch: Math.max(key.length, 15),
  }));
  worksheet['!cols'] = colWidths;

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Generate JSON blob from leads.
 */
function generateJSON(leads: Lead[]): Blob {
  const jsonContent = JSON.stringify(leads, null, 2);
  return new Blob([jsonContent], { type: 'application/json' });
}

/**
 * Copy selected leads to clipboard as tab-separated text.
 */
export async function copyLeadsToClipboard(leads: Lead[]): Promise<void> {
  const headers = ['S.No', 'Business Name', 'Category', 'Rating', 'Phone', 'Website', 'Email', 'Address'];
  const rows = (leads || []).map((l, index) => [
    (index + 1).toString(), l.businessName, l.category, l.rating?.toString() ?? '',
    l.phone ?? '', l.website ?? '', l.emails?.[0] ?? '', l.fullAddress ?? '',
  ].join('\t'));

  const text = [headers.join('\t'), ...rows].join('\n');
  await navigator.clipboard.writeText(text);
}

/* -------------------------------------------------------
   Helpers
   ------------------------------------------------------- */

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function formatBusinessHours(hours: BusinessHours): string {
  return Object.entries(hours)
    .filter(([, v]) => v)
    .map(([day, time]) => `${day}: ${time}`)
    .join(' | ');
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
