import { memo, useState } from "react";
import { formatTime } from "../../helpers/format";
import * as types from "../../api/types";
import { Box, Stack, Avatar, Typography } from "@mui/material";
import { Reply } from "@mui/icons-material";
import { MediaGrid } from "./media_grid";
import { ImageViewer } from "./image_viewer";

// Defines the position of a message within a sequence from the same user.
export type MessageSequenceType = "single" | "first" | "middle" | "last";

type MessageProps = {
    message: types.Message;
    currentUser: types.User;
    sequenceType: MessageSequenceType;
    onCtxMenu: (event: React.MouseEvent, message: types.Message) => void;
    onReplyClick: (messageId: number) => void;
    isHighlighted: boolean;
};

const avatarSize = 32;

export const Message = memo(
    ({
        message,
        currentUser,
        sequenceType,
        onCtxMenu,
        onReplyClick,
        isHighlighted,
    }: MessageProps) => {
        const isOwnMessage = message.user.id === currentUser.id;
        const showAvatar = !isOwnMessage && (sequenceType === "single" || sequenceType === "last");
        const showUsername =
            !isOwnMessage && (sequenceType === "single" || sequenceType === "first");
        const needsPadding =
            (!isOwnMessage && sequenceType === "middle") || sequenceType === "first";

        const characterLimit = 1000;
        const [isExpanded, setIsExpanded] = useState(false);
        const isLongMessage = message.content.length > characterLimit;
        const displayContent =
            isLongMessage && !isExpanded
                ? message.content.slice(0, characterLimit)
                : message.content;

        const [lightboxOpen, setLightboxOpen] = useState(false);
        const [currentImageIndex, setCurrentImageIndex] = useState(0);

        const handleOpenLightbox = (index: number) => {
            setCurrentImageIndex(index);
            setLightboxOpen(true);
        };

        const handleCloseLightbox = () => {
            setLightboxOpen(false);
        };

        const handleNavigateImage = (index: number) => {
            setCurrentImageIndex(index);
        };

        /**
         * Calculates the border radius for the message bubble to create a grouped effect.
         * @returns The CSS border-radius value.
         */
        const getBorderRadius = () => {
            const borderRadius = "1rem";
            const sharpRadius = "0.25rem";

            if (isOwnMessage) {
                switch (sequenceType) {
                    case "single":
                    case "last":
                        return `${borderRadius} ${borderRadius} ${sharpRadius} ${borderRadius}`;
                    default:
                        return borderRadius;
                }
            } else {
                switch (sequenceType) {
                    case "first":
                        return `${borderRadius} ${borderRadius} ${borderRadius} ${sharpRadius}`;
                    case "single":
                    case "last":
                        return `${sharpRadius} ${borderRadius} ${borderRadius} ${borderRadius}`;
                    default:
                        return borderRadius;
                }
            }
        };

        const hasMedia = message.media && message.media.length > 0;
        const hasContent = message.content && message.content.trim().length > 0;

        return (
            <Stack
                direction="row"
                justifyContent={isOwnMessage ? "flex-end" : "flex-start"}
                alignItems={showAvatar ? "flex-end" : "flex-start"}
                sx={{
                    transition: "background-color 0.5s ease",
                    backgroundColor: isHighlighted ? "rgba(25, 118, 210, 0.1)" : "transparent",
                    borderRadius: 2,
                    py: isHighlighted ? 1 : 0,
                    my: 0.5,
                }}
            >
                <Stack
                    direction={isOwnMessage ? "row-reverse" : "row"}
                    spacing={1}
                    alignItems="center"
                    sx={{
                        maxWidth: { xs: "85%", sm: "75%", md: "65%" },
                        minWidth: 0,
                    }}
                >
                    {showAvatar && (
                        <Avatar
                            sx={{
                                bgcolor: "primary.main",
                                width: avatarSize,
                                height: avatarSize,
                                flexShrink: 0,
                            }}
                        >
                            {message.user.username.charAt(0).toUpperCase()}
                        </Avatar>
                    )}

                    <Box
                        sx={{
                            minWidth: 0,
                            width: "100%",
                        }}
                    >
                        <div onContextMenu={(e) => onCtxMenu(e, message)}>
                            {/* Replied message section */}
                            {message.reply_to && (
                                <Box
                                    onClick={() => onReplyClick(message.reply_to!.id)}
                                    sx={{
                                        p: 1.5,
                                        mb: 1,
                                        bgcolor: isOwnMessage ? "primary.dark" : "grey.300",
                                        borderRadius: "8px",
                                        borderLeft: 3,
                                        borderColor: isOwnMessage
                                            ? "rgba(255, 255, 255, 0.5)"
                                            : "primary.main",
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 1,
                                        width: needsPadding
                                            ? `calc(100% - ${avatarSize + 8}px)`
                                            : undefined,
                                        marginLeft: needsPadding
                                            ? `${avatarSize + 8}px`
                                            : undefined,
                                        position: "relative",
                                        overflow: "hidden",
                                        cursor: "pointer",
                                        "&:hover": {
                                            bgcolor: isOwnMessage ? "primary.dark" : "grey.400",
                                        },
                                    }}
                                >
                                    <Reply
                                        fontSize="small"
                                        sx={{
                                            color: isOwnMessage
                                                ? "rgba(255, 255, 255, 0.7)"
                                                : "primary.main",
                                            mt: 0.25,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography
                                            variant="caption"
                                            fontWeight="600"
                                            color={
                                                isOwnMessage
                                                    ? "rgba(255, 255, 255, 0.9)"
                                                    : "primary.main"
                                            }
                                            sx={{
                                                display: "block",
                                                mb: 0.25,
                                            }}
                                        >
                                            {message.reply_to.user.username}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color={
                                                isOwnMessage
                                                    ? "rgba(255, 255, 255, 0.7)"
                                                    : "text.secondary"
                                            }
                                            sx={{
                                                display: "block",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            {message.reply_to.content}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            <Box
                                sx={{
                                    px: hasMedia && !hasContent ? 0.5 : 1,
                                    py: hasMedia && !hasContent ? 0.5 : 1,
                                    borderRadius: getBorderRadius(),
                                    color: isOwnMessage ? "common.white" : "text.primary",
                                    bgcolor: isOwnMessage ? "primary.main" : "grey.200",
                                    width: needsPadding
                                        ? `calc(100% - ${avatarSize + 8}px)`
                                        : undefined,
                                    marginLeft: needsPadding ? `${avatarSize + 8}px` : undefined,
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    minWidth: hasMedia && !hasContent ? "auto" : "120px",
                                }}
                            >
                                {/* Username header inside bubble for other users */}
                                {showUsername && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "flex-start",
                                            mb: 0.5,
                                            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                                            pb: 0.5,
                                            mx: hasMedia && !hasContent ? 1.5 : 0,
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            fontWeight="600"
                                            color="primary.main"
                                            sx={{
                                                fontSize: "0.75rem",
                                            }}
                                        >
                                            {message.user.username}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Media section */}
                                {hasMedia && (
                                    <Box
                                        sx={{
                                            mb: hasContent ? 1 : 0,
                                        }}
                                    >
                                        <MediaGrid
                                            media={message.media!}
                                            onImageClick={handleOpenLightbox}
                                            maxHeight={250}
                                        />
                                    </Box>
                                )}

                                {/* Message content */}
                                {hasContent && (
                                    <Box sx={{ px: hasMedia && !hasContent ? 1.5 : 0 }}>
                                        <Typography
                                            sx={{
                                                whiteSpace: "pre-wrap",
                                                wordBreak: "break-word",
                                                overflowWrap: "break-word",
                                            }}
                                        >
                                            {displayContent}
                                            {isLongMessage && !isExpanded && "..."}
                                        </Typography>
                                    </Box>
                                )}

                                {isLongMessage && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "flex-start",
                                            mb: 0.5,
                                            px: hasMedia && !hasContent ? 1.5 : 0,
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            fontWeight="bold"
                                            sx={{
                                                fontSize: "0.85rem",
                                                color: isOwnMessage
                                                    ? "rgba(255, 255, 255, 0.9)"
                                                    : "primary.main",
                                                cursor: "pointer",
                                                textDecoration: "underline",
                                                "&:hover": {
                                                    opacity: 0.8,
                                                },
                                            }}
                                        >
                                            {isExpanded ? "Show less" : "Show more"}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Timestamp in bottom-right corner */}
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        px: hasMedia && !hasContent ? 1.5 : 0,
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        color={
                                            isOwnMessage
                                                ? "rgba(255, 255, 255, 0.7)"
                                                : "text.secondary"
                                        }
                                        sx={{
                                            fontSize: "0.7rem",
                                            opacity: 0.8,
                                        }}
                                    >
                                        {formatTime(message.timestamp)}
                                    </Typography>
                                </Box>
                            </Box>
                        </div>
                    </Box>
                </Stack>

                {/* Image Viewer */}
                {lightboxOpen && hasMedia && (
                    <ImageViewer
                        media={message.media!}
                        currentIndex={currentImageIndex}
                        onClose={handleCloseLightbox}
                        onNavigate={handleNavigateImage}
                    />
                )}
            </Stack>
        );
    },
);
