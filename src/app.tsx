#!/usr/bin/env node
import { Box, render, useInput, type Key } from 'ink';
import { CustomSelect } from './CtxSelect.js';
import { GuideText } from './GuideText.js';
import { useState, useEffect } from 'react';
import { TextInput } from './TextInput.js';
import { assertUnreachable } from './utils.js';
import { loadOptions } from './persistence.js';
import { useDebouncedSave } from './useDebouncedSave.js';
import type { Item } from './types.js';

type ActionPatch =
	| { type: 'ADD'; value: string }
	| { type: 'COMPLETE'; value: string }
	| { type: 'UNCOMPLETE'; value: string }
	| { type: 'REMOVE'; value: string; previousState: 'active' | 'crossed'; index: number };

// Removed - now using persisted options

const App = () => {
	const [options, _setOptions] = useState<Item[]>([]);
	const [undoStack, setUndoStack] = useState<ActionPatch[]>([]);
	const [redoStack, setRedoStack] = useState<ActionPatch[]>([]);
	const [isAdding, setIsAdding] = useState(false);
	const [newValue, setNewValue] = useState('');

	// Load persisted options on startup
	useEffect(() => {
		loadOptions().then((loadedOptions) => {
			_setOptions(loadedOptions);
		});
	}, []);

	// Auto-save options with debouncing
	useDebouncedSave(options);

	const updateOption = (value: string, updater: (v: Item) => Item) => {
		_setOptions((currentOptions) => currentOptions.map((opt) => (opt.value === value ? updater(opt) : opt)));
	}

	const addOption = (opt: Item, index?: number) => {
		if (index === undefined) {
			_setOptions((currentOptions) => [...currentOptions, opt]);
		} else {
			_setOptions((currentOptions) => {
				const newOptions = [...currentOptions];
				newOptions.splice(index, 0, opt);
				return newOptions;
			});
		}
	}

	const removeOption = (value: string) => {
		_setOptions((currentOptions) => currentOptions.filter((opt) => opt.value !== value));
	}

	const executeAction = (patch: ActionPatch) => {
		// Clear redo stack when performing new action
		setRedoStack([]);
		setUndoStack((prevStack) => [...prevStack, patch]);
		switch (patch.type) {
			case 'ADD': {
				return addOption({ value: patch.value, state: 'active' });
			}
			case 'COMPLETE': {
				return updateOption(patch.value, (v) => ({ ...v, state: 'crossed' }));
			}
			case 'UNCOMPLETE': {
				return updateOption(patch.value, (v) => ({ ...v, state: 'active' }));
			}
			case 'REMOVE': {
				return removeOption(patch.value);
			}
			default: {
				assertUnreachable(patch);
			}
		}
	};

	const executeRemove = (value: string) => {
		const targetOption = options.find(opt => opt.value === value);
		const targetIndex = options.findIndex(opt => opt.value === value);
		if (!targetOption || targetIndex === -1) {
			return;
		}

		const removePatch: ActionPatch = {
			type: 'REMOVE',
			value,
			previousState: targetOption.state,
			index: targetIndex
		};
		executeAction(removePatch);
	};

	const handleUndo = () => {
		if (undoStack.length === 0) {
			return;
		}

		const lastPatch = undoStack.at(-1)!;
		setUndoStack((prevStack) => prevStack.slice(0, -1));
		setRedoStack((prevStack) => [...prevStack, lastPatch]);
		switch (lastPatch.type) {
			case 'ADD': {
				// Undo ADD: remove the added item
				return removeOption(lastPatch.value);
			}
			case 'COMPLETE': {
				// Undo COMPLETE: change back to active
				return updateOption(lastPatch.value, (v) => ({ ...v, state: 'active' }));
			}
			case 'UNCOMPLETE': {
				// Undo UNCOMPLETE: change back to crossed
				return updateOption(lastPatch.value, (v) => ({ ...v, state: 'crossed' }));
			}
			case 'REMOVE': {
				// Undo REMOVE: restore the item at its original index
				return addOption({ value: lastPatch.value, state: lastPatch.previousState }, lastPatch.index);
			}
			default: {
				assertUnreachable(lastPatch);
			}
		}
	};

	const handleRedo = () => {
		if (redoStack.length === 0) {
			return;
		}

		const patchToRedo = redoStack.at(-1)!;
		setRedoStack((prevStack) => prevStack.slice(0, -1));
		setUndoStack((prevStack) => [...prevStack, patchToRedo]);
		switch (patchToRedo.type) {
			case 'ADD': {
				return addOption({ value: patchToRedo.value, state: 'active' });
			}
			case 'COMPLETE': {
				return updateOption(patchToRedo.value, (v) => ({ ...v, state: 'crossed' }));
			}
			case 'UNCOMPLETE': {
				return updateOption(patchToRedo.value, (v) => ({ ...v, state: 'active' }));
			}
			case 'REMOVE': {
				return removeOption(patchToRedo.value);
			}
			default: {
				assertUnreachable(patchToRedo);
			}
		}
	};

	const guideActions = [
		{ name: 'Add', key: 'A' },
		{ name: 'Complete/Remove', key: 'Del' },
		{ name: 'Undo', key: 'Z' },
		{ name: 'Redo', key: 'Y' }
	];

	useInput(
		(_, key) => {
			if (key.escape) {
				setIsAdding(false);
				setNewValue('');
			}
			return;
		},
		{ isActive: isAdding },
	);

	useInput(
		(input) => {
			if (input === 'a' || input === 'A') {
				setIsAdding(true);
			} else if (input === 'z' || input === 'Z') {
				handleUndo();
			} else if (input === 'y' || input === 'Y') {
				handleRedo();
			}
		},
		{ isActive: !isAdding },
	);

	const onSelect = (value: string, key: Key) => {
		if (!(key.return || key.delete)) {
			return;
		}

		const selectedOption = options.find(opt => opt.value === value)!;

		if (key.return) {
			if (selectedOption.state === 'active') {
				executeAction({ type: 'COMPLETE', value });
			} else {
				executeAction({ type: 'UNCOMPLETE', value });
			}
		} else if (key.delete) {
			if (selectedOption.state === 'active') {
				executeAction({ type: 'COMPLETE', value });
			} else {
				executeRemove(value);
			}
		}
	};

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<GuideText actions={guideActions} />
			</Box>
			<Box>
				<CustomSelect
					options={options.map((opt) => ({
						strikethrough: opt.state === 'crossed',
						value: opt.value,
					}))}
					visibleOptionCount={10}
					onSelect={onSelect}
					isDisabled={isAdding}
				/>
			</Box>
			<Box marginTop={1}>
				<TextInput
					focus={isAdding}
					placeholder={isAdding ? "Enter new option..." : undefined}
					value={newValue}
					onChange={(val) => setNewValue(val)}
					onSubmit={() => {
						if (newValue.trim() && !options.some((x) => x.value === newValue)) {
							executeAction({ type: 'ADD', value: newValue });
						}
						setIsAdding(false);
						setNewValue('');
					}}
				/>
			</Box>
		</Box>
	);
};

render(<App />);
