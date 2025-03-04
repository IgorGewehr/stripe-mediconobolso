// RootLayout.jsx
import '../styles/global.css';
import ThemeProvider from "./components/themeProvider";

export default function RootLayout({ children }) {
    return (
        <html lang="pt-br">
        <head>
            <title>Médico no Bolso</title>
            <link rel="icon" href="/logoico.ico" />
            <meta name="description" content="Médico no Bolso" />
        </head>
        <body>
        <ThemeProvider>
            {children}
        </ThemeProvider>
        </body>
        </html>
    );
}
