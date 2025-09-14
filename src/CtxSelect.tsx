import { useEffect, useState } from 'react';
import { Box, Text, useInput, type Key } from 'ink';

export type CustomOption = {
	strikethrough?: boolean;
	value: string;
};

export type CustomSelectProps = {
	readonly isDisabled?: boolean;
	readonly visibleOptionCount?: number;
	readonly options: CustomOption[];
	readonly defaultValue?: string;
	readonly onHover?: (value: string) => void;
	readonly onSelect?: (value: string, key: Key) => void;
};

export const CustomSelect = ({
	isDisabled = false,
	visibleOptionCount = 5,
	options,
	defaultValue,
	onHover,
	onSelect,
}: CustomSelectProps) => {
	const [selectedIndex, setSelectedIndex] = useState(() => {
		if (defaultValue) {
			const index = options.findIndex((option) => option.value === defaultValue);
			return index >= 0 ? index : 0;
		}
		return 0;
	});

	const [startIndex, setStartIndex] = useState(0);

	const handleChange = (newIndex: number) => {
		setSelectedIndex(newIndex);
		onHover?.(options[newIndex]?.value);
	};

	const handleUpArrow = () => {
		const newIndex = selectedIndex > 0 ? selectedIndex - 1 : options.length - 1;
		handleChange(newIndex);

		if (newIndex < startIndex) {
			setStartIndex(newIndex);
		} else if (newIndex >= startIndex + visibleOptionCount) {
			setStartIndex(Math.max(0, newIndex - visibleOptionCount + 1));
		}
	};

	const handleDownArrow = () => {
		const newIndex = selectedIndex < options.length - 1 ? selectedIndex + 1 : 0;
		handleChange(newIndex);

		if (newIndex >= startIndex + visibleOptionCount) {
			setStartIndex(newIndex - visibleOptionCount + 1);
		} else if (newIndex < startIndex) {
			setStartIndex(0);
		}
	};

	useEffect(() => {
		if (selectedIndex >= options.length) {
			setSelectedIndex(options.length - 1);
		}
	}, [options]);

	useInput(
		(_, key) => {
			if (isDisabled) {
				return;
			}
			if (key.upArrow) {
				handleUpArrow();
			} else if (key.downArrow) {
				handleDownArrow();
			} else if (options[selectedIndex]) {
				onSelect?.(options[selectedIndex].value, key);
			}
		},
		{ isActive: !isDisabled },
	);

	const visibleOptions = options.slice(startIndex, startIndex + visibleOptionCount);

	return (
		<Box flexDirection="column">
			{visibleOptions.map((option, index) => {
				const actualIndex = startIndex + index;
				const isSelected = actualIndex === selectedIndex;

				return (
					<Box key={option.value}>
						<Text color={isSelected ? 'cyan' : undefined}>
							{isSelected && !isDisabled ? '> ' : '  '}
						</Text>
						<Box>
							<Text color={isSelected && !isDisabled ? 'cyan' : undefined} strikethrough={option.strikethrough}>
								{option.value}
							</Text>
						</Box>
					</Box>
				);
			})}
		</Box>
	);
};
