// app/not-found/page.jsx
export const dynamic = 'force-dynamic';
// Note que importamos o client component abaixo
import NotFoundClient from './NotFoundClient';
import { Suspense } from 'react';

export default function NotFoundPage() {
    return (
        <Suspense fallback={<div>Carregando…</div>}>
            <NotFoundClient />
        </Suspense>
    );
}

