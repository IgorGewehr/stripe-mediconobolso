import { Suspense } from 'react';

// Aqui você faz o “bailout” da renderização estática
// e deixa toda a lógica de cliente dentro do <Suspense>
export default function PV1Page() {
    return (
        <Suspense fallback={<div>Carregando…</div>}>
            <PV1Client />
        </Suspense>
    );
}

// O componente abaixo só roda no cliente, pois usa hooks de navegação
import PV1Client from './PV1Client';