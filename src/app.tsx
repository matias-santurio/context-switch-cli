#!/usr/bin/env node
import { Box, render, useInput, type Key } from 'ink';
import { CustomSelect } from './CtxSelect.js';
import { GuideText } from './GuideText.js';
import { useState } from 'react';
import { TextInput } from './TextInput.js';

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
	const [options, setOptions] = useState(ALL_OPTIONS.map((opt) => ({ ...opt, state: 'active' })));
	const [isAdding, setIsAdding] = useState(false);
	const [newValue, setNewValue] = useState('');

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
		},
		{ isActive: !isAdding },
	);

	const onSelect = (value: string, key: Key) => {
		if (!(key.return || key.delete)) {
			return;
		}
		setOptions((prevOptions) => {
			const newOptions: {
				value: string;
				state: string;
			}[] = [];
			for (const opt of prevOptions) {
				if (opt.value === value) {
					if (key.return) {
						newOptions.push({ ...opt, state: opt.state === 'active' ? 'crossed' : 'active' });
					} else if (key.delete) {
						if (opt.state === 'active') {
							newOptions.push({ ...opt, state: 'crossed' });
						}
						// Else, delete row
					} else {
						newOptions.push(opt);
					}
				} else {
					newOptions.push(opt);
				}
			}
			return newOptions;
		});
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
						if (!options.some((x) => x.value === newValue)) {
							setOptions((prev) => [...prev, { value: newValue, state: 'active' }]);
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
