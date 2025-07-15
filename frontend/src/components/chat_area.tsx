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
    onSendMessage: (content: string) => Promise<void>;
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
                    bgcolor: "grey.100",
                }}
            >
                <MessageIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
                <Typography variant="h5" color="text.secondary">
                    Select a room to start chatting
                </Typography>
                <Typography color="text.secondary">
                    Choose a room from the sidebar to begin your conversation
                </Typography>
            </Box>
        );
    }

    return (
        <Stack sx={{ height: "100%", width: "100%" }}>
            <AppBar position="static" color="inherit" elevation={1}>
                <Toolbar>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={onMenuClick}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Avatar sx={{ mr: 2, background: "linear-gradient(45deg, #1890ff, #722ed1)" }}>
                        {currentRoom.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {currentRoom.name}
                    </Typography>
                    <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                        <MoreVert />
                    </IconButton>
                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={() => setMenuAnchor(null)}
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
