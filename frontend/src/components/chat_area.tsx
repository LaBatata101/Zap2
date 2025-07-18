import { useState } from "react";
import * as types from "../api/types";
import { ConnectionStatus } from "../pages/chat";
import {
    Box,
    Typography,
    Menu,
    MenuItem,
    Avatar,
    Stack,
    IconButton,
    AppBar,
    Toolbar,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import { Message as MessageIcon, MoreVert, Menu as MenuIcon } from "@mui/icons-material";
import { MessageList } from "./message_list";
import { MessageInput } from "./message_input";

type ChatAreaProps = {
    currentRoom?: types.ChatRoom;
    messages: types.Message[];
    user: types.User;
    connectionStatus: ConnectionStatus;
    onSendMessage: (content: string, files: File[]) => Promise<void>;
    replyingTo: types.Message | null;
    onSetReply: (message: types.Message) => void;
    onCancelReply: () => void;
    onMenuClick: () => void;
    onReplyClick: (messageId: number) => void;
    highlightedMessageId?: number;
};

export const ChatArea = ({
    currentRoom,
    messages,
    user,
    onSendMessage,
    connectionStatus,
    replyingTo,
    onSetReply,
    onCancelReply,
    onMenuClick,
    onReplyClick,
    highlightedMessageId,
}: ChatAreaProps) => {
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isConnected = connectionStatus === ConnectionStatus.Connected;
    const firstUnreadIndex =
        currentRoom && currentRoom.unread_count > 0
            ? Math.max(0, messages.length - currentRoom.unread_count)
            : null;

    if (!currentRoom) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    textAlign: "center",
                    p: 3,
                    bgcolor: "background.default",
                    background:
                        "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
                }}
            >
                <MessageIcon
                    sx={{
                        fontSize: 80,
                        color: "text.secondary",
                        mb: 3,
                        opacity: 0.6,
                    }}
                />
                <Typography variant="h5" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                    Select a room to start chatting
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 400 }}>
                    Choose a room from the sidebar to begin your conversation
                </Typography>
            </Box>
        );
    }

    return (
        <Stack sx={{ height: "100%", width: "100%" }}>
            <AppBar
                position="static"
                color="inherit"
                elevation={0}
                sx={{
                    bgcolor: "background.paper",
                    borderBottom: "1px solid #374151",
                    backdropFilter: "blur(10px)",
                }}
            >
                <Toolbar sx={{ minHeight: "64px !important" }}>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={onMenuClick}
                            sx={{
                                mr: 2,
                                color: "text.secondary",
                                "&:hover": {
                                    color: "primary.main",
                                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                                },
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Avatar
                        sx={{
                            mr: 2,
                            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                        }}
                    >
                        {currentRoom.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography
                        variant="h6"
                        color="text.primary"
                        sx={{ flexGrow: 1, fontWeight: 600 }}
                    >
                        {currentRoom.name}
                    </Typography>
                    <IconButton
                        onClick={(e) => setMenuAnchor(e.currentTarget)}
                        sx={{
                            color: "text.secondary",
                            "&:hover": {
                                color: "primary.main",
                                backgroundColor: "rgba(59, 130, 246, 0.1)",
                            },
                        }}
                    >
                        <MoreVert />
                    </IconButton>
                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={() => setMenuAnchor(null)}
                        slotProps={{
                            paper: {
                                sx: {
                                    bgcolor: "background.paper",
                                    border: "1px solid #374151",
                                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                                },
                            },
                        }}
                    >
                        <MenuItem>Room Info</MenuItem>
                        <MenuItem>Members</MenuItem>
                        <MenuItem>Configurations</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <MessageList
                messages={messages}
                currentUser={user}
                onReply={onSetReply}
                onReplyClick={onReplyClick}
                highlightedMessageId={highlightedMessageId}
                firstUnreadIndex={firstUnreadIndex}
                unreadCount={currentRoom?.unread_count || 0}
            />
            <MessageInput
                isConnected={isConnected}
                onSendMessage={onSendMessage}
                replyingTo={replyingTo}
                onCancelReply={onCancelReply}
            />
        </Stack>
    );
};
