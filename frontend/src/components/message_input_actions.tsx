import { memo } from "react";
import { CircularProgress, IconButton, Popover, Stack } from "@mui/material";
import { AttachFile, Send, SentimentSatisfiedAlt } from "@mui/icons-material";
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react";
import { StyledTooltip } from "./styled";

type MessageInputActionsProps = {
    newMessage: string;
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
        newMessage,
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
                        sx={{
                            "&:hover": {
                                color: "#1976d2",
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
                            "&:hover": {
                                color: "#1976d2",
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
                >
                    <EmojiPicker
                        emojiStyle={EmojiStyle.NATIVE}
                        width={350}
                        height={400}
                        onEmojiClick={onEmojiClick}
                    />
                </Popover>
                <IconButton
                    onClick={onSendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    sx={{
                        color: "#1976d2",
                        "&:disabled": {
                            color: "#2456a6",
                        },
                    }}
                >
                    {loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                </IconButton>
            </Stack>
        );
    },
);
