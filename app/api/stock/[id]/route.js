import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  console.log(`MOCK: Atualizando item ${id} com os dados:`, body);

  return NextResponse.json({
    id,
    ...body, 
    updated_at: new Date().toISOString()
  });
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  console.log(`MOCK: Excluindo item ${id}`);

  return NextResponse.json({
    success: true,
    message: `Item ${id} excluído com sucesso.`
  }, { status: 200 });
}