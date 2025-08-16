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

    const isDM = currentRoom.is_dm;
    const isDmItself = isDM && recipient?.id === user.id;

    const isChatGroupOwner = currentRoom.owner === user.username;
    const displayName = isDM ? recipient?.username : currentRoom.name;
    const displayAvatar = isDM ? recipient?.profile.avatar_img : currentRoom.avatar_img;
    const avatarFallback = (isDM ? recipient?.username : currentRoom.name)?.charAt(0).toUpperCase();

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
                        <Typography
                            variant="h6"
                            color="text.primary"
                            sx={{ flexGrow: 1, fontWeight: 600 }}
                        >
                            {isDmItself ? "Saved messages" : displayName}
                        </Typography>
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
