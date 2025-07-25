import { Box, Card, CardMedia, Fade, IconButton, Typography, Alert } from "@mui/material";
import { useState } from "react";
import { StyledTooltip } from "../styled";
import { Close, Fullscreen, Image as ImageIcon, Warning } from "@mui/icons-material";

const formatFileSize = (size: number) => {
    if (size < 1024) {
        return `${size}B`;
    } else if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)}KB`;
    } else if (size < 1024 * 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(1)}MB`;
    } else {
        return `${(size / 1024 / 1024 / 1024).toFixed(1)}GB`;
    }
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export const MediaPreview = ({
    files,
    onRemoveFile,
    onPreviewFile,
}: {
    files: File[];
    onRemoveFile: (file: File) => void;
    onPreviewFile: (file: File) => void;
}) => {
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, _: number) => {
        e.preventDefault();
        if (dragIndex === null) return;

        setDragIndex(null);
    };

    const isImage = (file: File) => file.type.startsWith("image/");
    const isFileTooLarge = (file: File) => file.size > MAX_FILE_SIZE;
    const hasOversizedFiles = files.some((file) => isFileTooLarge(file));

    if (files.length === 0) return null;

    return (
        <Fade in={true}>
            <Box
                sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    border: "1px dashed",
                    borderColor: "divider",
                }}
            >
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Media to send ({files.length})
                </Typography>

                {/* Warning message for oversized files */}
                {hasOversizedFiles && (
                    <Alert
                        severity="warning"
                        sx={{
                            mb: 2,
                            fontSize: "0.875rem",
                            bgcolor: "rgba(245, 158, 11, 0.1)",
                            color: "warning.main",
                            border: "1px solid rgba(245, 158, 11, 0.3)",
                            "& .MuiAlert-icon": {
                                fontSize: "1.2rem",
                                color: "warning.main",
                            },
                        }}
                    >
                        Some files exceed the 10MB limit and cannot be sent. Please remove or
                        compress them.
                    </Alert>
                )}

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "repeat(2, 1fr)",
                            sm: "repeat(3, 1fr)",
                            md: "repeat(4, 1fr)",
                        },
                        gap: 1.5,
                        gridAutoRows: "150px",
                        maxHeight: files.length > 4 ? 180 : "auto",
                        overflowY: files.length > 4 ? "auto" : "visible",
                    }}
                >
                    {files.map((file, index) => {
                        const isOversized = isFileTooLarge(file);

                        return (
                            <Card
                                key={index}
                                draggable={!isOversized}
                                onDragStart={(e) => !isOversized && handleDragStart(e, index)}
                                onDragOver={!isOversized ? handleDragOver : undefined}
                                onDrop={(e) => !isOversized && handleDrop(e, index)}
                                sx={{
                                    position: "relative",
                                    height: "100%",
                                    cursor: isOversized ? "not-allowed" : "grab",
                                    transition: "all 0.2s ease",
                                    border: isOversized ? "2px solid" : "1px solid",
                                    borderColor: isOversized ? "error.main" : "divider",
                                    bgcolor: "surface.main",
                                    "&:hover": {
                                        transform: isOversized ? "none" : "scale(1.02)",
                                        boxShadow: isOversized
                                            ? "0 4px 12px rgba(239, 68, 68, 0.3)"
                                            : "0 4px 12px rgba(59, 130, 246, 0.3)",
                                        borderColor: isOversized ? "error.main" : "primary.main",
                                        "& .file-info-overlay": {
                                            opacity: 1,
                                        },
                                    },
                                    "&:active": {
                                        cursor: isOversized ? "not-allowed" : "grabbing",
                                    },
                                    opacity: dragIndex === index ? 0.5 : isOversized ? 0.7 : 1,
                                    filter: isOversized ? "grayscale(0.3)" : "none",
                                }}
                            >
                                {isImage(file) && (
                                    <CardMedia
                                        component="img"
                                        image={URL.createObjectURL(file)}
                                        alt={file.name}
                                        sx={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                )}

                                {/* Error overlay for oversized files */}
                                {isOversized && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            bgcolor: "rgba(15, 23, 42, 0.7)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexDirection: "column",
                                            gap: 0.5,
                                        }}
                                    >
                                        <Warning
                                            sx={{ fontSize: 28, color: "error.main", mb: 0.5 }}
                                        />
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "error.main",
                                                fontWeight: "600",
                                                textAlign: "center",
                                                px: 1,
                                                fontSize: "0.75rem",
                                                textShadow: "0 0 2px rgba(15, 23, 42, 0.8)",
                                            }}
                                        >
                                            File too large
                                        </Typography>
                                    </Box>
                                )}

                                {/* File info overlay */}
                                <Box
                                    className="file-info-overlay"
                                    sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bgcolor: isOversized
                                            ? "rgba(239, 68, 68, 0.9)"
                                            : "rgba(15, 23, 42, 0.8)",
                                        color: "text.primary",
                                        p: 0.5,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        opacity: 0,
                                        transition: "opacity 0.2s ease",
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontSize: "0.65rem",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            flex: 1,
                                        }}
                                    >
                                        {file.name}
                                    </Typography>

                                    <Box sx={{ display: "flex", gap: 0.5 }}>
                                        <StyledTooltip
                                            title={
                                                isOversized
                                                    ? "Cannot preview oversized file"
                                                    : "Preview"
                                            }
                                        >
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        !isOversized && onPreviewFile(file)
                                                    }
                                                    disabled={isOversized}
                                                    sx={{
                                                        color: "text.primary",
                                                        p: 0.25,
                                                        "&:hover": {
                                                            bgcolor: isOversized
                                                                ? "transparent"
                                                                : "rgba(59, 130, 246, 0.3)",
                                                        },
                                                        "&:disabled": {
                                                            color: "rgba(255, 255, 255, 0.5)",
                                                        },
                                                    }}
                                                >
                                                    <Fullscreen fontSize="small" />
                                                </IconButton>
                                            </span>
                                        </StyledTooltip>

                                        <StyledTooltip title="Remove">
                                            <IconButton
                                                size="small"
                                                onClick={() => onRemoveFile(file)}
                                                sx={{
                                                    color: "text.primary",
                                                    p: 0.25,
                                                    "&:hover": {
                                                        bgcolor: "rgba(239, 68, 68, 0.3)",
                                                    },
                                                }}
                                            >
                                                <Close fontSize="small" />
                                            </IconButton>
                                        </StyledTooltip>
                                    </Box>
                                </Box>

                                {/* File size badge */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 4,
                                        right: 4,
                                        bgcolor: isOversized
                                            ? "error.main"
                                            : "rgba(15, 23, 42, 0.8)",
                                        color: "text.primary",
                                        borderRadius: "4px",
                                        px: 0.5,
                                        py: 0.25,
                                        fontWeight: isOversized ? "bold" : "normal",
                                        border: isOversized
                                            ? "none"
                                            : "1px solid rgba(59, 130, 246, 0.3)",
                                    }}
                                >
                                    <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
                                        {formatFileSize(file.size)}
                                    </Typography>
                                </Box>

                                {/* File type icon */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 4,
                                        left: 4,
                                        bgcolor: isOversized
                                            ? "error.main"
                                            : "rgba(15, 23, 42, 0.8)",
                                        borderRadius: "50%",
                                        p: 0.25,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: isOversized
                                            ? "none"
                                            : "1px solid rgba(59, 130, 246, 0.3)",
                                    }}
                                >
                                    {isImage(file) && (
                                        <ImageIcon sx={{ fontSize: 12, color: "text.primary" }} />
                                    )}
                                </Box>

                                {/* Bottom warning message for oversized files */}
                                {isOversized && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            bgcolor: "error.main",
                                            color: "text.primary",
                                            p: 0.5,
                                            textAlign: "center",
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{ fontSize: "0.65rem", fontWeight: "bold" }}
                                        >
                                            Exceeds 10MB limit
                                        </Typography>
                                    </Box>
                                )}
                            </Card>
                        );
                    })}
                </Box>
            </Box>
        </Fade>
    );
};
