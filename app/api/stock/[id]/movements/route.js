// app/api/stock/[id]/movements/route.js
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {

  const { id } = await params;
  
  const history = [
    { id: 101, tipo: 'ENTRADA', quantidade: 50, observacoes: 'Carga inicial', data: '2026-02-10' },
    { id: 102, tipo: 'SAIDA', quantidade: 6, observacoes: 'Uso em cirurgia', data: '2026-02-12' }
  ];

  console.log(`Mock: Buscando histórico do item ID ${id}`);

  return NextResponse.json({
    items: history,
    total: history.length
  });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  console.log(`Mock: Nova movimentação para o item ${id}:`, body);

  return NextResponse.json({
    success: true,
    message: `Movimentação de ${body.tipo} registrada para o item ${id}`,
    data: { id: Math.floor(Math.random() * 1000), ...body }
  });
}


