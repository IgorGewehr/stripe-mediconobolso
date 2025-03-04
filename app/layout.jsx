import ThemeProvider from "./components/themeProvider";
import Checkout from "./components/checkout";

export default function RootLayout({children}) {
    return (
        <html lang="pt-br">
        <body>
        <Checkout/>
        </body>
        </html>
    );
}