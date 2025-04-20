import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import pdfParse from 'pdf-parse';

export async function POST(req) {
    try {
        // Verificar se estamos recebendo um arquivo ou texto
        const formData = await req.formData().catch(() => null);

        let text = "";

        if (formData) {
            // Extrair texto do PDF
            const file = formData.get('file');
            if (!file) {
                return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
            }

            // Converter para Buffer (formato que pdf-parse aceita)
            const buffer = Buffer.from(await file.arrayBuffer());

            // Usar pdf-parse para extrair texto no servidor
            const data = await pdfParse(buffer);
            text = data.text;
        } else {
            // Se não for um arquivo, espera-se que seja JSON com texto
            const body = await req.json();
            text = body.text || "";

            if (!text) {
                return NextResponse.json({ error: 'Texto não fornecido' }, { status: 400 });
            }
        }

        // Truncar o texto se for muito longo
        const maxLength = 15000;
        const truncatedText = text.length > maxLength
            ? text.substring(0, maxLength) + "... [texto truncado devido ao tamanho]"
            : text;

        // Prompt para processamento com a OpenAI
        const prompt = `
            Analise o texto do exame médico a seguir e extraia todos os resultados em formato JSON.
            O resultado deve ser agrupado nas seguintes categorias:
            - LabGerais: Exames Laboratoriais Gerais
            - PerfilLipidico: Perfil Lipídico
            - Hepaticos: Exames Hepáticos e Pancreáticos
            - Inflamatorios: Inflamatórios e Imunológicos
            - Hormonais: Hormonais
            - Vitaminas: Vitaminas e Minerais
            - Infecciosos: Infecciosos / Sorologias
            - Tumorais: Marcadores Tumorais
            - Cardiacos: Cardíacos e Musculares
            - Imagem: Imagem e Diagnóstico
            - Outros: Outros Exames
            
            Estruture o JSON como:
            {
              "LabGerais": {
                "Hemograma completo": "valor",
                "Plaquetas": "valor"
              },
              "PerfilLipidico": {
                "Colesterol Total": "valor"
              }
            }
            
            Inclua apenas as categorias onde houver resultados identificados.
            Para cada exame, inclua o nome do exame e o resultado completo com unidades.
            
            Texto do exame:
            ${truncatedText}
        `;

        // Chamada à API da OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_KEY
        });

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Você é um assistente especializado em processar resultados de exames médicos."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" }
        });

        // Extrair e validar o JSON retornado
        const resultText = response.choices[0].message.content;
        try {
            const jsonResult = JSON.parse(resultText);
            return NextResponse.json({
                success: true,
                data: jsonResult
            });
        } catch (jsonError) {
            return NextResponse.json({
                error: "Falha ao converter a resposta da IA para JSON",
                details: jsonError.message
            }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({
            error: 'Falha no processamento',
            details: error.message
        }, { status: 500 });
    }
}