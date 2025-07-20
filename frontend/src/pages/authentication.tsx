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
    Checkbox,
    FormControlLabel,
    ToggleButton,
    InputAdornment,
    IconButton,
    Snackbar,
    Box,
    ToggleButtonGroup,
    Fade,
} from "@mui/material";
import {
    PersonOutline,
    LockOutlined,
    ChatBubbleOutline,
    Visibility,
    VisibilityOff,
    MailOutline,
} from "@mui/icons-material";
import { styled, ThemeProvider } from "@mui/material/styles";
import { FormikProps, useFormik } from "formik";
import { APIService } from "../api";
import { darkTheme } from "../theme";

const AuthContainer = styled("div")(({ theme }) => ({
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #374151 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(2),
    position: "relative",
    overflow: "hidden",
    "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
            "radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 70%), radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
        pointerEvents: "none",
    },
    [theme.breakpoints.up("sm")]: {
        padding: theme.spacing(3),
    },
}));

const AuthCard = styled(Card)(({ theme }) => ({
    maxWidth: 420,
    width: "100%",
    borderRadius: 16,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(30, 41, 59, 0.95)",
    padding: theme.spacing(3),
    position: "relative",
    zIndex: 1,
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

const BrandIcon = styled(Avatar)({
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    marginBottom: 16,
    width: 64,
    height: 64,
    boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
});

const FormContainer = styled(Box)({
    position: "relative",
    minHeight: "300px",
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

const LoginForm = ({
    loginForm,
    showPassword,
    setShowPassword,
    loading,
}: {
    loginForm: FormikProps<LoginCredentials>;
    showPassword: boolean;
    setShowPassword: (value: boolean) => void;
    loading: boolean;
}) => (
    <form onSubmit={loginForm.handleSubmit} noValidate>
        <Stack spacing={2}>
            <TextField
                id="username"
                name="username"
                label="Username"
                value={loginForm.values.username}
                onChange={loginForm.handleChange}
                onBlur={loginForm.handleBlur}
                error={loginForm.touched.username && Boolean(loginForm.errors.username)}
                helperText={loginForm.touched.username && loginForm.errors.username}
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

            <TextField
                id="password"
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={loginForm.values.password}
                onChange={loginForm.handleChange}
                onBlur={loginForm.handleBlur}
                error={loginForm.touched.password && Boolean(loginForm.errors.password)}
                helperText={loginForm.touched.password && loginForm.errors.password}
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
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
            />

            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ flexWrap: "wrap", gap: 1 }}
            >
                <FormControlLabel control={<Checkbox name="remember" />} label="Remember me" />
                <Button variant="text" size="small">
                    Forgot password?
                </Button>
            </Stack>

            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                {loading ? "Please wait..." : "Sign in"}
            </Button>
        </Stack>
    </form>
);

const RegistrationForm = ({
    registrationForm,
    showPassword,
    setShowPassword,
    loading,
    usernameExists,
    checkUsernameExists,
}: {
    registrationForm: FormikProps<RegistrationCredentials>;
    showPassword: boolean;
    setShowPassword: (value: boolean) => void;
    loading: boolean;
    usernameExists: boolean;
    checkUsernameExists: (username: string) => void;
}) => (
    <form onSubmit={registrationForm.handleSubmit} noValidate>
        <Stack spacing={2}>
            <TextField
                id="username"
                name="username"
                label="Username"
                value={registrationForm.values.username}
                onChange={(e) => {
                    registrationForm.handleChange(e);
                    checkUsernameExists(e.target.value);
                }}
                onBlur={registrationForm.handleBlur}
                error={
                    (registrationForm.touched.username &&
                        Boolean(registrationForm.errors.username)) ||
                    usernameExists
                }
                helperText={
                    (registrationForm.touched.username && registrationForm.errors.username) ||
                    (usernameExists ? "The username already exists" : "")
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

            <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                value={registrationForm.values.email}
                onChange={registrationForm.handleChange}
                onBlur={registrationForm.handleBlur}
                error={registrationForm.touched.email && Boolean(registrationForm.errors.email)}
                helperText={registrationForm.touched.email && registrationForm.errors.email}
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

            <TextField
                id="password"
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={registrationForm.values.password}
                onChange={registrationForm.handleChange}
                onBlur={registrationForm.handleBlur}
                error={
                    registrationForm.touched.password && Boolean(registrationForm.errors.password)
                }
                helperText={registrationForm.touched.password && registrationForm.errors.password}
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
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    },
                }}
            />

            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                {loading ? "Please wait..." : "Sign up"}
            </Button>
        </Stack>
    </form>
);

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
    const [usernameTimer, setUsernameTimer] = useState<NodeJS.Timeout | null>(null);

    const [isTransitioning, setIsTransitioning] = useState(false);

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
        onSubmit: async (values, { resetForm }) => {
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
                    resetForm();
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
        if (newMode !== null && newMode !== authMode) {
            setIsTransitioning(true);

            // Start the fade out, then switch mode and fade in
            setTimeout(() => {
                setAuthMode(newMode);
                registrationForm.resetForm();
                loginForm.resetForm();
                setUsernameExists(false);
                setShowPassword(false);
                setIsTransitioning(false);
            }, 150); // Half of the transition duration
        }
    };

    return (
        <ThemeProvider theme={darkTheme}>
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
                            Welcome to Zap²
                        </Typography>
                    </BrandContainer>

                    <Box
                        sx={{
                            p: "4px",
                            mb: 4,
                            bgcolor: "rgba(51, 65, 85, 0.8)",
                            borderRadius: "12px",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
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
                                    color: "text.secondary",
                                    transition: "all 0.3s ease-in-out",
                                    "&.Mui-selected": {
                                        bgcolor: "rgba(59, 130, 246, 0.2)",
                                        color: "primary.main",
                                        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)",
                                    },
                                    "&.Mui-selected:hover": {
                                        bgcolor: "rgba(59, 130, 246, 0.3)",
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
                                    color: "text.secondary",
                                    transition: "all 0.3s ease-in-out",
                                    "&.Mui-selected": {
                                        bgcolor: "rgba(59, 130, 246, 0.2)",
                                        color: "primary.main",
                                        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)",
                                    },
                                    "&.Mui-selected:hover": {
                                        bgcolor: "rgba(59, 130, 246, 0.3)",
                                    },
                                }}
                            >
                                Sign Up
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    <FormContainer>
                        <Fade
                            in={!isTransitioning}
                            timeout={300}
                            style={{
                                transitionDelay: isTransitioning ? "0ms" : "150ms",
                            }}
                        >
                            <Box>
                                {authMode === AuthMode.login ? (
                                    <LoginForm
                                        loginForm={loginForm}
                                        loading={loading}
                                        showPassword={showPassword}
                                        setShowPassword={setShowPassword}
                                    />
                                ) : (
                                    <RegistrationForm
                                        registrationForm={registrationForm}
                                        usernameExists={usernameExists}
                                        setShowPassword={setShowPassword}
                                        loading={loading}
                                        checkUsernameExists={checkUsernameExists}
                                        showPassword={showPassword}
                                    />
                                )}
                            </Box>
                        </Fade>
                    </FormContainer>

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
