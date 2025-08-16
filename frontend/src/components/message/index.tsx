import { memo, useRef, useState } from "react";
import { formatTime } from "../../helpers/format";
import * as types from "../../api/types";
import { Box, Stack, Avatar, Typography, useTheme, Fade, IconButton } from "@mui/material";
import { AddReaction, Reply } from "@mui/icons-material";
import { MediaGrid } from "./media_grid";
import { ImageViewer } from "./image_viewer";
import { ReactionsDisplay } from "./reactions_display";

// Defines the position of a message within a sequence from the same user.
export type MessageSequenceType = "single" | "first" | "middle" | "last";

type MessageProps = {
    message: types.Message;
    currentUser: types.User;
    sequenceType: MessageSequenceType;
    isHighlighted: boolean;
    onCtxMenu: (event: React.MouseEvent, message: types.Message) => void;
    onProfileView: (user: types.User) => void;
    onReplyClick: (messageId: number) => void;
    onReactionPickerShow: (message: types.Message, element: HTMLElement) => void;
    isReactionPickerOpen: boolean;
    onToggleReaction: (
        messageId: types.Message,
        emoji: string,
        isReactionSet?: types.MessageReaction,
    ) => void;
    setShowReactionsDialog: (value: boolean) => void;
};

const avatarSize = 40;

export const Message = memo(
    ({
        message,
        currentUser,
        sequenceType,
        onCtxMenu,
        onProfileView,
        onReplyClick,
        isHighlighted,
        onReactionPickerShow,
        isReactionPickerOpen,
        onToggleReaction,
        setShowReactionsDialog,
    }: MessageProps) => {
        const theme = useTheme();
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

        const [showReactionButton, setShowReactionButton] = useState(false);
        const reactionButtonRef = useRef<HTMLButtonElement>(null);
        const messageContainerRef = useRef<HTMLDivElement>(null);

        const handleToggleReaction = (emoji: string) => {
            const userReaction = message.reactions.find(
                (reaction) => reaction.user.id === currentUser.id,
            );
            onToggleReaction(message, emoji, userReaction);
        };

        const handleShowReactionPicker = () => {
            if (reactionButtonRef.current) {
                onReactionPickerShow(message, reactionButtonRef.current);
            }
        };

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

        const handleMouseEnter = () => {
            setShowReactionButton(true);
        };

        const handleMouseLeave = (event: React.MouseEvent) => {
            // Check if we're moving to the reaction button or reactions area
            const relatedTarget = event.relatedTarget as HTMLElement;
            if (
                messageContainerRef.current &&
                relatedTarget &&
                (messageContainerRef.current.contains(relatedTarget) ||
                    relatedTarget.closest("[data-reaction-area]"))
            ) {
                return; // Don't hide if moving within the message area
            }
            setShowReactionButton(false);
        };

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
                    case "single":
                    case "last":
                        return `${borderRadius} ${borderRadius} ${borderRadius} ${sharpRadius}`;
                    default:
                        return borderRadius;
                }
            }
        };

        const hasMedia = message.media && message.media.length > 0;
        const hasContent = message.content && message.content.trim().length > 0;
        const hasReactions = message.reactions && message.reactions.length > 0;

        return (
            <Stack
                direction="row"
                justifyContent={isOwnMessage ? "flex-end" : "flex-start"}
                alignItems="flex-start"
                sx={{
                    transition: "background-color 0.3s ease",
                    backgroundColor: isHighlighted ? "action.hover" : "transparent",
                    borderRadius: 2,
                    py: isHighlighted ? 1 : 0,
                    px: isHighlighted ? 1 : 0,
                    my: 0.5,
                }}
            >
                <Stack
                    direction={isOwnMessage ? "row-reverse" : "row"}
                    spacing={1}
                    alignItems="flex-start"
                    sx={{
                        maxWidth: { xs: "85%", sm: "75%", md: "65%" },
                        minWidth: 0,
                    }}
                >
                    {showAvatar && (
                        <Box
                            onClick={() => {
                                onProfileView(message.user);
                            }}
                            sx={{
                                cursor: "pointer",
                                alignSelf: "flex-end",
                                mb: hasReactions ? 4 : 0, // Add margin when reactions are present
                            }}
                        >
                            {message.user.profile.avatar_img ? (
                                <Avatar
                                    sx={{
                                        width: avatarSize,
                                        height: avatarSize,
                                    }}
                                >
                                    <img
                                        src={message.user.profile.avatar_img}
                                        alt="User Avatar"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: "50%",
                                        }}
                                    />
                                </Avatar>
                            ) : (
                                <Avatar
                                    sx={{
                                        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                                        width: avatarSize,
                                        height: avatarSize,
                                        flexShrink: 0,
                                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                                        fontWeight: 600,
                                        fontSize: "0.875rem",
                                    }}
                                >
                                    {message.user.username.charAt(0).toUpperCase()}
                                </Avatar>
                            )}
                        </Box>
                    )}

                    <Box
                        ref={messageContainerRef}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        sx={{
                            minWidth: 0,
                            width: "100%",
                            position: "relative",
                        }}
                        data-reaction-area
                    >
                        <div onContextMenu={(e) => onCtxMenu(e, message)}>
                            {/* Replied message section */}
                            {message.reply_to && (
                                <Box
                                    onClick={() => onReplyClick(message.reply_to!.id)}
                                    sx={{
                                        p: 1.5,
                                        mb: 1,
                                        bgcolor: isOwnMessage ? "primary.dark" : "surface.main",
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
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            bgcolor: isOwnMessage ? "primary.dark" : "action.hover",
                                            transform: "translateY(-1px)",
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
                                    px: hasMedia && !hasContent ? 0.5 : 0.75,
                                    py: 0.5,
                                    borderRadius: getBorderRadius(),
                                    color: isOwnMessage ? "common.white" : "text.primary",
                                    bgcolor: isOwnMessage ? "primary.main" : "background.paper",
                                    width: needsPadding
                                        ? `calc(100% - ${avatarSize + 8}px)`
                                        : undefined,
                                    marginLeft: needsPadding ? `${avatarSize + 8}px` : undefined,
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    minWidth: hasMedia && !hasContent ? "auto" : "80px",
                                    boxShadow: isOwnMessage
                                        ? "0 2px 8px rgba(59, 130, 246, 0.2)"
                                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                                    border: isOwnMessage
                                        ? "none"
                                        : `1px solid ${theme.palette.divider}`,
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        transform: "translateY(-1px)",
                                        boxShadow: isOwnMessage
                                            ? "0 4px 16px rgba(59, 130, 246, 0.3)"
                                            : "0 4px 16px rgba(0, 0, 0, 0.15)",
                                    },
                                }}
                            >
                                {/* Username header inside bubble for other users */}
                                {showUsername && (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "flex-start",
                                            mb: 0.5,
                                            borderBottom: `1px solid ${theme.palette.divider}`,
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
                                                lineHeight: 1.5,
                                                fontSize: "0.95rem",
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
                                            fontWeight="600"
                                            sx={{
                                                fontSize: "0.85rem",
                                                color: isOwnMessage
                                                    ? "rgba(255, 255, 255, 0.9)"
                                                    : "primary.main",
                                                cursor: "pointer",
                                                textDecoration: "underline",
                                                transition: "opacity 0.2s ease",
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
                                        mt: hasContent || hasMedia ? 0.1 : 0,
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
                                            fontWeight: 500,
                                        }}
                                    >
                                        {formatTime(message.timestamp)}
                                    </Typography>
                                </Box>
                            </Box>
                        </div>

                        {/* Reactions at the bottom */}
                        {hasReactions && (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                                    mt: 0.5,
                                    ml: needsPadding ? `${avatarSize + 8}px` : 0,
                                    position: "relative",
                                    zIndex: 1,
                                }}
                                data-reaction-area
                            >
                                <ReactionsDisplay
                                    reactions={message.reactions}
                                    currentUser={currentUser}
                                    onToggleReaction={handleToggleReaction}
                                    setShowReactionsDialog={setShowReactionsDialog}
                                />
                            </Box>
                        )}

                        {/* Reaction Picker Button */}
                        <Fade in={showReactionButton || isReactionPickerOpen} timeout={300}>
                            <IconButton
                                ref={reactionButtonRef}
                                onClick={handleShowReactionPicker}
                                size="small"
                                sx={{
                                    position: "absolute",
                                    top: hasReactions ? 6 : "50%",
                                    transform: hasReactions ? "translateY(0)" : "translateY(-50%)",
                                    [isOwnMessage ? "left" : "right"]: -40,
                                    bgcolor: "background.paper",
                                    border: `1px solid ${theme.palette.divider}`,
                                    color: "text.secondary",
                                    width: 28,
                                    height: 28,
                                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                                    zIndex: 2,
                                    "&:hover": {
                                        bgcolor: "action.hover",
                                        color: "primary.main",
                                        transform: hasReactions
                                            ? "translateY(-2px) scale(1.1)"
                                            : "translateY(-50%) scale(1.1)",
                                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
                                        borderColor: "primary.main",
                                    },
                                    "&:active": {
                                        transform: hasReactions
                                            ? "translateY(0) scale(1.05)"
                                            : "translateY(-50%) scale(1.05)",
                                    },
                                }}
                                data-reaction-area
                            >
                                <AddReaction fontSize="small" />
                            </IconButton>
                        </Fade>
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
