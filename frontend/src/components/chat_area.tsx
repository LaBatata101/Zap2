import * as types from "../api/types";
import { ConnectionStatus } from "../pages/chat";
import {
    Box,
    Typography,
    Avatar,
    Stack,
    IconButton,
    AppBar,
    Toolbar,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import { Message as MessageIcon, Menu as MenuIcon, Bookmark } from "@mui/icons-material";
import { MessageList } from "./message_list";
import { MessageInput } from "./message_input";
import { useEffect, useState } from "react";
import { RoomDetailsDialog } from "./dialog/chat_group_details_dialog";
import { DialogMode } from "./dialog/common";
import { UserProfileDialog } from "./dialog/user_profile_dialog";

type ChatAreaProps = {
    currentRoom?: types.ChatRoom;
    messages: types.Message[];
    user: types.User;
    connectionStatus: ConnectionStatus;
    onSendMessage: (content: string, files: File[]) => Promise<void>;
    onEditMessageComplete: (newContent: string) => Promise<void>;
    replyingTo: types.Message | null;
    onSetReply: (message: types.Message) => void;
    messageEdit: types.Message | null;
    onMessageEdit: (message: types.Message) => void;
    onCancelReply: () => void;
    onCancelMessageEdit: () => void;
    onMenuClick: () => void;
    onReplyClick: (messageId: number) => void;
    highlightedMessageId?: number;
    onFetchMoreMessages: () => void;
    hasMoreMessages: boolean;
    messagesLoading: boolean;
    onUpdateRoom: (
        roomId: number,
        name: string,
        description: string,
        avatar: File | null,
        cropAvatarData: types.CropAvatarData | null,
        isPrivate: boolean,
    ) => Promise<boolean>;
    onLoadMembers: (roomId: number) => Promise<types.User[]>;
    onStartDirectMessage: (user: types.User) => void;
    onDeleteMessage: (message: types.Message) => void;
    onToggleAdmin: (roomId: number, username: string, value: boolean) => Promise<types.User>;
    onToggleReaction: (
        message: types.Message,
        emoji: string,
        reaction?: types.MessageReaction,
    ) => void;
    onCreateInvitation: (roomId: number) => Promise<string | null>;
    onStartTyping: (roomId: number) => void;
    onStopTyping: (roomId: number) => void;
    typingUsers: string[];
};

export const ChatArea = ({
    currentRoom,
    messages,
    user,
    onSendMessage,
    onEditMessageComplete,
    connectionStatus,
    replyingTo,
    onSetReply,
    messageEdit,
    onMessageEdit,
    onCancelReply,
    onCancelMessageEdit,
    onMenuClick,
    onReplyClick,
    highlightedMessageId,
    onFetchMoreMessages,
    hasMoreMessages,
    messagesLoading,
    onUpdateRoom,
    onLoadMembers,
    onStartDirectMessage,
    onDeleteMessage,
    onToggleAdmin,
    onToggleReaction,
    onStartTyping,
    onStopTyping,
    typingUsers,
    onCreateInvitation,
}: ChatAreaProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isConnected = connectionStatus === ConnectionStatus.Connected;
    const firstUnreadIndex =
        currentRoom && currentRoom.unread_count > 0
            ? Math.max(0, messages.length - currentRoom.unread_count)
            : null;
    const [isRoomDetailsOpen, setRoomDetailsOpen] = useState(false);
    const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
    const [recipient, setRecipient] = useState<types.User | null>(null);

    useEffect(() => {
        if (currentRoom?.dm_recipient) {
            setRecipient(currentRoom.dm_recipient);
        }
    }, [currentRoom]);

    const handleHeaderClick = () => {
        if (currentRoom?.is_dm) {
            setProfileDialogOpen(true);
        } else {
            setRoomDetailsOpen(true);
        }
    };

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
                    Select a chat to start messaging
                </Typography>
            </Box>
        );
    }

    const getTypingText = () => {
        const otherTypingUsers = typingUsers;

        if (otherTypingUsers.length === 0) {
            return "";
        }
        if (otherTypingUsers.length === 1) {
            return `${otherTypingUsers[0]} is typing...`;
        }
        if (otherTypingUsers.length === 2) {
            return `${otherTypingUsers[0]} and ${otherTypingUsers[1]} are typing...`;
        }
        if (otherTypingUsers.length === 3) {
            return `${otherTypingUsers[0]}, ${otherTypingUsers[1]} and ${otherTypingUsers[2]} are typing...`;
        }
        return `${otherTypingUsers[0]}, ${otherTypingUsers[1]}, ${otherTypingUsers[2]} and ${otherTypingUsers.length} are typing...`;
    };

    const isDM = currentRoom.is_dm;
    const isDmItself = isDM && recipient?.id === user.id;

    const isChatGroupOwner = currentRoom.owner === user.username;
    const displayName = isDM ? recipient?.username : currentRoom.name;
    const displayAvatar = isDM ? recipient?.profile.avatar_img : currentRoom.avatar_img;
    const avatarFallback = (isDM ? recipient?.username : currentRoom.name)?.charAt(0).toUpperCase();

    const handleStartTyping = () => {
        onStartTyping(currentRoom.id);
    };
    const handleStopTyping = () => {
        onStopTyping(currentRoom.id);
    };

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
                            onClick={(e) => {
                                e.stopPropagation();
                                onMenuClick();
                            }}
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
                    <Box
                        onClick={handleHeaderClick}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            flexGrow: 1,
                            borderRadius: 2,
                            p: 1,
                            m: -1,
                            ml: isMobile ? 0 : -1,
                            transition: "background-color 0.2s",
                            "&:hover": { backgroundColor: "action.hover" },
                        }}
                    >
                        {isDmItself ? (
                            <Avatar
                                sx={{
                                    mr: 2,
                                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                                }}
                            >
                                <Bookmark />
                            </Avatar>
                        ) : displayAvatar ? (
                            <Avatar sx={{ mr: 2 }}>
                                <img src={displayAvatar} alt="Group avatar image" />
                            </Avatar>
                        ) : (
                            <Avatar
                                sx={{
                                    mr: 2,
                                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                                }}
                            >
                                {avatarFallback}
                            </Avatar>
                        )}
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography
                                variant="h6"
                                color="text.primary"
                                sx={{
                                    fontWeight: 600,
                                    lineHeight: 1.2,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {isDmItself ? "Saved messages" : displayName}
                            </Typography>
                            <Box
                                sx={{
                                    height: typingUsers.length > 0 ? "18px" : "0px",
                                    overflow: "hidden",
                                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                    opacity: typingUsers.length > 0 ? 1 : 0,
                                    transform:
                                        typingUsers.length > 0
                                            ? "translateY(0)"
                                            : "translateY(-8px)",
                                    marginTop: typingUsers.length > 0 ? "2px" : "0px",
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "text.secondary",
                                        fontSize: "0.75rem",
                                        fontStyle: "italic",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        lineHeight: 1.2,
                                        transform:
                                            typingUsers.length > 0 ? "scale(1)" : "scale(0.95)",
                                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    }}
                                >
                                    <Box
                                        component="span"
                                        sx={{
                                            width: 4,
                                            height: 4,
                                            borderRadius: "50%",
                                            bgcolor: "success.main",
                                            display: "inline-block",
                                            animation:
                                                typingUsers.length > 0
                                                    ? "pulse 1.5s infinite"
                                                    : "none",
                                            opacity: typingUsers.length > 0 ? 1 : 0,
                                            transform:
                                                typingUsers.length > 0 ? "scale(1)" : "scale(0)",
                                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                            "@keyframes pulse": {
                                                "0%": {
                                                    opacity: 1,
                                                    transform: "scale(1)",
                                                },
                                                "50%": {
                                                    opacity: 0.6,
                                                    transform: "scale(1.1)",
                                                },
                                                "100%": {
                                                    opacity: 1,
                                                    transform: "scale(1)",
                                                },
                                            },
                                        }}
                                    />
                                    <Box
                                        component="span"
                                        sx={{
                                            opacity: typingUsers.length > 0 ? 1 : 0,
                                            transform:
                                                typingUsers.length > 0
                                                    ? "translateX(0)"
                                                    : "translateX(-4px)",
                                            transition:
                                                "all 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s",
                                        }}
                                    >
                                        {getTypingText()}
                                    </Box>
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

            <MessageList
                messages={messages}
                currentUser={user}
                onReply={onSetReply}
                onReplyClick={onReplyClick}
                onMessageEdit={onMessageEdit}
                highlightedMessageId={highlightedMessageId}
                firstUnreadIndex={firstUnreadIndex}
                unreadCount={currentRoom?.unread_count || 0}
                onFetchMore={onFetchMoreMessages}
                hasMore={hasMoreMessages}
                isLoading={messagesLoading}
                isDM={isDM}
                isChatGroupOwner={isChatGroupOwner}
                onStartDirectMessage={onStartDirectMessage}
                onDeleteMessage={onDeleteMessage}
                onToggleReaction={onToggleReaction}
            />
            <MessageInput
                isConnected={isConnected}
                onSendMessage={onSendMessage}
                onEditMessageComplete={onEditMessageComplete}
                replyingTo={replyingTo}
                messageEdit={messageEdit}
                onCancelReply={onCancelReply}
                onCancelMessageEdit={onCancelMessageEdit}
                onStartTyping={handleStartTyping}
                onStopTyping={handleStopTyping}
            />

            {currentRoom && !isDM && (
                <RoomDetailsDialog
                    currentUser={user}
                    room={currentRoom}
                    isOpen={isRoomDetailsOpen}
                    mode={
                        currentRoom.owner === user.username
                            ? DialogMode.CurrentUser
                            : DialogMode.View
                    }
                    onUpdateRoom={onUpdateRoom}
                    onClose={() => setRoomDetailsOpen(false)}
                    onLoadMembers={onLoadMembers}
                    onProfileView={(user) => {
                        setRecipient(user);
                        setProfileDialogOpen(true);
                    }}
                    onToggleAdmin={onToggleAdmin}
                    onCreateInvitation={onCreateInvitation}
                />
            )}
            {/* This is used to display the user information in the chat area, when clicked in the toolbar, or
             * in the group chat dialog, when click in one of the members of the chat.
             */}
            {recipient && (isDM || isProfileDialogOpen) && (
                <UserProfileDialog
                    user={recipient}
                    isOpen={isProfileDialogOpen}
                    mode={isDM ? DialogMode.DM : DialogMode.View}
                    onClose={() => setProfileDialogOpen(false)}
                    onStartDirectMessage={
                        isDM
                            ? (_) => {}
                            : (user) => {
                                  onStartDirectMessage(user);
                                  setProfileDialogOpen(false);
                                  setRoomDetailsOpen(false);
                              }
                    }
                    onUpdateProfile={null}
                />
            )}
        </Stack>
    );
};
