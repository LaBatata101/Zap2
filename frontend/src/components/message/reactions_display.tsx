import { Box, Chip, useTheme } from "@mui/material";
import { MessageReaction, User } from "../../api/types";

interface ReactionsDisplayProps {
    reactions: MessageReaction[];
    currentUser: User;
    onToggleReaction: (emoji: string) => void;
    setShowReactionsDialog: (value: boolean) => void;
}

export interface GroupedReaction {
    emoji: string;
    count: number;
    users: User[];
    userReacted: boolean;
}

const MAX_VISIBLE_REACTIONS = 6;

export const ReactionsDisplay = ({
    reactions,
    currentUser,
    onToggleReaction,
    setShowReactionsDialog,
}: ReactionsDisplayProps) => {
    const theme = useTheme();

    // Group reactions by emoji
    const groupedReactions = reactions.reduce(
        (acc, reaction) => {
            if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = {
                    emoji: reaction.emoji,
                    count: 0,
                    users: [],
                    userReacted: false,
                };
            }
            acc[reaction.emoji].count++;
            acc[reaction.emoji].users.push(reaction.user);
            if (reaction.user.id === currentUser.id) {
                acc[reaction.emoji].userReacted = true;
            }
            return acc;
        },
        {} as Record<string, GroupedReaction>,
    );

    const reactionsList = Object.values(groupedReactions);
    const visibleReactions = reactionsList.slice(0, MAX_VISIBLE_REACTIONS);
    const hiddenCount = Math.max(0, reactionsList.length - MAX_VISIBLE_REACTIONS);

    if (reactionsList.length === 0) return null;

    return (
        <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.5,
                mt: 0.5,
                maxWidth: "100%",
            }}
        >
            {visibleReactions.map((reaction) => (
                <Chip
                    key={reaction.emoji}
                    label={`${reaction.emoji} ${reaction.count}`}
                    size="small"
                    clickable
                    onClick={() => onToggleReaction(reaction.emoji)}
                    sx={{
                        height: 26,
                        fontSize: "0.75rem",
                        borderRadius: "13px",
                        backgroundColor: reaction.userReacted
                            ? "rgba(59, 130, 246, 0.15)"
                            : "background.paper",
                        color: reaction.userReacted ? "primary.main" : "text.primary",
                        border: reaction.userReacted
                            ? `1.5px solid ${theme.palette.primary.main}`
                            : `1px solid ${theme.palette.divider}`,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                            backgroundColor: reaction.userReacted
                                ? "rgba(59, 130, 246, 0.25)"
                                : "action.hover",
                            transform: "scale(1.05)",
                            boxShadow: reaction.userReacted
                                ? "0 2px 8px rgba(59, 130, 246, 0.3)"
                                : "0 2px 4px rgba(0, 0, 0, 0.1)",
                        },
                        "&:active": {
                            transform: "scale(0.98)",
                        },
                        "& .MuiChip-label": {
                            px: 1,
                            fontWeight: reaction.userReacted ? 600 : 400,
                        },
                    }}
                />
            ))}

            {hiddenCount > 0 && (
                <Chip
                    label={`+${hiddenCount}`}
                    size="small"
                    clickable
                    onClick={() => setShowReactionsDialog(true)}
                    sx={{
                        height: 26,
                        fontSize: "0.75rem",
                        borderRadius: "13px",
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                        color: "text.secondary",
                        border: `1px solid ${theme.palette.divider}`,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                            backgroundColor: "action.hover",
                            transform: "scale(1.05)",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        },
                        "&:active": {
                            transform: "scale(0.98)",
                        },
                        "& .MuiChip-label": {
                            px: 1,
                            fontWeight: 500,
                        },
                    }}
                />
            )}
        </Box>
    );
};
