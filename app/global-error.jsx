'use client';

// This file is required for Next.js 16 + Netlify compatibility
// It must be a client component but cannot use any React hooks during SSR

function GlobalError({ error, reset }) {
    // Simple error page without any hooks or complex logic
    return (
        <html lang="pt-BR">
            <head>
                <title>Erro - Médico no Bolso</title>
            </head>
            <body
                style={{
                    margin: 0,
                    padding: 0,
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    backgroundColor: '#f8fafc',
                    color: '#1e293b',
                }}
            >
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#dc2626' }}>
                        Ocorreu um erro
                    </h1>
                    <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
                        Por favor, recarregue a página ou volte ao início.
                    </p>
                    <a
                        href="/"
                        style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            borderRadius: '0.5rem',
                            textDecoration: 'none',
                            fontWeight: 500,
                        }}
                    >
                        Voltar ao início
                    </a>
                </div>
            </body>
        </html>
    );
}

export default GlobalError;
