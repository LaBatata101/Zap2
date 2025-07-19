import { styled } from "@mui/material/styles";
import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";

export const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
        color: "#1f2937",
        "&::before": {
            border: "1px solid #374151",
        },
    },
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: "#1f2937",
        color: "#f9fafb",
        fontSize: theme.typography.pxToRem(12),
        padding: "8px 12px",
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
        border: "1px solid #374151",
        fontWeight: 500,
    },
}));
