'use client';

export default function GlobalError({ error, reset }) {
    return (
        <html lang="pt-br">
            <body style={{
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                fontFamily: 'Inter, system-ui, sans-serif',
                background: '#F8FAFC',
                color: '#0F172A'
            }}>
                <div style={{
                    textAlign: 'center',
                    padding: '32px',
                    maxWidth: '400px'
                }}>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 600,
                        marginBottom: '16px',
                        color: '#DC2626'
                    }}>
                        Algo deu errado
                    </h1>
                    <p style={{
                        fontSize: '16px',
                        color: '#64748B',
                        marginBottom: '24px'
                    }}>
                        Ocorreu um erro inesperado. Por favor, recarregue a página.
                    </p>
                    <a
                        href="/"
                        style={{
                            display: 'inline-block',
                            padding: '12px 24px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#FFFFFF',
                            backgroundColor: '#2563EB',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            textDecoration: 'none'
                        }}
                    >
                        Voltar ao início
                    </a>
                </div>
            </body>
        </html>
    );
}
