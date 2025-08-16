import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as types from "../api/types";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Fab,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Popover,
    PopoverActions,
    Typography,
    useTheme,
    Zoom,
} from "@mui/material";
import { formatDate } from "../helpers/format";
import { Message, MessageSequenceType } from "./message";
import {
    Close,
    ContentCopy,
    Delete,
    Edit,
    EmojiEmotions,
    KeyboardArrowDown,
    Reply,
} from "@mui/icons-material";
import { UserProfileDialog } from "./dialog/user_profile_dialog";
import { DialogMode } from "./dialog/common";
import EmojiPicker, { EmojiClickData, EmojiStyle, Theme } from "emoji-picker-react";
import { GroupedReaction } from "./message/reactions_display";

type ContextMenuState = {
    mouseX: number;
    mouseY: number;
    message: types.Message;
} | null;

type ReactionPickerState = {
    message: types.Message;
    anchorEl: HTMLElement;
} | null;

interface MessageListProps {
    messages: types.Message[];
    currentUser: types.User;
    onReply: (message: types.Message) => void;
    onMessageEdit: (message: types.Message) => void;
    onDeleteMessage: (message: types.Message) => void;
    onReplyClick: (messageId: number) => void;
    highlightedMessageId?: number;
    firstUnreadIndex: number | null;
    unreadCount: number;
    onFetchMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
    isDM: boolean;
    isChatGroupOwner: boolean;
    onStartDirectMessage: (user: types.User) => void;
    onToggleReaction: (
        message: types.Message,
        emoji: string,
        reaction?: types.MessageReaction,
    ) => void;
}

interface ScrollState {
    scrollTop: number;
    scrollHeight: number;
    messagesLength: number;
    isActive: boolean;
}

export const MessageList = memo(
    ({
        messages,
        currentUser,
        onReply,
        onReplyClick,
        onMessageEdit,
        highlightedMessageId,
        firstUnreadIndex,
        unreadCount,
        onFetchMore,
        hasMore,
        isLoading,
        isDM,
        isChatGroupOwner,
        onStartDirectMessage,
        onDeleteMessage,
        onToggleReaction,
    }: MessageListProps) => {
        const messagesEndRef = useRef<HTMLDivElement>(null);
        const scrollContainerRef = useRef<HTMLDivElement>(null);
        const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
        const [showScrollButton, setShowScrollButton] = useState(false);
        const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
        const [profileDialogData, setProfileDialogData] = useState<types.User | null>(null);
        const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
        const [messageToDelete, setMessageToDelete] = useState<types.Message | null>(null);
        const [reactionPickerState, setReactionPickerState] = useState<ReactionPickerState>(null);
        const [showReactionsDialog, setShowReactionsDialog] = useState(false);
        const [reactionsToDisplay, setReactionsToDisplay] = useState<
            types.MessageReaction[] | null
        >(null);
        const firstUnreadRef = useRef<HTMLDivElement>(null);
        const prevMessagesLength = useRef(0);

        const scrollStateRef = useRef<ScrollState | null>(null);
        const isRestoring = useRef(false);
        const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const initialResizeObserverRef = useRef<ResizeObserver | null>(null);

        const popoverActionRef = useRef<PopoverActions>(null);
        const resizeObserverRef = useRef<ResizeObserver | null>(null);

        const emojiPickerContainerRef = useCallback((node: HTMLDivElement | null) => {
            // Disconnect the old observer if it exists
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }

            // If the node is mounted, create and attach a new observer
            if (node !== null) {
                const observer = new ResizeObserver(() => {
                    // When the picker resizes, update the popover's position.
                    popoverActionRef.current?.updatePosition();
                });
                observer.observe(node);
                resizeObserverRef.current = observer;
            }
        }, []);

        // Debounced fetch to prevent multiple simultaneous requests
        const debouncedFetch = useCallback(() => {
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }

            fetchTimeoutRef.current = setTimeout(() => {
                const container = scrollContainerRef.current;
                if (!container || isLoading) return;

                // Save current scroll state with more precision
                const currentState: ScrollState = {
                    scrollTop: container.scrollTop,
                    scrollHeight: container.scrollHeight,
                    messagesLength: messages.length,
                    isActive: true,
                };

                scrollStateRef.current = currentState;
                onFetchMore();
            }, 100); // Small debounce to prevent rapid calls
        }, [onFetchMore, messages.length, isLoading]);

        const restoreScrollPosition = useCallback(() => {
            const container = scrollContainerRef.current;
            const savedState = scrollStateRef.current;

            if (!container || !savedState || !savedState.isActive) return;

            isRestoring.current = true;

            // Calculate the height difference more accurately
            const heightDifference = container.scrollHeight - savedState.scrollHeight;

            // Apply the scroll position with the height difference
            const newScrollTop = savedState.scrollTop + heightDifference;

            // Use requestAnimationFrame for better timing
            requestAnimationFrame(() => {
                container.scrollTop = newScrollTop;

                // Verify the position was set correctly, and adjust if needed
                requestAnimationFrame(() => {
                    const actualScrollTop = container.scrollTop;
                    const expectedScrollTop = newScrollTop;

                    // If there's still a significant difference, try to correct it
                    if (Math.abs(actualScrollTop - expectedScrollTop) > 10) {
                        container.scrollTop = expectedScrollTop;
                    }

                    // Mark restoration as complete
                    setTimeout(() => {
                        isRestoring.current = false;
                        if (scrollStateRef.current) {
                            scrollStateRef.current.isActive = false;
                        }
                    }, 50);
                });
            });
        }, []);

        useEffect(() => {
            const container = scrollContainerRef.current;
            if (!container) return;

            // Create resize observer to handle dynamic content changes
            initialResizeObserverRef.current = new ResizeObserver((_) => {
                if (isRestoring.current && scrollStateRef.current?.isActive) {
                    // Re-run restoration if content is still changing
                    restoreScrollPosition();
                }
            });

            initialResizeObserverRef.current.observe(container);

            return () => {
                if (initialResizeObserverRef.current) {
                    initialResizeObserverRef.current.disconnect();
                }
            };
        }, [restoreScrollPosition]);

        useLayoutEffect(() => {
            // Skip if not loading or no saved state
            if (isLoading || !scrollStateRef.current?.isActive) return;

            // Only restore if messages were actually added
            if (messages.length > scrollStateRef.current.messagesLength) {
                restoreScrollPosition();
            }
        }, [messages, isLoading, restoreScrollPosition]);

        useEffect(() => {
            if (prevMessagesLength.current === 0 && messages.length > 0) {
                if (firstUnreadIndex !== null && firstUnreadRef.current) {
                    // Scroll to the first unread message in the chat
                    firstUnreadRef.current.scrollIntoView({ behavior: "auto" });
                } else if (messagesEndRef.current) {
                    // Initial scroll to bottom when selecting a chat
                    messagesEndRef.current.scrollIntoView({ behavior: "instant" });
                }
            } else if (messages.length > prevMessagesLength.current) {
                // Auto-scroll to bottom when new messages arrive
                if (scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    const isNearBottom =
                        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                    if (isNearBottom) {
                        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                    }
                }
            }
            prevMessagesLength.current = messages.length;
        }, [messages, firstUnreadIndex]);

        // Handle scroll events to show/hide the scroll button
        const handleScroll = () => {
            if (scrollContainerRef.current) {
                const container = scrollContainerRef.current;
                const isNearBottom =
                    container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                setShowScrollButton(!isNearBottom);

                const isAtTop = container.scrollTop <= 10;
                if (isAtTop && hasMore && !isLoading) {
                    debouncedFetch();
                }
            }
        };

        // Cleanup function
        useEffect(() => {
            return () => {
                if (fetchTimeoutRef.current) {
                    clearTimeout(fetchTimeoutRef.current);
                }
                if (initialResizeObserverRef.current) {
                    initialResizeObserverRef.current.disconnect();
                }
            };
        }, []);

        const handleContextMenu = useCallback((event: React.MouseEvent, message: types.Message) => {
            event.preventDefault();
            setContextMenu(
                contextMenu === null
                    ? {
                          mouseX: event.clientX - 2,
                          mouseY: event.clientY - 4,
                          message: message,
                      }
                    : null,
            );
        }, []);

        const handleReactionPickerShow = useCallback(
            (message: types.Message, element: HTMLElement) => {
                setReactionPickerState({
                    message,
                    anchorEl: element,
                });
            },
            [],
        );

        const handleReactionPickerClose = useCallback(() => {
            setReactionPickerState(null);
        }, []);

        const handleEmojiClick = useCallback(
            (emojiData: EmojiClickData) => {
                if (reactionPickerState) {
                    const userReaction = reactionPickerState.message.reactions.find(
                        (reaction) => reaction.user.id === currentUser.id,
                    );
                    onToggleReaction(reactionPickerState.message, emojiData.emoji, userReaction);
                    handleReactionPickerClose();
                }
            },
            [reactionPickerState],
        );

        const handleUserProfileDialog = useCallback((user: types.User) => {
            setProfileDialogOpen(true);
            setProfileDialogData(user);
        }, []);

        const handleCloseMenu = () => {
            setContextMenu(null);
        };

        const handleReply = () => {
            if (contextMenu) {
                onReply(contextMenu.message);
                handleCloseMenu();
            }
        };

        const handleMessageEdit = () => {
            if (contextMenu) {
                onMessageEdit(contextMenu.message);
                handleCloseMenu();
            }
        };

        const handleCopyText = async () => {
            if (contextMenu) {
                const type = "text/plain";
                const clipboardItemData = {
                    [type]: contextMenu.message.content,
                };
                const clipboardItem = new ClipboardItem(clipboardItemData);
                await navigator.clipboard.write([clipboardItem]);
                handleCloseMenu();
            }
        };

        const handleMessageDelete = () => {
            if (contextMenu) {
                setMessageToDelete(contextMenu.message);
                setDeleteConfirmOpen(true);
                handleCloseMenu();
            }
        };

        const handleShowReactionsDialog = () => {
            if (contextMenu) {
                setShowReactionsDialog(true);
                setReactionsToDisplay(contextMenu.message.reactions);
                handleCloseMenu();
            }
        };

        const handleDeleteConfirm = () => {
            if (messageToDelete) {
                onDeleteMessage(messageToDelete);
                setDeleteConfirmOpen(false);
                setMessageToDelete(null);
            }
        };

        const handleDeleteCancel = () => {
            setDeleteConfirmOpen(false);
            setMessageToDelete(null);
        };

        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        };

        const canDeleteMessage = () => {
            return (
                isChatGroupOwner ||
                currentUser.is_admin ||
                currentUser.is_superuser ||
                // Check if user is message owner
                currentUser.id === contextMenu?.message.user.id
            );
        };

        return (
            <Box
                ref={scrollContainerRef}
                onScroll={handleScroll}
                sx={{ flex: 1, overflowY: "auto", p: 2, bgcolor: "background.default" }}
            >
                {isLoading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}

                {messages.map((message, index) => {
                    const isFirstUnread = firstUnreadIndex !== null && index === firstUnreadIndex;
                    const previousMessage = index > 0 ? messages[index - 1] : null;
                    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

                    // Determine if the previous and next messages are from the same user on the same day.
                    const isSameUserAsPrevious =
                        previousMessage &&
                        previousMessage.user.id === message.user.id &&
                        formatDate(previousMessage.timestamp) === formatDate(message.timestamp);
                    const isSameUserAsNext =
                        nextMessage &&
                        nextMessage.user.id === message.user.id &&
                        formatDate(nextMessage.timestamp) === formatDate(message.timestamp);

                    let sequenceType: MessageSequenceType = "single";
                    if (isSameUserAsPrevious && isSameUserAsNext) {
                        sequenceType = "middle";
                    } else if (isSameUserAsPrevious) {
                        sequenceType = "last";
                    } else if (isSameUserAsNext) {
                        sequenceType = "first";
                    }

                    const showDate =
                        index === 0 ||
                        formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);

                    return (
                        <div key={message.id} id={`message-${message.id}`}>
                            {showDate && (
                                <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                                    <Chip
                                        label={formatDate(message.timestamp)}
                                        sx={{
                                            bgcolor: "surface.main",
                                            color: "text.secondary",
                                            fontWeight: 500,
                                            fontSize: "0.75rem",
                                            height: 28,
                                            "& .MuiChip-label": { px: 1.5 },
                                        }}
                                    />
                                </Box>
                            )}
                            {isFirstUnread && (
                                <Box
                                    ref={isFirstUnread ? firstUnreadRef : null}
                                    sx={{ display: "flex", justifyContent: "center", my: 2 }}
                                >
                                    <Chip
                                        label={`Unread messages: ${unreadCount}`}
                                        sx={{
                                            bgcolor: "primary.main",
                                            color: "primary.contrastText",
                                            fontWeight: 600,
                                            fontSize: "0.75rem",
                                            height: 28,
                                            boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                                            "& .MuiChip-label": { px: 1.5 },
                                        }}
                                    />
                                </Box>
                            )}
                            <Message
                                message={message}
                                currentUser={currentUser}
                                sequenceType={sequenceType}
                                isHighlighted={highlightedMessageId === message.id}
                                onCtxMenu={handleContextMenu}
                                onProfileView={handleUserProfileDialog}
                                onReplyClick={onReplyClick}
                                onReactionPickerShow={handleReactionPickerShow}
                                isReactionPickerOpen={
                                    reactionPickerState !== null &&
                                    reactionPickerState.message.id === message.id
                                }
                                onToggleReaction={onToggleReaction}
                                setShowReactionsDialog={setShowReactionsDialog}
                            />
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />

                {/* Floating scroll to bottom button */}
                <Zoom in={showScrollButton}>
                    <Fab
                        color="primary"
                        size="small"
                        onClick={scrollToBottom}
                        sx={{
                            position: "absolute",
                            bottom: 80,
                            right: 16,
                            zIndex: 1000,
                            bgcolor: "background.paper",
                            color: "text.primary",
                        }}
                        aria-label="scroll to bottom"
                    >
                        <KeyboardArrowDown />
                    </Fab>
                </Zoom>

                {/* Context Menu */}
                <Menu
                    open={contextMenu !== null}
                    onClose={handleCloseMenu}
                    anchorReference="anchorPosition"
                    anchorPosition={
                        contextMenu !== null
                            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                            : undefined
                    }
                    sx={{
                        "& .MuiPaper-root": {
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 2,
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                            backdropFilter: "blur(8px)",
                            minWidth: 160,
                        },
                    }}
                >
                    <MenuItem onClick={handleReply} sx={{ "&:hover": { bgcolor: "action.hover" } }}>
                        <ListItemIcon sx={{ color: "text.secondary" }}>
                            <Reply fontSize="small" />
                        </ListItemIcon>
                        <ListItemText sx={{ color: "text.primary" }}>Reply</ListItemText>
                    </MenuItem>
                    <MenuItem
                        onClick={handleCopyText}
                        sx={{ "&:hover": { bgcolor: "action.hover" } }}
                    >
                        <ListItemIcon sx={{ color: "text.secondary" }}>
                            <ContentCopy fontSize="small" />
                        </ListItemIcon>
                        <ListItemText sx={{ color: "text.primary" }}>Copy Text</ListItemText>
                    </MenuItem>
                    {(currentUser.is_superuser ||
                        currentUser.id === contextMenu?.message.user.id) && (
                        <MenuItem
                            onClick={handleMessageEdit}
                            sx={{ "&:hover": { bgcolor: "action.hover" } }}
                        >
                            <ListItemIcon sx={{ color: "text.secondary" }}>
                                <Edit fontSize="small" />
                            </ListItemIcon>
                            <ListItemText sx={{ color: "text.primary" }}>Edit</ListItemText>
                        </MenuItem>
                    )}
                    {contextMenu && contextMenu.message.reactions.length > 0 && (
                        <MenuItem
                            onClick={handleShowReactionsDialog}
                            sx={{ "&:hover": { bgcolor: "action.hover" } }}
                        >
                            <ListItemIcon sx={{ color: "text.secondary" }}>
                                <EmojiEmotions fontSize="small" />
                            </ListItemIcon>
                            <ListItemText sx={{ color: "text.primary" }}>Reactions</ListItemText>
                        </MenuItem>
                    )}
                    {canDeleteMessage() && (
                        <MenuItem
                            onClick={handleMessageDelete}
                            sx={{ "&:hover": { bgcolor: "action.hover" } }}
                        >
                            <ListItemIcon sx={{ color: "error.main" }}>
                                <Delete fontSize="small" />
                            </ListItemIcon>
                            <ListItemText sx={{ color: "error.main" }}>Delete Message</ListItemText>
                        </MenuItem>
                    )}
                </Menu>

                <Popover
                    action={popoverActionRef}
                    open={reactionPickerState !== null}
                    anchorEl={reactionPickerState?.anchorEl}
                    onClose={handleReactionPickerClose}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                    transformOrigin={{ vertical: "bottom", horizontal: "center" }}
                    sx={{
                        "& .MuiPopover-paper": {
                            bgcolor: "transparent",
                            boxShadow: "none",
                            overflow: "visible",
                        },
                    }}
                    keepMounted
                >
                    <div ref={emojiPickerContainerRef}>
                        <EmojiPicker
                            lazyLoadEmojis={true}
                            reactionsDefaultOpen={true}
                            emojiStyle={EmojiStyle.NATIVE}
                            onEmojiClick={handleEmojiClick}
                            theme={Theme.DARK}
                            width={350}
                            height={400}
                        />
                    </div>
                </Popover>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteConfirmOpen}
                    onClose={handleDeleteCancel}
                    aria-labelledby="delete-dialog-title"
                    aria-describedby="delete-dialog-description"
                    sx={{
                        "& .MuiDialog-paper": {
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 2,
                            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                        },
                    }}
                >
                    <DialogContent>
                        <DialogContentText
                            id="delete-dialog-description"
                            sx={{ color: "text.secondary" }}
                        >
                            Do you want to delete this message?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            onClick={handleDeleteCancel}
                            variant="outlined"
                            sx={{
                                borderColor: "divider",
                                color: "text.primary",
                                "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteConfirm}
                            variant="contained"
                            color="error"
                            sx={{ bgcolor: "error.main", "&:hover": { bgcolor: "error.dark" } }}
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

                {profileDialogData && (
                    <UserProfileDialog
                        user={profileDialogData}
                        isOpen={isProfileDialogOpen}
                        mode={isDM ? DialogMode.DM : DialogMode.View}
                        onUpdateProfile={null}
                        onClose={() => {
                            setProfileDialogOpen(false);
                        }}
                        onStartDirectMessage={(user) => {
                            onStartDirectMessage(user);
                            setProfileDialogOpen(false);
                        }}
                    />
                )}

                {/* Reactions Dialog */}
                {reactionsToDisplay && showReactionsDialog && (
                    <ReactionsDialog
                        open={showReactionsDialog}
                        handleClose={() => setShowReactionsDialog(false)}
                        currentUser={currentUser}
                        reactions={reactionsToDisplay}
                    />
                )}
            </Box>
        );
    },
);

const ReactionsDialog = memo(
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
