import { useCallback, useEffect, useRef, useState } from "react";
import * as types from "../api/types";
import { EmojiClickData } from "emoji-picker-react";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import { Close, PowerOff } from "@mui/icons-material";
import { MessageInputActions } from "./message_input_actions";

export const MessageInput = ({
    isConnected,
    onSendMessage,
    replyingTo,
    onCancelReply,
}: {
    isConnected: boolean;
    onSendMessage: (content: string) => Promise<void>;
    replyingTo: types.Message | null;
    onCancelReply: () => void;
}) => {
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<HTMLElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textFieldRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (replyingTo && textFieldRef.current) {
            const inputElement = textFieldRef.current?.querySelector("textarea");
            if (inputElement) {
                inputElement.focus();
            }
        }
    }, [replyingTo]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || loading) return;
        setLoading(true);
        try {
            await onSendMessage(newMessage.trim());
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleEmojiClick = useCallback((emojiObject: EmojiClickData) => {
        setNewMessage((prev) => prev + emojiObject.emoji);
    }, []);

    const handleAttachClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleEmojiPickerOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setEmojiPickerAnchor(event.currentTarget);
    }, []);

    const handleEmojiPickerClose = useCallback(() => {
        setEmojiPickerAnchor(null);
    }, []);

    return (
        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider", background: "#ffffff" }}>
            {/* Reply section */}
            {replyingTo && (
                <Box
                    sx={{
                        p: 1.5,
                        mb: 1,
                        bgcolor: "grey.100",
                        borderRadius: 1,
                        borderLeft: 3,
                        borderColor: "primary.main",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Box sx={{ overflow: "hidden" }}>
                        <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
                            Reply to {replyingTo.user.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {replyingTo.content}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={onCancelReply}>
                        <Close fontSize="small" />
                    </IconButton>
                </Box>
            )}

            <MessageInputActions
                newMessage={newMessage}
                isConnected={isConnected}
                loading={loading}
                emojiPickerAnchor={emojiPickerAnchor}
                onEmojiClick={handleEmojiClick}
                onEmojiPickerOpen={handleEmojiPickerOpen}
                onEmojiPickerClose={handleEmojiPickerClose}
                onAttachClick={handleAttachClick}
                onSendMessage={handleSendMessage}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: "none" }}
                    onChange={(event) => {
                        const files = event.target.files!;
                        if (files && files.length > 0) {
                            console.log(files);
                        }
                        event.target.value = "";
                    }}
                    multiple
                    accept="image/*"
                />
                <TextField
                    ref={textFieldRef}
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={!isConnected}
                    size="small"
                    slotProps={{
                        input: {
                            sx: {
                                borderRadius: "40px",
                            },
                        },
                    }}
                />
            </MessageInputActions>
            {!isConnected && (
                <Typography
                    variant="caption"
                    color="error"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mt: 1,
                    }}
                >
                    <PowerOff sx={{ fontSize: 14, mr: 0.5 }} /> You're desconnected. Reconnecting...
                </Typography>
            )}
        </Box>
    );
};
