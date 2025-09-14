#!/usr/bin/env node
import { Box, render, useInput, type Key } from 'ink';
import { CustomSelect } from './CtxSelect.js';
import { GuideText } from './GuideText.js';
import { useState } from 'react';
import { TextInput } from './TextInput.js';

type Option = {
	value: string;
	state: 'active' | 'crossed';
};

type ActionPatch =
	| { type: 'ADD'; value: string }
	| { type: 'COMPLETE'; value: string }
	| { type: 'UNCOMPLETE'; value: string }
	| { type: 'REMOVE'; value: string; previousState: 'active' | 'crossed'; index: number };

const ALL_OPTIONS = [
	{
		value: 'START',
	},
	{
		value: 'EXIT',
	},
	{
		value: 'SETTINGS',
	},
];

const App = () => {
	const [options, setOptions] = useState<Option[]>(ALL_OPTIONS.map((opt) => ({ ...opt, state: 'active' as const })));
	const [undoStack, setUndoStack] = useState<ActionPatch[]>([]);
	const [isAdding, setIsAdding] = useState(false);
	const [newValue, setNewValue] = useState('');

	const executeAction = (patch: ActionPatch) => {
		setUndoStack((prevStack) => [...prevStack, patch]);
		setOptions((currentOptions) => {
			switch (patch.type) {
				case 'ADD': {
					return [...currentOptions, { value: patch.value, state: 'active' as const }];
				}
				case 'COMPLETE': {
					return currentOptions.map((opt) =>
						opt.value === patch.value ? { ...opt, state: 'crossed' as const } : opt
					);
				}
				case 'UNCOMPLETE': {
					return currentOptions.map((opt) =>
						opt.value === patch.value ? { ...opt, state: 'active' as const } : opt
					);
				}
				case 'REMOVE': {
					return currentOptions.filter((opt) => opt.value !== patch.value);
				}
				default:
					return currentOptions;
			}
		});
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
		setOptions((currentOptions) => {
			switch (lastPatch.type) {
				case 'ADD': {
					// Undo ADD: remove the added item
					return currentOptions.filter((opt) => opt.value !== lastPatch.value);
				}
				case 'COMPLETE': {
					// Undo COMPLETE: change back to active
					return currentOptions.map((opt) =>
						opt.value === lastPatch.value ? { ...opt, state: 'active' as const } : opt
					);
				}
				case 'UNCOMPLETE': {
					// Undo UNCOMPLETE: change back to crossed
					return currentOptions.map((opt) =>
						opt.value === lastPatch.value ? { ...opt, state: 'crossed' as const } : opt
					);
				}
				case 'REMOVE': {
					// Undo REMOVE: restore the item at its original index
					const newOptions = [...currentOptions];
					newOptions.splice(lastPatch.index, 0, {
						value: lastPatch.value,
						state: lastPatch.previousState
					});
					return newOptions;
				}
				default:
					return currentOptions;
			}
		});
		setUndoStack((prevStack) => prevStack.slice(0, -1));
	};

	const guideActions = [
		{ name: 'Add', key: 'A' },
		{ name: 'Complete/Remove', key: 'Del' },
		{ name: 'Undo', key: 'Z' }
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
			}
			if (input === 'z' || input === 'Z') {
				handleUndo();
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
