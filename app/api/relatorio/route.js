import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Declare a rota como dinâmica para o Netlify
export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        // Obter dados da requisição
        const body = await req.json();
        const { pacienteData, doctorId, patientId } = body;

        // Verificar se os dados necessários foram fornecidos
        if (!pacienteData || !doctorId || !patientId) {
            return NextResponse.json({
                success: false,
                error: 'Dados incompletos para gerar o relatório clínico'
            }, { status: 400 });
        }

        // Verificar se a chave da API está configurada
        if (!process.env.OPENAI_KEY) {
            console.error('OPENAI_KEY não configurada');
            return NextResponse.json({
                success: false,
                error: 'Configuração da API de IA não encontrada'
            }, { status: 500 });
        }

        // Criar cliente OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_KEY
        });

        // Prompt System aprimorado para a IA - mais focado e eficiente
        const systemPrompt = `Você é um assistente médico especializado em análise de dados clínicos que gera resumos precisos e úteis.

Analise os dados do paciente fornecidos e produza um relatório clínico CONCISO e OBJETIVO com insights relevantes.

DIRETRIZES IMPORTANTES:
1. Seja BREVE e DIRETO - priorize insights críticos sobre detalhes exaustivos
2. Foque em ANOMALIAS e PADRÕES importantes, não liste dados normais
3. Evite linguagem excessivamente técnica - seja claro e acessível
4. Nunca invente informações - se faltar dados, indique explicitamente
5. Identifique possíveis CORRELAÇÕES entre diferentes aspectos clínicos

ESTRUTURA DO RELATÓRIO (JSON):
- profileSummary: Resumo do perfil (máximo 3-4 frases, foco em condições principais)
- alerts: Lista com 0-3 alertas críticos (array de strings curtas)
- examAnalysis: Análise de exames (máximo 3-4 frases, destaque valores anormais)
- medicationAnalysis: Análise de medicações (máximo 2-3 frases, foco em interações)
- recommendations: Lista de 2-5 recomendações clínicas objetivas (array de strings curtas)
- generatedAt: Timestamp atual

IMPORTANTE:
- Mantenha cada campo do relatório extremamente CONCISO
- Foque em INSIGHTS PRÁTICOS, não apenas resumir dados
- Destaque TENDÊNCIAS e MUDANÇAS IMPORTANTES
- Cada alerta e recomendação deve ter no máximo 12 palavras
- Priorize os dados marcados com "hasAbnormalResults: true" ou "priority_data_flags"

Seu relatório será usado por médicos ocupados que precisam de informações críticas rapidamente.`;

        // Criar o prompt do usuário com os dados do paciente
        const userPrompt = JSON.stringify(pacienteData);

        // Fazer chamada à API OpenAI com parâmetros otimizados
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,  // Valor baixo para respostas mais determinísticas e precisas
            max_tokens: 1200   // Limitar número de tokens para forçar concisão
        });

        // Extrair e validar o JSON retornado
        const resultText = response.choices[0].message.content;

        try {
            const data = JSON.parse(resultText);

            // Validar a estrutura mínima do relatório
            if (!data.profileSummary || !Array.isArray(data.alerts) || !Array.isArray(data.recommendations)) {
                throw new Error("Estrutura de dados do relatório inválida");
            }

            // Garantir que campos vazios tenham valores padrão
            data.examAnalysis = data.examAnalysis || "Não há dados de exames suficientes para análise.";
            data.medicationAnalysis = data.medicationAnalysis || "Não há dados de medicações suficientes para análise.";

            // Adicionar informações de timestamp
            data.generatedAt = new Date().toISOString();

            return NextResponse.json({
                success: true,
                data: data
            });
        } catch (parseError) {
            console.error("Erro ao processar resposta da IA:", parseError, resultText);
            return NextResponse.json({
                success: false,
                error: "Erro ao processar resposta da IA. Por favor, tente novamente."
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Erro ao processar relatório:', error);

        return NextResponse.json({
            success: false,
            error: 'Erro ao gerar relatório clínico: ' + (error.message || 'Erro desconhecido')
        }, { status: 500 });
    }
}