import { Box, IconButton, Modal, Typography } from "@mui/material";
import * as types from "../../api/types";
import { ChevronLeft, ChevronRight, Close, Download } from "@mui/icons-material";

export const ImageViewer = ({
    media,
    currentIndex,
    onClose,
    onNavigate,
}: {
    media: types.Media[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
}) => {
    const handlePrevious = () => {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : media.length - 1;
        onNavigate(newIndex);
    };

    const handleNext = () => {
        const newIndex = currentIndex < media.length - 1 ? currentIndex + 1 : 0;
        onNavigate(newIndex);
    };

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = media[currentIndex].file;
        link.download = `image_${currentIndex + 1}`;
        link.click();
    };

    return (
        <Modal open={true} onClose={onClose}>
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    boxShadow: 24,
                    width: "90vw",
                    height: "90vh",
                    maxWidth: "1200px",
                    maxHeight: "800px",
                    borderRadius: 2,
                    outline: "none",
                    display: "grid",
                    gridTemplateAreas: `
            "header header header"
            "nav-left main nav-right"
            "thumbnails thumbnails thumbnails"
          `,
                    gridTemplateColumns: "auto 1fr auto",
                    gridTemplateRows: "auto 1fr auto",
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        gridArea: "header",
                        height: 64,
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 2,
                        borderRadius: "8px 8px 0 0",
                    }}
                >
                    <Typography variant="h6" color="white">
                        {currentIndex + 1} of {media.length}
                    </Typography>
                    <Box>
                        <IconButton onClick={handleDownload} sx={{ color: "white", mr: 1 }}>
                            <Download />
                        </IconButton>
                        <IconButton onClick={onClose} sx={{ color: "white" }}>
                            <Close />
                        </IconButton>
                    </Box>
                </Box>

                {/* Navigation Left */}
                <IconButton
                    onClick={handlePrevious}
                    sx={{
                        gridArea: "nav-left",
                        alignSelf: "center",
                        color: "white",
                        bgcolor: "rgba(255, 255, 255, 0.2)",
                        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
                        ml: 2,
                    }}
                >
                    <ChevronLeft />
                </IconButton>

                {/* Main Image */}
                <Box
                    sx={{
                        gridArea: "main",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "300px",
                        maxHeight: "calc(90vh - 144px)", // Accounts for header + thumbnails
                        overflow: "hidden",
                    }}
                >
                    <img
                        src={media[currentIndex].file}
                        alt="lightbox"
                        style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                        }}
                    />
                </Box>

                {/* Navigation Right */}
                <IconButton
                    onClick={handleNext}
                    sx={{
                        gridArea: "nav-right",
                        alignSelf: "center",
                        color: "white",
                        bgcolor: "rgba(255, 255, 255, 0.2)",
                        "&:hover": { bgcolor: "rgba(255, 255, 255, 0.3)" },
                        mr: 2,
                    }}
                >
                    <ChevronRight />
                </IconButton>

                {/* Thumbnails */}
                <Box
                    sx={{
                        gridArea: "thumbnails",
                        overflowX: "auto",
                        whiteSpace: "nowrap",
                        padding: "10px 0",
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    {media.map((mediaItem, index) => (
                        <Box
                            key={mediaItem.id}
                            component="img"
                            src={mediaItem.file}
                            alt="thumbnail"
                            onClick={() => onNavigate(index)}
                            sx={{
                                width: 60,
                                height: 60,
                                objectFit: "cover",
                                borderRadius: 1,
                                cursor: "pointer",
                                opacity: index === currentIndex ? 1 : 0.6,
                                border:
                                    index === currentIndex
                                        ? "2px solid white"
                                        : "2px solid transparent",
                                transition: "opacity 0.2s ease, border-color 0.2s ease",
                                marginRight: "5px",
                                "&:last-child": { marginRight: 0 },
                            }}
                        />
                    ))}
                </Box>
            </Box>
        </Modal>
    );
};
