import { styled } from "@mui/material/styles";
import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";

export const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
        color: "#262626",
    },
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: "#262626",
        color: "rgba(255, 255, 255, 0.85)",
        fontSize: theme.typography.pxToRem(12),
        padding: "6px 10px",
    },
}));
