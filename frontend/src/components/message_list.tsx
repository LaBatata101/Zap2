import { memo, useEffect, useRef, useState } from "react";
import * as types from "../api/types";
import { Box, Chip, Fab, ListItemIcon, ListItemText, Menu, MenuItem, Zoom } from "@mui/material";
import { formatDate } from "../helpers/format";
import { Message, MessageSequenceType } from "./message";
import { ContentCopy, KeyboardArrowDown, Reply } from "@mui/icons-material";

type ContextMenuState = {
    mouseX: number;
    mouseY: number;
    message: types.Message;
} | null;

interface MessageListProps {
    messages: types.Message[];
    currentUser: types.User;
    onReply: (message: types.Message) => void;
    onReplyClick: (messageId: number) => void;
    highlightedMessageId?: number;
    firstUnreadIndex: number | null;
    unreadCount: number;
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
    }: MessageListProps) => {
        const messagesEndRef = useRef<HTMLDivElement>(null);
        const scrollContainerRef = useRef<HTMLDivElement>(null);
        const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
        const [showScrollButton, setShowScrollButton] = useState(false);
        const firstUnreadRef = useRef<HTMLDivElement>(null);
        const prevMessagesLength = useRef(0);

        useEffect(() => {
            if (prevMessagesLength.current === 0 && messages.length > 0) {
                if (firstUnreadIndex !== null && firstUnreadRef.current) {
                    // Scroll to the first unread message in the chat
                    firstUnreadRef.current.scrollIntoView({ behavior: "smooth" });
                } else if (messagesEndRef.current) {
                    // Initial scroll to bottom when selecting a chat
                    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
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
            }
        };

        const handleContextMenu = (event: React.MouseEvent, message: types.Message) => {
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
        };

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

        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        };

        return (
            <Box
                ref={scrollContainerRef}
                onScroll={handleScroll}
                sx={{ flex: 1, overflowY: "auto", p: 2, bgcolor: "grey.100" }}
            >
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
                                    <Chip label={formatDate(message.timestamp)} />
                                </Box>
                            )}
                            {isFirstUnread && (
                                <Box
                                    ref={isFirstUnread ? firstUnreadRef : null}
                                    sx={{ display: "flex", justifyContent: "center", my: 2 }}
                                >
                                    <Chip label={`Unread messages: ${unreadCount}`} />
                                </Box>
                            )}
                            <Message
                                message={message}
                                currentUser={currentUser}
                                sequenceType={sequenceType}
                                onCtxMenu={handleContextMenu}
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
                >
                    <MenuItem onClick={handleReply}>
                        <ListItemIcon>
                            <Reply fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Reply</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleCopyText}>
                        <ListItemIcon>
                            <ContentCopy fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Copy Text</ListItemText>
                    </MenuItem>
                </Menu>
            </Box>
        );
    },
);
