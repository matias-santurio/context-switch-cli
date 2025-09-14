import { Box, Text } from 'ink';

export type GuideAction = {
	name: string;
	key: string;
};

export type GuideTextProps = {
	actions: GuideAction[];
};

export const GuideText = ({ actions }: GuideTextProps) => {
	return (
		<Box>
			{actions.map((action, index) => (
				<Box key={`${action.key}-${index}`} marginRight={index < actions.length - 1 ? 1 : 0}>
					<Text color="#4A8A8A." bold={true}>[{action.key}]</Text>
					<Text color="dim"> {action.name}</Text>
				</Box>
			))}
		</Box>
	);
};
