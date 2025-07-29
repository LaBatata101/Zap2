import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as types from "../api/types";
import {
    Box,
    Chip,
    CircularProgress,
    Fab,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Zoom,
} from "@mui/material";
import { formatDate } from "../helpers/format";
import { Message, MessageSequenceType } from "./message";
import { ContentCopy, Delete, KeyboardArrowDown, Reply } from "@mui/icons-material";
import { UserProfileDialog } from "./dialog/user_profile_dialog";
import { DialogMode } from "./dialog/common";

type ContextMenuState = {
    mouseX: number;
    mouseY: number;
    message: types.Message;
} | null;

interface MessageListProps {
    messages: types.Message[];
    currentUser: types.User;
    onReply: (message: types.Message) => void;
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
    }: MessageListProps) => {
        const messagesEndRef = useRef<HTMLDivElement>(null);
        const scrollContainerRef = useRef<HTMLDivElement>(null);
        const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
        const [showScrollButton, setShowScrollButton] = useState(false);
        const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
        const [profileDialogData, setProfileDialogData] = useState<types.User | null>(null);
        const firstUnreadRef = useRef<HTMLDivElement>(null);
        const prevMessagesLength = useRef(0);

        const scrollStateRef = useRef<ScrollState | null>(null);
        const isRestoring = useRef(false);
        const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
        const resizeObserverRef = useRef<ResizeObserver | null>(null);

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
            resizeObserverRef.current = new ResizeObserver((_) => {
                if (isRestoring.current && scrollStateRef.current?.isActive) {
                    // Re-run restoration if content is still changing
                    restoreScrollPosition();
                }
            });

            resizeObserverRef.current.observe(container);

            return () => {
                if (resizeObserverRef.current) {
                    resizeObserverRef.current.disconnect();
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
                if (resizeObserverRef.current) {
                    resizeObserverRef.current.disconnect();
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

        const handleUserProfileDialog = useCallback((user: types.User) => {
            setProfileDialogOpen(true);
            setProfileDialogData(user);
        }, []);

        const handleClose = () => {
            setContextMenu(null);
        };

        const handleReply = () => {
            if (contextMenu) {
                onReply(contextMenu.message);
                handleClose();
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
                handleClose();
            }
        };

        const handleDelete = () => {
            if (contextMenu) {
                onDeleteMessage(contextMenu.message);
                handleClose();
            }
        };

        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "center",
                                        my: 2,
                                    }}
                                >
                                    <Chip
                                        label={formatDate(message.timestamp)}
                                        sx={{
                                            bgcolor: "surface.main",
                                            color: "text.secondary",
                                            fontWeight: 500,
                                            fontSize: "0.75rem",
                                            height: 28,
                                            "& .MuiChip-label": {
                                                px: 1.5,
                                            },
                                        }}
                                    />
                                </Box>
                            )}
                            {isFirstUnread && (
                                <Box
                                    ref={isFirstUnread ? firstUnreadRef : null}
                                    sx={{
                                        display: "flex",
                                        justifyContent: "center",
                                        my: 2,
                                    }}
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
                                            "& .MuiChip-label": {
                                                px: 1.5,
                                            },
                                        }}
                                    />
                                </Box>
                            )}
                            <Message
                                message={message}
                                currentUser={currentUser}
                                sequenceType={sequenceType}
                                onCtxMenu={handleContextMenu}
                                onProfileView={handleUserProfileDialog}
                                onReplyClick={onReplyClick}
                                isHighlighted={highlightedMessageId === message.id}
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
                <Menu
                    open={contextMenu !== null}
                    onClose={handleClose}
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
                    <MenuItem
                        onClick={handleReply}
                        sx={{
                            "&:hover": {
                                bgcolor: "action.hover",
                            },
                        }}
                    >
                        <ListItemIcon sx={{ color: "text.secondary" }}>
                            <Reply fontSize="small" />
                        </ListItemIcon>
                        <ListItemText sx={{ color: "text.primary" }}>Reply</ListItemText>
                    </MenuItem>
                    <MenuItem
                        onClick={handleCopyText}
                        sx={{
                            "&:hover": {
                                bgcolor: "action.hover",
                            },
                        }}
                    >
                        <ListItemIcon sx={{ color: "text.secondary" }}>
                            <ContentCopy fontSize="small" />
                        </ListItemIcon>
                        <ListItemText sx={{ color: "text.primary" }}>Copy Text</ListItemText>
                    </MenuItem>
                    {/* TODO: check if user is group ADMIN*/}
                    {(currentUser.is_superuser ||
                        isChatGroupOwner ||
                        currentUser.id === contextMenu?.message.user.id) && (
                        <MenuItem
                            onClick={handleDelete}
                            sx={{
                                "&:hover": {
                                    bgcolor: "action.hover",
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: "error.main" }}>
                                <Delete fontSize="small" />
                            </ListItemIcon>
                            <ListItemText sx={{ color: "error.main" }}>Delete Message</ListItemText>
                        </MenuItem>
                    )}
                </Menu>
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
            </Box>
        );
    },
);
