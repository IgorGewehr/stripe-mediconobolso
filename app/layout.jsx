export const dynamic = 'force-dynamic';

import '../styles/global.css';
import { ClientProviders } from './components';

export default function RootLayout({ children }) {
    return (
        <html lang="pt-br">
        <head>
            <title>Médico no Bolso</title>
            <link rel="icon" href="/logoico.ico" />
            <meta name="description" content="Médico no Bolso" />
        </head>
        <body>
        {/* Tudo que precisar de hooks (Auth, Theme) fica dentro deste client component */}
        <ClientProviders>
            {children}
        </ClientProviders>
        </body>
        </html>
    );
}