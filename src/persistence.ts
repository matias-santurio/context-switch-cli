import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { Item } from './types.js';

type PersistedState = {
	version: number;
	timestamp: string;
	options: Item[];
};

const DEFAULT_OPTIONS: Item[] = [
	{ value: 'Schedule call with supervisor', state: 'active' },
	{ value: 'Count the pixels of my screen', state: 'active' },
	{ value: 'Update toaster firmware', state: 'active' },
];

export function getConfigPath(): string {
	return join(homedir(), '.ctx-switch.json');
}

export async function saveOptions(options: Item[]): Promise<void> {
	try {
		const configPath = getConfigPath();
		const tempPath = `${configPath}.tmp`;

		const state: PersistedState = {
			version: 1,
			timestamp: new Date().toISOString(),
			options,
		};

		// Atomic write: write to temp file, then rename
		await fs.writeFile(tempPath, JSON.stringify(state, null, 2), 'utf8');
		await fs.rename(tempPath, configPath);
	} catch (_error) {
		// Don't throw - app should continue working even if save fails
	}
}

export async function loadOptions(): Promise<Item[]> {
	const configPath = getConfigPath();
	let fileContent: string;
	try {
		fileContent = await fs.readFile(configPath, 'utf8');
	}
	catch {
		// If file doesn't exist, return default options
		return DEFAULT_OPTIONS
	}
	const parsed: PersistedState = JSON.parse(fileContent);

	// Validate the loaded data
	if (
		typeof parsed === 'object' &&
		parsed !== null &&
		Array.isArray(parsed.options) &&
		parsed.options.every(
			(opt) =>
				typeof opt === 'object' &&
				typeof opt.value === 'string' &&
				(opt.state === 'active' || opt.state === 'crossed'),
		)
	) {
		return parsed.options;
	}
	throw new Error('Invalid format');
}
