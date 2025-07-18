// theme.ts
import { createTheme } from "@mui/material/styles";

export const darkTheme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#3b82f6", // Modern blue
            light: "#60a5fa",
            dark: "#2563eb",
        },
        secondary: {
            main: "#8b5cf6", // Purple accent
            light: "#a78bfa",
            dark: "#7c3aed",
        },
        background: {
            default: "#0f172a", // Very dark slate
            paper: "#1e293b", // Dark slate for cards/surfaces
        },
        surface: {
            main: "#334155", // Medium slate for elevated surfaces
        },
        text: {
            primary: "#f8fafc",
            secondary: "#cbd5e1",
        },
        divider: "#374151",
        action: {
            hover: "rgba(59, 130, 246, 0.08)",
            selected: "rgba(59, 130, 246, 0.12)",
        },
        success: {
            main: "#10b981",
        },
        warning: {
            main: "#f59e0b",
        },
        error: {
            main: "#ef4444",
        },
    },
    shape: {
        borderRadius: 12,
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
        body1: {
            fontSize: "0.95rem",
        },
        body2: {
            fontSize: "0.875rem",
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarWidth: "thin",
                    scrollbarColor: "#475569 #1e293b",
                    "&::-webkit-scrollbar": {
                        width: 8,
                    },
                    "&::-webkit-scrollbar-track": {
                        background: "#1e293b",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#475569",
                        borderRadius: 4,
                        "&:hover": {
                            backgroundColor: "#64748b",
                        },
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: "none",
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: "#1e293b",
                    borderBottom: "1px solid #374151",
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: "#1e293b",
                    borderRight: "1px solid #374151",
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                            borderColor: "#475569",
                        },
                        "&:hover fieldset": {
                            borderColor: "#64748b",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#3b82f6",
                        },
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    fontWeight: 500,
                    borderRadius: 8,
                },
                contained: {
                    boxShadow: "none",
                    "&:hover": {
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
                    },
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    "&.Mui-selected": {
                        backgroundColor: "rgba(59, 130, 246, 0.12)",
                        borderLeft: "3px solid #3b82f6",
                        "&:hover": {
                            backgroundColor: "rgba(59, 130, 246, 0.16)",
                        },
                    },
                },
            },
        },
        MuiAvatar: {
            styleOverrides: {
                root: {
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                },
            },
        },
        MuiToggleButton: {
            styleOverrides: {
                root: {
                    "&.Mui-selected": {
                        backgroundColor: "#334155",
                        color: "#f8fafc",
                        "&:hover": {
                            backgroundColor: "#475569",
                        },
                    },
                },
            },
        },
    },
});

declare module "@mui/material/styles" {
    interface PaletteOptions {
        surface: {
            main: string;
        };
    }
    interface Palette {
        surface: {
            main: string;
        };
    }
}
