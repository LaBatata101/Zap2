import {
    Box,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
    Chip,
    Fade,
    CircularProgress,
    Alert,
    Theme,
} from "@mui/material";
import { CropAvatarData, User } from "../../api/types";
import {
    CameraAlt,
    Close,
    Edit,
    Person,
    Save,
    Cancel,
    MessageOutlined,
    CheckCircle,
} from "@mui/icons-material";
import { useState, useEffect, useRef, useCallback } from "react";
import { ImageCropEditor } from "../image_crop_editor";
import {
    ActionButton,
    AvatarContainer,
    CameraButton,
    DragOverlay,
    DialogMode,
    StyledAvatar,
    StyledDialog,
    UploadIcon,
} from "./common";

type UserProfileDialogProps = {
    user: User;
    isOpen: boolean;
    mode: DialogMode;
    onClose: () => void;
    onStartDirectMessage: (user: User) => void;
    onUpdateProfile:
        | ((
              username: string,
              bio: string,
              avatar: File | null,
              cropAvatarData: CropAvatarData | null,
          ) => Promise<boolean>)
        | null;
};

export const UserProfileDialog = ({
    user,
    isOpen,
    mode,
    onClose,
    onStartDirectMessage,
    onUpdateProfile,
}: UserProfileDialogProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState(user.username);
    const [bio, setBio] = useState(user.profile?.bio || "");
    const [avatar, setAvatar] = useState<File | null>(null);
    const [cropData, setCropAvatarData] = useState<CropAvatarData | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        user.profile?.avatar_img || null,
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const [showCropEditor, setShowCropEditor] = useState(false);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

    // Reset form when user changes or dialog opens
    useEffect(() => {
        if (isOpen) {
            setUsername(user.username);
            setBio(user.profile?.bio || "");
            setAvatarPreview(user.profile?.avatar_img || null);
            setAvatar(null);
            setError(null);
            setSuccess(false);
            setIsDragOver(false);

            if (selectedImageFile) {
                setSelectedImageFile(null);
            }
        }
    }, [user, isOpen]);

    useEffect(() => {
        if (success) {
            setTimeout(() => {
                setSuccess(false);
            }, 1000);
        }
    }, [success]);

    const handleAvatarChange = (file: File) => {
        // 5MB limit
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be less than 5MB");
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Please select a valid image file");
            return;
        }

        setSelectedImageFile(file);
        setShowCropEditor(true);
        setError(null);
    };

    const handleCropComplete = useCallback(
        (originalFile: File, cropDetails: CropAvatarData, previewBlob: Blob) => {
            setAvatar(originalFile);
            setCropAvatarData(cropDetails);
            setAvatarPreview(URL.createObjectURL(previewBlob));
            setShowCropEditor(false);

            // Clean up the temporary URL
            if (selectedImageFile) {
                setSelectedImageFile(null);
            }
        },
        [selectedImageFile],
    );

    // Add this function to handle crop editor close
    const handleCropEditorClose = useCallback(() => {
        setShowCropEditor(false);
        if (selectedImageFile) {
            setSelectedImageFile(null);
        }
    }, [selectedImageFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleAvatarChange(e.target.files[0]);
        }
    };

    const handleAttachClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isEditing && e.dataTransfer.items.length > 0) {
            const item = e.dataTransfer.items[0];
            if (item.type.startsWith("image/")) {
                setIsDragOver(true);
            }
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDragOver(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isEditing) {
            setIsDragOver(true);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (isEditing && e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith("image/")) {
                handleAvatarChange(file);
            } else {
                setError("Please drop a valid image file");
            }
        }
    };

    const handleSave = async () => {
        if (!username.trim()) {
            setError("Username is required");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            setSuccess(await onUpdateProfile!(username.trim(), bio.trim(), avatar, cropData));
            setIsEditing(false);
        } catch (error: any) {
            setError(error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setUsername(user.username);
        setBio(user.profile?.bio || "");
        setAvatarPreview(user.profile?.avatar_img || null);
        setAvatar(null);
        setError(null);
        setIsDragOver(false);
    };

    return (
        <StyledDialog
            ref={dialogRef}
            open={isOpen}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            slots={{ transition: Fade }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {isDragOver && isEditing && (
                <DragOverlay>
                    <UploadIcon />
                    <Typography variant="h6" color="primary.main" fontWeight={600} sx={{ mb: 1 }}>
                        Drop image here
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        Release to upload as your avatar
                        <br />
                        Maximum size: 5MB
                    </Typography>
                </DragOverlay>
            )}

            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pb: 1,
                    borderBottom: `1px solid ${(theme: Theme) => theme.palette.divider}`,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Person sx={{ color: "primary.main" }} />
                    <Typography variant="h6" fontWeight={600}>
                        {isEditing ? "Edit Profile" : "User Profile"}
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

            <DialogContent sx={{ pt: 3, pb: 2 }}>
                <Stack spacing={3} alignItems="center">
                    <AvatarContainer
                        sx={{
                            opacity: isDragOver && isEditing ? 0.7 : 1,
                            transition: "opacity 0.2s ease",
                        }}
                    >
                        <StyledAvatar>
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar image"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: "50%",
                                    }}
                                />
                            ) : (
                                <Person sx={{ fontSize: "3rem" }} />
                            )}
                        </StyledAvatar>

                        {isEditing && (
                            <CameraButton onClick={handleAttachClick}>
                                <CameraAlt />
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </CameraButton>
                        )}
                    </AvatarContainer>

                    {isEditing && !isDragOver && (
                        <Typography variant="caption" color="text.secondary" textAlign="center">
                            Click camera icon or drag & drop to change avatar
                            <br />
                            Maximum size: 5MB
                        </Typography>
                    )}

                    {/* Form Fields */}
                    {isEditing ? (
                        <Stack spacing={2.5} sx={{ width: "100%" }}>
                            <TextField
                                label="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                fullWidth
                                variant="outlined"
                                error={!!error && !username.trim()}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Edit color="action" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />

                            <TextField
                                label="Bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                fullWidth
                                multiline
                                rows={3}
                                variant="outlined"
                                placeholder="Tell others about yourself..."
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Stack>
                    ) : (
                        <Box sx={{ textAlign: "center", maxWidth: "100%" }}>
                            <Typography variant="h5" fontWeight={600} gutterBottom>
                                {user.username}
                            </Typography>

                            {user.profile?.bio ? (
                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{
                                        px: 2,
                                        lineHeight: 1.6,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {user.profile.bio}
                                </Typography>
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.disabled"
                                    fontStyle="italic"
                                >
                                    No bio added yet
                                </Typography>
                            )}

                            <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="center"
                                sx={{ mt: 2 }}
                            >
                                <Chip
                                    icon={<CheckCircle />}
                                    label="Online"
                                    color="success"
                                    size="small"
                                    variant="outlined"
                                />
                                {user.is_superuser && (
                                    <Chip
                                        label="Admin"
                                        color="primary"
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            </Stack>
                        </Box>
                    )}

                    {/* Error/Success Messages */}
                    {error && (
                        <Alert severity="error" sx={{ width: "100%", borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ width: "100%", borderRadius: 2 }}>
                            Profile updated successfully!
                        </Alert>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions
                sx={{
                    p: 3,
                    pt: 2,
                    justifyContent: mode === DialogMode.Edit ? "space-between" : "center",
                }}
            >
                {isEditing ? (
                    <>
                        <ActionButton
                            onClick={handleCancel}
                            disabled={loading}
                            startIcon={<Cancel />}
                            sx={{ color: "text.secondary" }}
                        >
                            Cancel
                        </ActionButton>
                        <ActionButton
                            onClick={handleSave}
                            variant="contained"
                            disabled={loading || !username.trim()}
                            startIcon={loading ? <CircularProgress size={16} /> : <Save />}
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </ActionButton>
                    </>
                ) : (
                    <>
                        {mode === DialogMode.Edit && (
                            <ActionButton
                                onClick={() => setIsEditing(true)}
                                startIcon={<Edit />}
                                sx={{ color: "primary.main" }}
                            >
                                Edit Profile
                            </ActionButton>
                        )}
                        {mode !== DialogMode.DM && (
                            <ActionButton
                                onClick={() => onStartDirectMessage(user)}
                                variant="contained"
                                startIcon={<MessageOutlined />}
                                sx={{ minWidth: 160 }}
                            >
                                Start Chat
                            </ActionButton>
                        )}
                    </>
                )}
            </DialogActions>
            {selectedImageFile && (
                <ImageCropEditor
                    open={showCropEditor}
                    onClose={handleCropEditorClose}
                    image={selectedImageFile}
                    onCropComplete={handleCropComplete}
                />
            )}
        </StyledDialog>
    );
};
