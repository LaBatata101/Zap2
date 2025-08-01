import { useCallback, useEffect, useRef, useState } from "react";
import * as types from "../../api/types";
import { EmojiClickData } from "emoji-picker-react";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import { Close, PowerOff } from "@mui/icons-material";
import { MessageInputActions } from "./input_actions";
import { MediaPreview } from "./media_preview";
import { FilePreviewModal } from "./file_preview";

export const MessageInput = ({
    isConnected,
    onSendMessage,
    onEditMessageComplete,
    replyingTo,
    messageEdit,
    onCancelReply,
    onCancelMessageEdit,
}: {
    isConnected: boolean;
    onSendMessage: (content: string, files: File[]) => Promise<void>;
    onEditMessageComplete: (newContent: string) => Promise<void>;
    replyingTo: types.Message | null;
    messageEdit: types.Message | null;
    onCancelReply: () => void;
    onCancelMessageEdit: () => void;
}) => {
    const [newMessage, setNewMessage] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<HTMLElement | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textFieldRef = useRef<HTMLDivElement>(null);
    const isEditingMessage = messageEdit !== null;

    useEffect(() => {
        if (messageEdit) {
            setNewMessage(messageEdit.content);
        }

        if ((replyingTo || messageEdit) && textFieldRef.current) {
            const inputElement = textFieldRef.current?.querySelector("textarea");
            if (inputElement) {
                inputElement.focus();
            }
        }
    }, [replyingTo, messageEdit]);

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && files.length === 0) || loading) return;
        setLoading(true);
        try {
            if (messageEdit) {
                await onEditMessageComplete(newMessage.trim());
            } else {
                await onSendMessage(newMessage.trim(), files);
            }
            setNewMessage("");
            setFiles([]);
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelMessageEdit = useCallback(() => {
        setNewMessage("");
        onCancelMessageEdit();
    }, []);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            setFiles((prevFiles) => [...prevFiles, ...newFiles]);
        }
        event.target.value = "";
    };

    const handleRemoveFile = (fileToRemove: File) => {
        setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
    };

    const handlePreviewFile = (file: File) => {
        setPreviewFile(file);
    };

    const handleClosePreview = () => {
        setPreviewFile(null);
    };

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        if (!isEditingMessage && e.dataTransfer.files) {
            const droppedFiles = Array.from(e.dataTransfer.files).filter(
                (file) => file.type.startsWith("image/") || file.type.startsWith("video/"),
            );
            setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
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
        <Box
            sx={{
                p: 2,
                borderTop: 1,
                borderColor: "divider",
                backgroundColor: "background.paper",
                position: "relative",
            }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Drag overlay */}
            {!isEditingMessage && dragOver && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: "rgba(59, 130, 246, 0.15)",
                        border: "2px dashed",
                        borderColor: "primary.main",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10,
                    }}
                >
                    <Typography variant="h6" color="primary.main">
                        Drop files here to attach
                    </Typography>
                </Box>
            )}

            {/* Reply section */}
            {replyingTo && (
                <Box
                    sx={{
                        p: 1.5,
                        mb: 1,
                        bgcolor: "rgba(59, 130, 246, 0.1)",
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
                    <IconButton
                        size="small"
                        onClick={onCancelReply}
                        sx={{
                            color: "text.secondary",
                            "&:hover": {
                                color: "error.main",
                                backgroundColor: "action.hover",
                            },
                        }}
                    >
                        <Close fontSize="small" />
                    </IconButton>
                </Box>
            )}

            {/* Edit message section */}
            {messageEdit && (
                <Box
                    sx={{
                        p: 1.5,
                        mb: 1,
                        bgcolor: "rgba(59, 130, 246, 0.1)",
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
                            Edit message
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                            {messageEdit.content}
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={handleCancelMessageEdit}
                        sx={{
                            color: "text.secondary",
                            "&:hover": {
                                color: "error.main",
                                backgroundColor: "action.hover",
                            },
                        }}
                    >
                        <Close fontSize="small" />
                    </IconButton>
                </Box>
            )}

            {/* Enhanced Media Preview */}
            <MediaPreview
                files={files}
                onRemoveFile={handleRemoveFile}
                onPreviewFile={handlePreviewFile}
            />

            <MessageInputActions
                isEditingMessage={isEditingMessage}
                newMessage={newMessage}
                files={files}
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
                    onChange={handleFileChange}
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
                                backgroundColor: "background.default",
                                color: "text.primary",
                                "& .MuiInputBase-input::placeholder": {
                                    color: "text.secondary",
                                    opacity: 0.7,
                                },
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
                    <PowerOff sx={{ fontSize: 14, mr: 0.5 }} /> You're disconnected. Reconnecting...
                </Typography>
            )}

            {/* File Preview Modal */}
            <FilePreviewModal file={previewFile} onClose={handleClosePreview} />
        </Box>
    );
};
