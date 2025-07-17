import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

export default defineConfig({
    plugins: [
        react(),
        viteTsconfigPaths(),
        svgr({
            include: "**/*.svg?react",
        }),
    ],
    build: {
        outDir: "build", // CRA's default build output
    },
    server: {
        host: "0.0.0.0",
        port: 5173,
    },
});
