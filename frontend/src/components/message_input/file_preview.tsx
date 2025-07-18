import { Close } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";

export const FilePreviewModal = ({ file, onClose }: { file: File | null; onClose: () => void }) => {
    if (!file) return null;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    return (
        <Box
            sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "rgba(15, 23, 42, 0.95)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                backdropFilter: "blur(8px)",
            }}
            onClick={onClose}
        >
            <Box
                sx={{
                    position: "relative",
                    maxWidth: "90vw",
                    maxHeight: "90vh",
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
                    border: "1px solid",
                    borderColor: "divider",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bgcolor: "rgba(15, 23, 42, 0.9)",
                        color: "text.primary",
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        zIndex: 1,
                        backdropFilter: "blur(8px)",
                        borderBottom: "1px solid",
                        borderBottomColor: "divider",
                    }}
                >
                    <Typography
                        variant="h6"
                        noWrap
                        sx={{
                            color: "text.primary",
                            fontWeight: 600,
                        }}
                    >
                        {file.name}
                    </Typography>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: "text.primary",
                            "&:hover": {
                                bgcolor: "rgba(59, 130, 246, 0.1)",
                                color: "primary.main",
                            },
                        }}
                    >
                        <Close />
                    </IconButton>
                </Box>

                {/* Content */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 400,
                        pt: 8,
                        pb: 2,
                        bgcolor: "background.default",
                    }}
                >
                    {isImage && (
                        <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                                borderRadius: "8px",
                            }}
                        />
                    )}

                    {isVideo && (
                        <video
                            src={URL.createObjectURL(file)}
                            controls
                            style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                borderRadius: "8px",
                            }}
                        />
                    )}
                </Box>
            </Box>
        </Box>
    );
};
