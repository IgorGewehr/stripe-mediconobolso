// app/layout.js (RootLayout)
"use client";

import "../styles/global.css";
import ThemeProvider from "./components/themeProvider";
import { AuthProvider } from "./components/authProvider";

export default function RootLayout({ children }) {
    return (
        <html lang="pt-br">
        <head>
            <title>Médico no Bolso</title>
            <link rel="icon" href="/logoico.ico" />
            <meta name="description" content="Médico no Bolso" />
        </head>
        <body>
        <AuthProvider>
            <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
        </body>
        </html>
    );
}