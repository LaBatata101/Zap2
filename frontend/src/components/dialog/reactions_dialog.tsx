import * as types from "../../api/types";
import {
    Avatar,
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Typography,
    useTheme,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { GroupedReaction } from "../message/reactions_display";
import { memo } from "react";

export const ReactionsDialog = memo(
    ({
        open,
        reactions,
        currentUser,
        handleClose,
    }: {
        open: boolean;
        reactions: types.MessageReaction[];
        currentUser: types.User;
        handleClose: () => void;
    }) => {
        const theme = useTheme();
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

        return (
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                sx={{
                    "& .MuiDialog-paper": {
                        bgcolor: "background.paper",
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                        maxHeight: "70vh",
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        pb: 1,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Box>
                        <Typography variant="h6" fontWeight="600">
                            All Reactions ({reactionsList.length})
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={() => handleClose()}
                        size="small"
                        sx={{ color: "text.secondary" }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <List sx={{ py: 0 }}>
                        {reactionsList.map((reaction) => (
                            <Box key={reaction.emoji} sx={{ mb: 2 }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        px: 2,
                                        py: 1,
                                        bgcolor: "surface.main",
                                        borderRadius: 1,
                                        mx: 1,
                                        mt: 1,
                                    }}
                                >
                                    <Typography variant="h6" sx={{ mr: 1, fontSize: "1.2rem" }}>
                                        {reaction.emoji}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {reaction.count}{" "}
                                        {reaction.count === 1 ? "person" : "people"}
                                    </Typography>
                                </Box>
                                {reaction.users.map((user) => (
                                    <ListItem key={user.id} sx={{ py: 0.5 }}>
                                        <ListItemAvatar>
                                            {user.profile?.avatar_img ? (
                                                <Avatar
                                                    src={user.profile.avatar_img}
                                                    sx={{ width: 32, height: 32 }}
                                                />
                                            ) : (
                                                <Avatar
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        fontSize: "0.875rem",
                                                        background:
                                                            "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                                                    }}
                                                >
                                                    {user.username.charAt(0).toUpperCase()}
                                                </Avatar>
                                            )}
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={user.username}
                                            sx={{
                                                "& .MuiListItemText-primary": {
                                                    fontSize: "0.875rem",
                                                    fontWeight:
                                                        user.id === currentUser.id ? 600 : 400,
                                                    color:
                                                        user.id === currentUser.id
                                                            ? "primary.main"
                                                            : "text.primary",
                                                },
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </Box>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>
        );
    },
);
