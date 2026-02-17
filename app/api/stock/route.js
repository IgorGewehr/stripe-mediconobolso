// app/api/stock/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();

  if (!body.nome_item) {
    return NextResponse.json(
      { error: "Campo 'nome_item' é obrigatório no banco!" }, 
      { status: 400 }
    );
  }

  console.log("DADOS CHEGANDO NO 'BANCO':", body);

  return NextResponse.json({
    id: Math.floor(Math.random() * 1000),
    ...body,
    created_at: new Date(),
    status: "Salvo no banco com sucesso"
  });
}

export async function GET() {
   return NextResponse.json([
     { id: 1, nome_item: "Gaze", quantidade_atual: 50, categoria: "Material" },
     { id: 2, nome_item: "Gaze", quantidade_atual: 50, categoria: "Material" }
   ]);
 }