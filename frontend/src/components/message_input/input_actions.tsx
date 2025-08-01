import { memo } from "react";
import { CircularProgress, IconButton, Popover, Stack } from "@mui/material";
import { AttachFile, Done, Send, SentimentSatisfiedAlt } from "@mui/icons-material";
import EmojiPicker, { EmojiClickData, EmojiStyle, Theme } from "emoji-picker-react";
import { StyledTooltip } from "../styled";

type MessageInputActionsProps = {
    isEditingMessage: boolean;
    newMessage: string;
    files: File[];
    isConnected: boolean;
    loading: boolean;
    emojiPickerAnchor: HTMLElement | null;
    onEmojiClick: (emojiObject: EmojiClickData) => void;
    onEmojiPickerOpen: (event: React.MouseEvent<HTMLElement>) => void;
    onEmojiPickerClose: () => void;
    onAttachClick: () => void;
    onSendMessage: () => void;
    children: React.ReactNode;
};

export const MessageInputActions = memo(
    ({
        isEditingMessage,
        newMessage,
        files,
        isConnected,
        loading,
        emojiPickerAnchor,
        onEmojiClick,
        onEmojiPickerOpen,
        onEmojiPickerClose,
        onAttachClick,
        onSendMessage,
        children,
    }: MessageInputActionsProps) => {
        return (
            <Stack direction="row" spacing={1} alignItems="center">
                <StyledTooltip title="Attach file">
                    <IconButton
                        onClick={onAttachClick}
                        disabled={isEditingMessage}
                        sx={{
                            color: "text.secondary",
                            "&:hover": {
                                color: "primary.main",
                                backgroundColor: "action.hover",
                            },
                        }}
                    >
                        <AttachFile />
                    </IconButton>
                </StyledTooltip>
                {children}
                <StyledTooltip title="Emojis">
                    <IconButton
                        onClick={onEmojiPickerOpen}
                        sx={{
                            color: "text.secondary",
                            "&:hover": {
                                color: "primary.main",
                                backgroundColor: "action.hover",
                            },
                        }}
                    >
                        <SentimentSatisfiedAlt />
                    </IconButton>
                </StyledTooltip>
                <Popover
                    open={Boolean(emojiPickerAnchor)}
                    anchorEl={emojiPickerAnchor}
                    onClose={onEmojiPickerClose}
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    transformOrigin={{ vertical: "bottom", horizontal: "right" }}
                    slotProps={{
                        paper: {
                            sx: {
                                bgcolor: "background.paper",
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                            },
                        },
                    }}
                >
                    <EmojiPicker
                        emojiStyle={EmojiStyle.NATIVE}
                        width={350}
                        height={400}
                        onEmojiClick={onEmojiClick}
                        theme={Theme.DARK}
                    />
                </Popover>
                <IconButton
                    onClick={onSendMessage}
                    disabled={(!newMessage.trim() && files.length === 0) || !isConnected}
                    sx={{
                        color: "primary.main",
                        "&:disabled": {
                            color: "text.disabled",
                        },
                        "&:hover:not(:disabled)": {
                            backgroundColor: "action.hover",
                            color: "primary.light",
                        },
                    }}
                >
                    {loading ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : isEditingMessage ? (
                        <Done />
                    ) : (
                        <Send />
                    )}
                </IconButton>
            </Stack>
        );
    },
);
