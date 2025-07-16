import { Box } from "@mui/material";
import * as types from "../../api/types";

export const MediaGrid = ({
    media,
    onImageClick,
    maxHeight = 250,
}: {
    media: types.Media[];
    onImageClick: (index: number) => void;
    maxHeight?: number;
}) => {
    const mediaCount = media.length;

    if (mediaCount === 1) {
        return (
            <Box
                sx={{
                    width: "100%",
                    maxWidth: "400px",
                    height: "auto",
                    maxHeight: `${maxHeight}px`,
                    overflow: "hidden",
                    borderRadius: 2,
                    position: "relative",
                }}
            >
                <Box
                    component="img"
                    src={media[0].file}
                    alt="chat media"
                    onClick={() => onImageClick(0)}
                    sx={{
                        width: "100%",
                        height: "auto",
                        maxHeight: `${maxHeight}px`,
                        minHeight: "120px",
                        objectFit: "cover",
                        cursor: "pointer",
                        transition: "transform 0.2s ease",
                        display: "block",
                        "&:hover": {
                            transform: "scale(1.02)",
                        },
                    }}
                />
            </Box>
        );
    }

    if (mediaCount === 2) {
        return (
            <Box
                sx={{
                    width: "100%",
                    maxWidth: "400px",
                    overflow: "hidden",
                    borderRadius: 2,
                }}
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 0.5,
                        height: `${maxHeight}px`,
                        width: "100%",
                    }}
                >
                    {media.map((mediaItem, index) => (
                        <Box
                            key={mediaItem.id}
                            component="img"
                            src={mediaItem.file}
                            alt="chat media"
                            onClick={() => onImageClick(index)}
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: 1,
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                                display: "block",
                                "&:hover": {
                                    transform: "scale(1.02)",
                                },
                            }}
                        />
                    ))}
                </Box>
            </Box>
        );
    }

    if (mediaCount === 3) {
        return (
            <Box
                sx={{
                    width: "100%",
                    maxWidth: "400px",
                    overflow: "hidden",
                    borderRadius: 2,
                }}
            >
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gridTemplateRows: "1fr 1fr",
                        gap: 0.5,
                        height: `${maxHeight}px`,
                        width: "100%",
                    }}
                >
                    <Box
                        component="img"
                        src={media[0].file}
                        alt="chat media"
                        onClick={() => onImageClick(0)}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 1,
                            cursor: "pointer",
                            gridRow: "1 / 3",
                            transition: "transform 0.2s ease",
                            display: "block",
                            "&:hover": {
                                transform: "scale(1.02)",
                            },
                        }}
                    />
                    {media.slice(1).map((mediaItem, index) => (
                        <Box
                            key={mediaItem.id}
                            component="img"
                            src={mediaItem.file}
                            alt="chat media"
                            onClick={() => onImageClick(index + 1)}
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: 1,
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                                display: "block",
                                "&:hover": {
                                    transform: "scale(1.02)",
                                },
                            }}
                        />
                    ))}
                </Box>
            </Box>
        );
    }

    // For 4 or more images
    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: "400px",
                overflow: "hidden",
                borderRadius: 2,
            }}
        >
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gridTemplateRows: "1fr 1fr",
                    gap: 0.5,
                    height: `${maxHeight}px`,
                    width: "100%",
                }}
            >
                {media.slice(0, 4).map((mediaItem, index) => (
                    <Box
                        key={mediaItem.id}
                        sx={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                            borderRadius: 1,
                            cursor: "pointer",
                        }}
                        onClick={() => onImageClick(index)}
                    >
                        <Box
                            component="img"
                            src={mediaItem.file}
                            alt="chat media"
                            sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transition: "transform 0.2s ease",
                                display: "block",
                                "&:hover": {
                                    transform: "scale(1.02)",
                                },
                            }}
                        />
                        {index === 3 && mediaCount > 4 && (
                            <Box
                                sx={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontWeight: "bold",
                                    fontSize: "1.2rem",
                                    zIndex: 1,
                                }}
                            >
                                +{mediaCount - 4}
                            </Box>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};
