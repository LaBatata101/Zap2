import * as yup from "yup";
import React, { useState } from "react";
import { LoginCredentials, RegistrationCredentials } from "../api/types";
import {
    Card,
    TextField,
    Button,
    Typography,
    Stack,
    Alert,
    Avatar,
    ThemeProvider,
    createTheme,
    Checkbox,
    FormControlLabel,
    ToggleButton,
    InputAdornment,
    IconButton,
    Snackbar,
    Box,
    ToggleButtonGroup,
} from "@mui/material";
import {
    PersonOutline,
    LockOutlined,
    ChatBubbleOutline,
    Visibility,
    VisibilityOff,
    MailOutline,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { useFormik } from "formik";
import { APIService } from "../api";

const AuthContainer = styled("div")(({ theme }) => ({
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
        padding: theme.spacing(3),
    },
}));

const AuthCard = styled(Card)(({ theme }) => ({
    maxWidth: 420,
    width: "100%",
    borderRadius: (theme.shape.borderRadius as number) * 2,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(255, 255, 255, 0.95)",
    padding: theme.spacing(3),
    [theme.breakpoints.up("sm")]: {
        padding: theme.spacing(4),
    },
}));

const BrandContainer = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: theme.spacing(3),
    [theme.breakpoints.up("sm")]: {
        marginBottom: theme.spacing(4),
    },
}));

const BrandIcon = styled(Avatar)(({ theme }) => ({
    background: "linear-gradient(135deg, #1890ff, #722ed1)",
    marginBottom: 16,
    width: 64,
    height: 64,
    boxShadow: `0 8px 16px ${theme.palette.primary.main}4D`,
}));

const customTheme = createTheme({
    palette: {
        primary: {
            main: "#1890ff",
        },
    },
    shape: {
        borderRadius: 8,
    },
});

const registrationScheme = yup.object().shape({
    username: yup
        .string()
        .trim()
        .required("Username is required")
        .matches(/^[a-zA-Z0-9]+$/, "Username can only contain letters and numbers"),
    email: yup.string().email("Enter a valid email").required("Email is required"),
    password: yup.string().required("Password is required"),
});

const loginScheme = yup.object().shape({
    username: yup.string().required("Username is required"),
    password: yup.string().required("Password is required"),
});

enum AuthMode {
    login,
    register,
}

export const AuthPage = ({
    apiService,
    onLogin,
    onRegistration,
}: {
    apiService: React.RefObject<APIService>;
    onLogin: (cred: LoginCredentials) => Promise<boolean>;
    onRegistration: (cred: RegistrationCredentials) => Promise<boolean>;
}) => {
    const [authMode, setAuthMode] = useState(AuthMode.login);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const [usernameExists, setUsernameExists] = useState(false);
    const [usernameTimer, setUsernameTimer] = useState<number | null>(null);

    const checkUsernameExists = async (username: string) => {
        if (usernameTimer) {
            clearTimeout(usernameTimer); // Cancel any pending check
        }
        const timer = setTimeout(async () => {
            try {
                const exists = await apiService.current.checkIfUserExists(username);
                setUsernameExists(exists);
            } catch (error) {
                console.error("Error checking username:", error);
            }
        }, 500); // 500ms delay
        setUsernameTimer(timer);
    };

    const registrationForm = useFormik({
        initialValues: {
            username: "",
            email: "",
            password: "",
        },
        validationSchema: registrationScheme,
        onSubmit: async (values) => {
            if (usernameExists) {
                setSnackbar({
                    open: true,
                    message: "Username already exists. Please choose another one.",
                    severity: "error",
                });
                return;
            }
            setLoading(true);
            try {
                const success = await onRegistration(values);
                if (success) {
                    setSnackbar({
                        open: true,
                        message: "Sign up successful!",
                        severity: "success",
                    });
                } else {
                    setSnackbar({
                        open: true,
                        message: "Sign up failed! Please try again.",
                        severity: "error",
                    });
                }
            } catch (error) {
                setSnackbar({
                    open: true,
                    message: "An error occurred during sign up.",
                    severity: "error",
                });
            } finally {
                setLoading(false);
            }
        },
    });

    const loginForm = useFormik({
        initialValues: {
            username: "",
            password: "",
        },
        validationSchema: loginScheme,
        onSubmit: async (values) => {
            setLoading(true);
            try {
                const success = await onLogin(values);
                if (success) {
                    setSnackbar({
                        open: true,
                        message: "Sign in successful!",
                        severity: "success",
                    });
                } else {
                    setSnackbar({
                        open: true,
                        message: "Sign in failed! Please check your credentials.",
                        severity: "error",
                    });
                }
            } catch (error: any) {
                setSnackbar({
                    open: true,
                    message: "Sign up failed! Please try again.",
                    severity: "error",
                });
            } finally {
                setLoading(false);
            }
        },
    });

    const handleModeChange = (_: React.MouseEvent<HTMLElement>, newMode: AuthMode | null) => {
        if (newMode !== null) {
            setAuthMode(newMode);
            registrationForm.resetForm();
            loginForm.resetForm();
        }
    };

    return (
        <ThemeProvider theme={customTheme}>
            <AuthContainer>
                <AuthCard>
                    <BrandContainer>
                        <BrandIcon sx={{ alignContent: "center" }}>
                            <ChatBubbleOutline sx={{ fontSize: 32 }} />
                        </BrandIcon>
                        <Typography
                            variant="h4"
                            component="h1"
                            gutterBottom
                            sx={{ fontSize: { xs: "1.8rem", sm: "2.125rem" } }}
                        >
                            Welcome to Zap2
                        </Typography>
                        <Typography
                            variant="body1"
                            color="textSecondary"
                            sx={{ textAlign: "center", fontSize: { xs: "0.9rem", sm: "1rem" } }}
                        >
                            Connect and collaborate with your team
                        </Typography>
                    </BrandContainer>

                    <Box
                        sx={{
                            p: "5px",
                            mb: 5,
                            bgcolor: "grey.200",
                            borderRadius: "12px",
                        }}
                    >
                        <ToggleButtonGroup
                            value={authMode}
                            exclusive
                            onChange={handleModeChange}
                            fullWidth
                            sx={{ gap: 1 }}
                        >
                            <ToggleButton
                                value={AuthMode.login}
                                sx={{
                                    border: 0,
                                    borderRadius: "8px !important",
                                    "&.Mui-selected": {
                                        bgcolor: "white",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    },
                                    "&.Mui-selected:hover": {
                                        bgcolor: "white",
                                    },
                                }}
                            >
                                Sign In
                            </ToggleButton>
                            <ToggleButton
                                value={AuthMode.register}
                                sx={{
                                    border: 0,
                                    borderRadius: "8px !important",
                                    "&.Mui-selected": {
                                        bgcolor: "white",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    },
                                    "&.Mui-selected:hover": {
                                        bgcolor: "white",
                                    },
                                }}
                            >
                                Sign Up
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <form
                        onSubmit={
                            authMode === AuthMode.login
                                ? loginForm.handleSubmit
                                : registrationForm.handleSubmit
                        }
                        noValidate
                    >
                        <Stack spacing={2}>
                            <TextField
                                id="username"
                                name="username"
                                label="Username"
                                value={
                                    authMode === AuthMode.login
                                        ? loginForm.values.username
                                        : registrationForm.values.username
                                }
                                onChange={
                                    authMode === AuthMode.login
                                        ? loginForm.handleChange
                                        : (e) => {
                                              registrationForm.handleChange(e);
                                              checkUsernameExists(e.target.value);
                                          }
                                }
                                onBlur={
                                    authMode === AuthMode.login
                                        ? loginForm.handleBlur
                                        : registrationForm.handleBlur
                                }
                                error={
                                    (loginForm.touched.username &&
                                        Boolean(loginForm.errors.username)) ||
                                    (registrationForm.touched.username &&
                                        Boolean(registrationForm.errors.username)) ||
                                    (authMode === AuthMode.register && usernameExists)
                                }
                                helperText={
                                    (loginForm.touched.username && loginForm.errors.username) ||
                                    (registrationForm.touched.username &&
                                        registrationForm.errors.username) ||
                                    (authMode === AuthMode.register && usernameExists
                                        ? "The username already exists"
                                        : "")
                                }
                                fullWidth
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonOutline />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />

                            {/* E-mail field (only in register mode) */}
                            {authMode === AuthMode.register && (
                                <TextField
                                    fullWidth
                                    id="email"
                                    name="email"
                                    label="Email"
                                    value={registrationForm.values.email}
                                    onChange={registrationForm.handleChange}
                                    onBlur={registrationForm.handleBlur}
                                    error={
                                        registrationForm.touched.email &&
                                        Boolean(registrationForm.errors.email)
                                    }
                                    helperText={
                                        registrationForm.touched.email &&
                                        registrationForm.errors.email
                                    }
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <MailOutline />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            )}

                            <TextField
                                id="password"
                                name="password"
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                value={
                                    authMode === AuthMode.login
                                        ? loginForm.values.password
                                        : registrationForm.values.password
                                }
                                onChange={
                                    authMode === AuthMode.login
                                        ? loginForm.handleChange
                                        : registrationForm.handleChange
                                }
                                onBlur={
                                    authMode === AuthMode.login
                                        ? loginForm.handleBlur
                                        : registrationForm.handleBlur
                                }
                                error={
                                    (loginForm.touched.password &&
                                        Boolean(loginForm.errors.password)) ||
                                    (registrationForm.touched.password &&
                                        Boolean(registrationForm.errors.password))
                                }
                                helperText={
                                    (loginForm.touched.password && loginForm.errors.password) ||
                                    (registrationForm.touched.password &&
                                        registrationForm.errors.password)
                                }
                                fullWidth
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlined />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? (
                                                        <VisibilityOff />
                                                    ) : (
                                                        <Visibility />
                                                    )}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                            {authMode === AuthMode.login && (
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    sx={{ flexWrap: "wrap", gap: 1 }}
                                >
                                    <FormControlLabel
                                        control={<Checkbox name="remember" />}
                                        label="Remember me"
                                    />
                                    <Button variant="text" size="small">
                                        Forgot password?
                                    </Button>
                                </Stack>
                            )}
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={loading}
                            >
                                {loading
                                    ? "Please wait..."
                                    : authMode === AuthMode.login
                                      ? "Sign in"
                                      : "Sign up"}
                            </Button>
                        </Stack>
                    </form>

                    {/* TODO: <Divider sx={{ my: 3 }}>Or continue with</Divider>

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Stack direction="row" spacing={2}>
                            <IconButton
                                onClick={() =>
                                    setSnackbar({
                                        open: true,
                                        message: "Not implemented yet!",
                                        severity: "error",
                                    })
                                }
                            >
                                <Google />
                            </IconButton>
                            <IconButton
                                onClick={() =>
                                    setSnackbar({
                                        open: true,
                                        message: "Not implemented yet!",
                                        severity: "error",
                                    })
                                }
                            >
                                <GitHub />
                            </IconButton>
                            <IconButton
                                onClick={() =>
                                    setSnackbar({
                                        open: true,
                                        message: "Not implemented yet!",
                                        severity: "error",
                                    })
                                }
                            >
                                <Twitter />
                            </IconButton>
                        </Stack>
                    </Box> */}
                </AuthCard>
            </AuthContainer>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
};
