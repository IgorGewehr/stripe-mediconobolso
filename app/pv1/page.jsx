export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import PV1Client from './PV1Client';

// Aqui você faz o “bailout” da renderização estática
// e deixa toda a lógica de cliente dentro do <Suspense>
export default function PV1Page() {
    return (
        <Suspense fallback={<div>Carregando…</div>}>
            <PV1Client />
        </Suspense>
    );
}

