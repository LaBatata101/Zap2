import { useState } from "react";
import { ChatRoom, User } from "../api/types";
import {
    Drawer,
    Avatar,
    Badge,
    Button,
    TextField,
    Typography,
    Stack,
    List,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    IconButton,
    InputAdornment,
    styled,
} from "@mui/material";
import { Logout, Settings, Add, Search, Person } from "@mui/icons-material";
import { StyledTooltip } from "./styled";
import { RoomListItem } from "./room_list_item";

export const sidebarWidth = 320;

const StyledDrawer = styled(Drawer)({
    "& .MuiDrawer-paper": {
        width: sidebarWidth,
        boxSizing: "border-box",
        borderRight: "1px solid #f0f0f0",
        background: "#ffffff",
    },
});

type SidebarProps = {
    user: User;
    rooms: any[];
    currentRoom: ChatRoom;
    onRoomSelect: (room: ChatRoom) => Promise<void>;
    onCreateRoom: (name: string) => Promise<void>;
    onLogout: () => Promise<void>;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    isMobile: boolean;
    isOpen: boolean;
    onToggle: () => void;
};

export const Sidebar = ({
    user,
    rooms,
    currentRoom,
    onRoomSelect,
    onCreateRoom,
    onLogout,
    searchTerm,
    setSearchTerm,
    isMobile,
    isOpen,
    onToggle,
}: SidebarProps) => {
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreateRoom = async () => {
        if (!newRoomName.trim()) return;
        setLoading(true);
        try {
            await onCreateRoom(newRoomName.trim());
            setNewRoomName("");
            setShowRoomModal(false);
        } catch (error) {
            console.error("Failed to create room: ", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRooms = rooms.filter((room) =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const drawerContent = (
        <>
            <Box sx={{ p: 2, borderBottom: "1px solid #f0f0f0" }}>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                variant="dot"
                                sx={{
                                    "& .MuiBadge-badge": {
                                        backgroundColor: "#44b700",
                                        color: "#44b700",
                                    },
                                }}
                            >
                                <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
                                    <Person />
                                </Avatar>
                            </Badge>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {user.username}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Online
                                </Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row">
                            <StyledTooltip title="Configurations">
                                <IconButton size="small">
                                    <Settings />
                                </IconButton>
                            </StyledTooltip>
                            <StyledTooltip title="Logout">
                                <IconButton size="small" onClick={onLogout}>
                                    <Logout />
                                </IconButton>
                            </StyledTooltip>
                        </Stack>
                    </Stack>
                    <TextField
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        size="small"
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                                sx: {
                                    borderRadius: "40px",
                                },
                            },
                        }}
                    />
                </Stack>
            </Box>

            <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ px: 2, py: 1 }}
                >
                    <Typography variant="overline" color="text.secondary">
                        Chats
                    </Typography>
                    <Button startIcon={<Add />} size="small" onClick={() => setShowRoomModal(true)}>
                        New
                    </Button>
                </Stack>
                <List disablePadding>
                    {filteredRooms.map((room) => (
                        <RoomListItem
                            key={room.id}
                            room={room}
                            isSelected={currentRoom?.id === room.id}
                            onSelect={onRoomSelect}
                        />
                    ))}
                </List>
            </Box>
        </>
    );

    return (
        <>
            <StyledDrawer
                variant={isMobile ? "temporary" : "permanent"}
                open={isMobile ? isOpen : true}
                onClose={onToggle}
                ModalProps={{
                    keepMounted: true,
                }}
                anchor="left"
            >
                {drawerContent}
            </StyledDrawer>

            <Dialog
                open={showRoomModal}
                onClose={() => setShowRoomModal(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Create New Room</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Room Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRoomModal(false)}>Cancelar</Button>
                    <Button onClick={handleCreateRoom} variant="contained" disabled={loading}>
                        {loading ? "Creating..." : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
