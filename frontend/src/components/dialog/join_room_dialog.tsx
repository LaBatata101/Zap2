import { useEffect, useState } from "react";
import { APIService } from "../../api";
import { ChatRoom } from "../../api/types";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Stack,
} from "@mui/material";
import { OpenInNew, People } from "@mui/icons-material";
import { StyledAvatar } from "./common";

interface JoinRoomDialogProps {
    token: string;
    apiService: APIService;
    onConfirm: (room: ChatRoom) => void;
    onClose: () => void;
}

export const JoinRoomDialog = ({ token, apiService, onConfirm, onClose }: JoinRoomDialogProps) => {
    const [room, setRoom] = useState<ChatRoom | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [joinInProgress, setJoinInProgress] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const response = await apiService.getInvitationDetails(token);

                if (response.status === 200) {
                    setRoom(response.data!);
                } else {
                    // @ts-ignore
                    setError(response.data!.detail);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, []);

    const handleJoin = async () => {
        setJoinInProgress(true);
        try {
            const response = await apiService.joinRoom(token);
            if (response.status === 200) {
                onConfirm(response.data!);
            } else {
                // @ts-ignore
                setError(`Could not join the room. ${response.data!.detail}`);
            }
        } finally {
            setJoinInProgress(false);
        }
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Join Group Chat</DialogTitle>
            <DialogContent>
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                        <CircularProgress />
                    </Box>
                )}
                {error && <Alert severity="error">{error}</Alert>}
                {error === null && room && (
                    <Stack spacing={1} alignItems="center">
                        <StyledAvatar src={room.avatar_img}>
                            {room.name.charAt(0).toUpperCase()}
                        </StyledAvatar>
                        <Typography variant="h5" fontWeight="bold">
                            {room.name}
                        </Typography>
                        <Typography
                            color="text.secondary"
                            sx={{
                                mb: 2,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                                textAlign: "justify",
                            }}
                        >
                            {room.description || "No Description"}
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 1,
                                mt: 2,
                            }}
                        >
                            <People color="action" />
                            <Typography variant="body1">{room.member_count} members</Typography>
                        </Box>
                        {room.is_member && (
                            <Alert severity="info">You are already a member of this group.</Alert>
                        )}
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                {error ? (
                    <Button onClick={onClose}>Close</Button>
                ) : (
                    <>
                        <Button onClick={onClose}>Cancel</Button>
                        {room?.is_member ? (
                            <Button
                                onClick={() => onConfirm(room)}
                                variant="contained"
                                startIcon={<OpenInNew />}
                            >
                                Open Chat
                            </Button>
                        ) : (
                            <Button
                                onClick={handleJoin}
                                variant="contained"
                                disabled={!room || joinInProgress}
                            >
                                {joinInProgress ? <CircularProgress size={24} /> : "Join Group"}
                            </Button>
                        )}
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};
