import { useEffect, useRef } from 'react';
import type { Item } from './types.js';
import { saveOptions } from './persistence.js';

export const useDebouncedSave = (options: Item[], delay = 3000) => {
	const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

	useEffect(() => {
		// Don't save if options is empty (initial state)
		if (options.length === 0) {
			return;
		}

		// Clear any existing timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		// Set new timeout to save after delay
		timeoutRef.current = setTimeout(async () => {
			await saveOptions(options);
		}, delay);

		// Cleanup function to clear timeout on unmount
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [options, delay]);

	// Save on unmount (app close)
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			// Save immediately when unmounting if there are options
			if (options.length > 0) {
				saveOptions(options);
			}
		};
	}, [options]);
}
