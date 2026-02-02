import * as fs from 'fs';
import type { FirebaseServiceAccountJson, FirebaseWebConfig } from '../types.js';

/**
 * Validate Firebase Service Account JSON structure
 */
export function validateServiceAccountJson(data: unknown): data is FirebaseServiceAccountJson {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  return (
    obj.type === 'service_account' &&
    typeof obj.project_id === 'string' &&
    typeof obj.private_key === 'string' &&
    typeof obj.client_email === 'string' &&
    typeof obj.private_key === 'string' &&
    (obj.private_key as string).includes('-----BEGIN PRIVATE KEY-----')
  );
}

/**
 * Validate Firebase Web SDK config structure
 */
export function validateWebConfig(data: unknown): data is FirebaseWebConfig {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.apiKey === 'string' &&
    typeof obj.authDomain === 'string' &&
    typeof obj.projectId === 'string' &&
    typeof obj.storageBucket === 'string' &&
    typeof obj.messagingSenderId === 'string' &&
    typeof obj.appId === 'string'
  );
}

/**
 * Read and parse a JSON file
 */
export function readJsonFile<T>(filePath: string): T | null {
  try {
    const resolvedPath = filePath.replace(/^~/, process.env.HOME || '');
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Extract service account config from JSON file
 */
export function extractServiceAccountConfig(json: FirebaseServiceAccountJson) {
  return {
    projectId: json.project_id,
    clientEmail: json.client_email,
    privateKey: json.private_key,
  };
}

/**
 * Encode web config for URL parameter (base64url encoding)
 */
export function encodeWebConfigForUrl(config: FirebaseWebConfig): string {
  const json = JSON.stringify(config);
  return Buffer.from(json, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate the web dashboard URL with embedded config
 */
export function generateDashboardUrl(config: FirebaseWebConfig): string {
  const encodedConfig = encodeWebConfigForUrl(config);
  return `https://claude-insights.vercel.app/?config=${encodedConfig}`;
}
