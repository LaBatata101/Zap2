import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Slider,
    Typography,
    styled,
    Stack,
    Fade,
} from "@mui/material";
import { Close, ZoomIn, ZoomOut, Crop, Check, Refresh } from "@mui/icons-material";
import { CropAvatarData } from "../api/types";

const StyledDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialog-paper": {
        borderRadius: 16,
        backgroundColor: theme.palette.background.paper,
        backgroundImage:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
        minWidth: "500px",
        maxWidth: "600px",
    },
}));

const CropContainer = styled(Box)(({ theme }) => ({
    position: "relative",
    width: "100%",
    height: "400px",
    backgroundColor: theme.palette.grey[100],
    borderRadius: 12,
    overflow: "hidden",
    border: `2px solid ${theme.palette.divider}`,
    cursor: "grab",
    "&:active": {
        cursor: "grabbing",
    },
}));

const CropOverlay = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    width: `${cropSize}px`,
    height: `${cropSize}px`,
    transform: "translate(-50%, -50%)",
    border: `3px solid ${theme.palette.primary.main}`,
    borderRadius: "50%",
    boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`,
    pointerEvents: "none",
    zIndex: 2,
}));

const PreviewContainer = styled(Box)(({ theme }) => ({
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    overflow: "hidden",
    border: `3px solid ${theme.palette.primary.main}`,
    boxShadow: `0 4px 12px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.2)"}`,
    backgroundColor: theme.palette.background.paper,
}));

const ActionButton = styled(Button)(({ theme, variant }) => ({
    borderRadius: 12,
    textTransform: "none",
    fontWeight: 600,
    padding: "10px 20px",
    minHeight: 44,
    ...(variant === "contained" && {
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        boxShadow: `0 4px 16px ${theme.palette.primary.main}40`,
        "&:hover": {
            boxShadow: `0 6px 20px ${theme.palette.primary.main}60`,
            transform: "translateY(-1px)",
        },
    }),
    transition: "all 0.2s ease",
}));

const cropSize = 300; // Size of the crop circle

export const ImageCropEditor = ({
    open,
    onClose,
    image,
    onCropComplete,
}: {
    open: boolean;
    onClose: () => void;
    image: File;
    onCropComplete: (file: File, cropData: CropAvatarData, previewBlob: Blob) => void;
}) => {
    const imageUrl = useMemo(() => URL.createObjectURL(image), [image]);

    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [previewUrl, setPreviewUrl] = useState("");

    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setPreviewUrl("");
        }
    }, [open]);

    // Update preview when position or scale changes
    useEffect(() => {
        if (open && image) {
            updatePreview();
        }
    }, [scale, position, open, image]);

    const handleImageLoad = useCallback(() => {
        if (imageRef.current && containerRef.current) {
            const img = imageRef.current;
            const container = containerRef.current;

            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;

            // Calculate initial scale to fit image in container
            const scaleX = containerWidth / img.naturalWidth;
            const scaleY = containerHeight / img.naturalHeight;
            const initialScale = Math.max(scaleX, scaleY);

            setScale(initialScale);
            setPosition({ x: 0, y: 0 });
        }
    }, []);

    const updatePreview = useCallback(() => {
        if (!imageRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = imageRef.current;

        canvas.width = cropSize;
        canvas.height = cropSize;

        // Clear canvas
        ctx.clearRect(0, 0, cropSize, cropSize);

        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
        ctx.clip();

        // Calculate the source coordinates on the original image
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;

        // Calculate the position of the crop area relative to the scaled image
        const scaledWidth = img.naturalWidth * scale;
        const scaledHeight = img.naturalHeight * scale;

        const imageLeft = centerX - scaledWidth / 2 + position.x;
        const imageTop = centerY - scaledHeight / 2 + position.y;

        const cropLeft = centerX - cropSize / 2;
        const cropTop = centerY - cropSize / 2;

        // Calculate source rectangle on the original image
        const sourceLeft = (cropLeft - imageLeft) / scale;
        const sourceTop = (cropTop - imageTop) / scale;
        const sourceSize = cropSize / scale;

        // Draw the cropped portion
        ctx.drawImage(img, sourceLeft, sourceTop, sourceSize, sourceSize, 0, 0, cropSize, cropSize);

        // Convert to blob for preview
        canvas.toBlob((blob) => {
            if (blob) {
                setPreviewUrl(URL.createObjectURL(blob));
            }
        }, "image/png");
    }, [scale, position]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (e.button === 0) {
                // Left mouse button
                setIsDragging(true);
                setDragStart({
                    x: e.clientX - position.x,
                    y: e.clientY - position.y,
                });
            }
        },
        [position],
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (isDragging) {
                const newX = e.clientX - dragStart.x;
                const newY = e.clientY - dragStart.y;

                // Add boundaries to prevent image from moving too far
                const maxOffset = 100;
                setPosition({
                    x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
                    y: Math.max(-maxOffset, Math.min(maxOffset, newY)),
                });
            }
        },
        [isDragging, dragStart],
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleScaleChange = useCallback((_: Event, newValue: number | number[]) => {
        setScale(newValue as number);
    }, []);

    const handleReset = useCallback(() => {
        if (imageRef.current && containerRef.current) {
            const img = imageRef.current;
            const container = containerRef.current;

            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;

            const scaleX = containerWidth / img.naturalWidth;
            const scaleY = containerHeight / img.naturalHeight;
            const initialScale = Math.max(scaleX, scaleY);

            setScale(initialScale);
            setPosition({ x: 0, y: 0 });
        }
    }, []);

    const handleCropComplete = useCallback(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const cropData: CropAvatarData = {
            x: position.x,
            y: position.y,
            scale: scale,
            containerWidth: containerRef.current.clientWidth,
            containerHeight: containerRef.current.clientHeight,
            cropSize: cropSize,
        };

        canvasRef.current.toBlob(
            (blob) => {
                if (blob) {
                    onCropComplete(image, cropData, blob);
                    onClose();
                }
            },
            "image/png",
            0.9,
        );
        URL.revokeObjectURL(imageUrl);
    }, [onCropComplete, onClose, position, scale]);

    return (
        <StyledDialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            slots={{ transition: Fade }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pb: 1,
                    borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Crop sx={{ color: "primary.main" }} />
                    <Typography variant="h6" fontWeight={600}>
                        Crop Avatar Image
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    sx={{
                        color: "text.secondary",
                        "&:hover": {
                            backgroundColor: (theme) => theme.palette.action.hover,
                            color: "text.primary",
                        },
                    }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                    {/* Main crop area */}
                    <CropContainer
                        ref={containerRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        sx={{
                            cursor: isDragging ? "grabbing" : "grab",
                        }}
                    >
                        <img
                            ref={imageRef}
                            src={imageUrl}
                            alt="Crop preview"
                            onLoad={handleImageLoad}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                transformOrigin: "center",
                                maxWidth: "none",
                                maxHeight: "none",
                                userSelect: "none",
                                pointerEvents: "none",
                            }}
                        />
                        <CropOverlay />
                    </CropContainer>

                    {/* Controls */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        <ZoomOut color="action" />
                        <Slider
                            value={scale}
                            min={0.5}
                            max={3}
                            step={0.1}
                            onChange={handleScaleChange}
                            sx={{ flex: 1 }}
                            size="small"
                        />
                        <ZoomIn color="action" />

                        <ActionButton
                            onClick={handleReset}
                            startIcon={<Refresh />}
                            size="small"
                            sx={{ ml: 2 }}
                        >
                            Reset
                        </ActionButton>
                    </Stack>

                    {/* Preview */}
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                        <Typography variant="body2" color="text.secondary">
                            Preview:
                        </Typography>
                        <PreviewContainer>
                            {previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt="Avatar preview"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            )}
                        </PreviewContainer>
                    </Stack>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 2, gap: 1 }}>
                <ActionButton onClick={onClose} sx={{ color: "text.secondary" }}>
                    Cancel
                </ActionButton>
                <ActionButton
                    onClick={handleCropComplete}
                    variant="contained"
                    startIcon={<Check />}
                >
                    Apply Crop
                </ActionButton>
            </DialogActions>

            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} style={{ display: "none" }} />
        </StyledDialog>
    );
};
