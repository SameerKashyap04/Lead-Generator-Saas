import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { CampaignRecipient } from '@/types';

export interface ParseResult {
  data: Partial<CampaignRecipient>[];
  errors: string[];
}

/**
 * Normalizes a phone number to standard E.164-like format for WhatsApp.
 * Strips spaces, brackets, hyphens, and the plus sign.
 */
export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[\s\(\)\-\+]/g, '').replace(/\D/g, ''); // Keep only digits
}

/**
 * Detects if a lead is a duplicate based on phone, email, or website.
 */
export function isDuplicate(lead: Partial<CampaignRecipient>, existingSet: Set<string>): boolean {
  if (lead.phone) {
    const normPhone = normalizePhone(lead.phone);
    if (normPhone && existingSet.has(`phone:${normPhone}`)) return true;
  }
  if (lead.email && existingSet.has(`email:${lead.email.toLowerCase()}`)) return true;
  if (lead.website && existingSet.has(`website:${lead.website.toLowerCase()}`)) return true;
  return false;
}

/**
 * Adds a lead's identifying features to the existing set for duplicate detection.
 */
export function addToDuplicateSet(lead: Partial<CampaignRecipient>, existingSet: Set<string>) {
  if (lead.phone) {
    const normPhone = normalizePhone(lead.phone);
    if (normPhone) existingSet.add(`phone:${normPhone}`);
  }
  if (lead.email) existingSet.add(`email:${lead.email.toLowerCase()}`);
  if (lead.website) existingSet.add(`website:${lead.website.toLowerCase()}`);
}

/**
 * Parses a CSV File.
 */
export async function parseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = Array.isArray(results.data) ? results.data : [];
        resolve({
          data: parsedData as Partial<CampaignRecipient>[],
          errors: results.errors.map(e => e.message),
        });
      },
      error: (error) => {
        resolve({ data: [], errors: [error.message] });
      }
    });
  });
}

/**
 * Parses an Excel (.xlsx) File.
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Partial<CampaignRecipient>>(worksheet);
        const parsedData = Array.isArray(json) ? json : [];
        resolve({ data: parsedData, errors: [] });
      } catch (error: any) {
        resolve({ data: [], errors: [error.message || 'Failed to parse Excel file'] });
      }
    };
    reader.onerror = () => {
      resolve({ data: [], errors: ['Failed to read file'] });
    };
    reader.readAsBinaryString(file);
  });
}

/**
 * Parses a JSON File.
 */
export async function parseJsonFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const json = JSON.parse(data);
        if (Array.isArray(json)) {
          resolve({ data: json as Partial<CampaignRecipient>[], errors: [] });
        } else {
          resolve({ data: [], errors: ['JSON root must be an array'] });
        }
      } catch (error: any) {
        resolve({ data: [], errors: [error.message || 'Invalid JSON format'] });
      }
    };
    reader.onerror = () => {
      resolve({ data: [], errors: ['Failed to read file'] });
    };
    reader.readAsText(file);
  });
}
