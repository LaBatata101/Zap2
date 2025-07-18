import { ThemeProvider } from "styled-components";
import "./App.css";
import { ChatApp } from "./pages/chat";
import { CssBaseline } from "@mui/material";
import { darkTheme } from "./theme";
import "./emoji-picker-custom-theme.css";

function App() {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <ChatApp />
        </ThemeProvider>
    );
}

export default App;
