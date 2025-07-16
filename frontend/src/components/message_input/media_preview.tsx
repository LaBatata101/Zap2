import { Box, Card, CardMedia, Fade, IconButton, Typography } from "@mui/material";
import { useState } from "react";
import { StyledTooltip } from "../styled";
import { Close, Fullscreen, Image as ImageIcon } from "@mui/icons-material";

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

    if (files.length === 0) return null;

    return (
        <Fade in={true}>
            <Box
                sx={{
                    mb: 2,
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    border: "1px dashed",
                    borderColor: "grey.300",
                }}
            >
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Media to send ({files.length})
                </Typography>

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
                    {files.map((file, index) => (
                        <Card
                            key={index}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            sx={{
                                position: "relative",
                                height: "100%",
                                cursor: "grab",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                    transform: "scale(1.02)",
                                    boxShadow: 3,
                                    "& .file-info-overlay": {
                                        opacity: 1,
                                    },
                                },
                                "&:active": {
                                    cursor: "grabbing",
                                },
                                opacity: dragIndex === index ? 0.5 : 1,
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

                            {/* File info overlay */}
                            <Box
                                className="file-info-overlay"
                                sx={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bgcolor: "rgba(0, 0, 0, 0.6)",
                                    color: "white",
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
                                    <StyledTooltip title="Preview">
                                        <IconButton
                                            size="small"
                                            onClick={() => onPreviewFile(file)}
                                            sx={{
                                                color: "white",
                                                p: 0.25,
                                                "&:hover": {
                                                    bgcolor: "rgba(255, 255, 255, 0.2)",
                                                },
                                            }}
                                        >
                                            <Fullscreen fontSize="small" />
                                        </IconButton>
                                    </StyledTooltip>

                                    <StyledTooltip title="Remove">
                                        <IconButton
                                            size="small"
                                            onClick={() => onRemoveFile(file)}
                                            sx={{
                                                color: "white",
                                                p: 0.25,
                                                "&:hover": {
                                                    bgcolor: "rgba(255, 0, 0, 0.3)",
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
                                    bgcolor: "rgba(0, 0, 0, 0.7)",
                                    color: "white",
                                    borderRadius: "4px",
                                    px: 0.5,
                                    py: 0.25,
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
                                    bgcolor: "rgba(0, 0, 0, 0.7)",
                                    borderRadius: "50%",
                                    p: 0.25,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {isImage(file) && (
                                    <ImageIcon sx={{ fontSize: 12, color: "white" }} />
                                )}
                            </Box>
                        </Card>
                    ))}
                </Box>
            </Box>
        </Fade>
    );
};
