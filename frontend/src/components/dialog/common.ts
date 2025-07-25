import { CloudUpload } from "@mui/icons-material";
import { Avatar, Box, Button, Dialog, IconButton, styled } from "@mui/material";

// Styled components for better visual hierarchy
export const StyledDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialog-paper": {
        borderRadius: 10,
        backgroundColor: theme.palette.background.paper,
        backgroundImage:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
        position: "relative",
        overflow: "visible",
    },
}));

export const AvatarContainer = styled(Box)(({ theme }) => ({
    position: "relative",
    display: "inline-block",
    "&::before": {
        content: '""',
        position: "absolute",
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        zIndex: -1,
        opacity: 0,
        transition: "opacity 0.3s ease",
    },
    "&:hover::before": {
        opacity: 0.3,
    },
}));

export const StyledAvatar = styled(Avatar)(({ theme }) => ({
    width: 120,
    height: 120,
    fontSize: "3rem",
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    border: `4px solid ${theme.palette.background.paper}`,
    boxShadow: `0 8px 24px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.15)"}`,
    transition: "all 0.3s ease",
}));

export const CameraButton = styled(IconButton)(({ theme }) => ({
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: theme.palette.primary.main,
    color: "white",
    width: 40,
    height: 40,
    boxShadow: `0 4px 12px ${theme.palette.mode === "dark" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.2)"}`,
    border: `3px solid ${theme.palette.background.paper}`,
    "&:hover": {
        backgroundColor: theme.palette.primary.dark,
        transform: "scale(1.1)",
    },
    transition: "all 0.2s ease",
}));

export const ActionButton = styled(Button)(({ theme, variant }) => ({
    borderRadius: 12,
    textTransform: "none",
    fontWeight: 600,
    padding: "12px 24px",
    minHeight: 48,
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

export const DragOverlay = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    border: "2px dashed",
    borderColor: theme.palette.primary.main,
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
    animation: "pulseGlow 2s infinite",

    "@keyframes pulseGlow": {
        "0%, 100%": {
            backgroundColor: "rgba(59, 130, 246, 0.15)",
            borderColor: theme.palette.primary.main,
        },
        "50%": {
            backgroundColor: "rgba(59, 130, 246, 0.25)",
            borderColor: theme.palette.primary.light,
        },
    },
}));

export const UploadIcon = styled(CloudUpload)(({ theme }) => ({
    fontSize: "4rem",
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
    animation: "bounce 1.5s infinite",

    "@keyframes bounce": {
        "0%, 20%, 50%, 80%, 100%": {
            transform: "translateY(0)",
        },
        "40%": {
            transform: "translateY(-10px)",
        },
        "60%": {
            transform: "translateY(-5px)",
        },
    },
}));

export enum DialogMode {
    Edit,
    View,
}
