import {useState, useEffect} from 'react';
import {Text, useInput} from 'ink';
import chalk from 'chalk';

export type Props = {
	/**
	 * Text to display when `value` is empty.
	 */
	readonly placeholder?: string;

	/**
	 * Listen to user's input. Useful in case there are multiple input components
	 * at the same time and input must be "routed" to a specific component.
	 */
	readonly focus?: boolean;

	/**
	 * Value to display in a text input.
	 */
	readonly value: string;

	/**
	 * Function to call when value updates.
	 */
	readonly onChange: (value: string) => void;

	/**
	 * Function to call when `Enter` is pressed, where first argument is a value of the input.
	 */
	readonly onSubmit?: (value: string) => void;
};

export const TextInput = ({
	value,
	placeholder = '',
	focus = true,
	onChange,
	onSubmit,
}: Props) => {
	const [state, setState] = useState({
		cursorOffset: (value || '').length,
		cursorWidth: 0,
	});

	const {cursorOffset, cursorWidth} = state;

	useEffect(() => {
		setState(previousState => {
			if (!focus) {
				return previousState;
			}

			const newValue = value || '';

			if (previousState.cursorOffset > newValue.length - 1) {
				return {
					cursorOffset: newValue.length,
					cursorWidth: 0,
				};
			}

			return previousState;
		});
	}, [value, focus]);

	let renderedValue = value;
	let renderedPlaceholder = placeholder ? chalk.grey(placeholder) : undefined;

	// Fake mouse cursor, because it's too inconvenient to deal with actual cursor and ansi escapes
	if (focus) {
		renderedPlaceholder =
			placeholder.length > 0
				? chalk.inverse(placeholder[0]) + chalk.grey(placeholder.slice(1))
				: chalk.inverse(' ');

		renderedValue = value.length > 0 ? '' : chalk.inverse(' ');

		let i = 0;

		for (const char of value) {
			renderedValue +=
				i >= cursorOffset - cursorWidth && i <= cursorOffset
					? chalk.inverse(char)
					: char;

			i++;
		}

		if (value.length > 0 && cursorOffset === value.length) {
			renderedValue += chalk.inverse(' ');
		}
	}

	useInput(
		(input, key) => {
			if (
				key.upArrow ||
				key.downArrow ||
				(key.ctrl && input === 'c') ||
				key.tab ||
				(key.shift && key.tab)
			) {
				return;
			}

			if (key.return) {
				if (onSubmit) {
					onSubmit(value);
				}

				return;
			}

			let nextCursorOffset = cursorOffset;
			let nextValue = value;
			let nextCursorWidth = 0;

			if (key.leftArrow) {
				nextCursorOffset--;
			} else if (key.rightArrow) {
				nextCursorOffset++;
			} else if (key.backspace || key.delete) {
				if (cursorOffset > 0) {
					nextValue =
						value.slice(0, cursorOffset - 1) +
						value.slice(cursorOffset, value.length);

					nextCursorOffset--;
				}
			} else {
				nextValue =
					value.slice(0, cursorOffset) +
					input +
					value.slice(cursorOffset, value.length);

				nextCursorOffset += input.length;

				if (input.length > 1) {
					nextCursorWidth = input.length;
				}
			}

			if (cursorOffset < 0) {
				nextCursorOffset = 0;
			}

			if (cursorOffset > value.length) {
				nextCursorOffset = value.length;
			}

			setState({
				cursorOffset: nextCursorOffset,
				cursorWidth: nextCursorWidth,
			});

			if (nextValue !== value) {
				onChange(nextValue);
			}
		},
		{isActive: focus},
	);

	return (
		<Text>
			{value.length > 0 ? renderedValue : renderedPlaceholder}
		</Text>
	);
}
type UncontrolledProps = {
	/**
	 * Initial value.
	 */
	readonly initialValue?: string;
} & Omit<Props, 'value' | 'onChange'>;

export function UncontrolledTextInput({
	initialValue = '',
	...props
}: UncontrolledProps) {
	const [value, setValue] = useState(initialValue);

	return <TextInput {...props} value={value} onChange={setValue} />;
}
