/**
 * Templates de Notas Clinicas
 * Modelos pre-definidos para criacao rapida de notas
 */

export const NOTE_TEMPLATES = [
  {
    id: 'blank',
    name: 'Nota em Branco',
    description: 'Comece do zero',
    icon: 'FileText',
    color: '#64748b',
    content: {
      type: 'doc',
      content: []
    }
  },
  {
    id: 'protocol',
    name: 'Protocolo Clinico',
    description: 'Estrutura para protocolos medicos',
    icon: 'ClipboardList',
    color: '#3b82f6',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Protocolo: [Nome]' }]
        },
        {
          type: 'callout',
          attrs: { type: 'info' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Objetivo: Descreva o objetivo deste protocolo' }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Indicacoes' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Indicacao 1' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Indicacao 2' }] }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Contraindicacoes' }]
        },
        {
          type: 'callout',
          attrs: { type: 'warning' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Liste as contraindicacoes importantes' }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Procedimento' }]
        },
        {
          type: 'orderedList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Passo 1' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Passo 2' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Passo 3' }] }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Observacoes' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        }
      ]
    }
  },
  {
    id: 'checklist',
    name: 'Checklist',
    description: 'Lista de verificacao',
    icon: 'CheckSquare',
    color: '#22c55e',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Checklist: [Titulo]' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Data: ' }]
        },
        {
          type: 'horizontalRule'
        },
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }] },
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 2' }] }] },
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 3' }] }] },
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 4' }] }] },
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 5' }] }] }
          ]
        },
        {
          type: 'horizontalRule'
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Observacoes' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        }
      ]
    }
  },
  {
    id: 'meeting',
    name: 'Ata de Reuniao',
    description: 'Registro de reunioes e discussoes',
    icon: 'Users',
    color: '#8b5cf6',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Ata de Reuniao' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Data: ' },
            { type: 'text', text: '[DD/MM/AAAA]' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Participantes: ' },
            { type: 'text', text: '' }
          ]
        },
        {
          type: 'horizontalRule'
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Pauta' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Topico 1' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Topico 2' }] }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Discussao' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Decisoes' }]
        },
        {
          type: 'callout',
          attrs: { type: 'success' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Registre as decisoes tomadas' }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Proximos Passos' }]
        },
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Acao 1 - Responsavel: ' }] }] },
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Acao 2 - Responsavel: ' }] }] }
          ]
        }
      ]
    }
  },
  {
    id: 'daily',
    name: 'Anotacoes Diarias',
    description: 'Registro do dia a dia',
    icon: 'Calendar',
    color: '#f59e0b',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Anotacoes - [Data]' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Prioridades do Dia' }]
        },
        {
          type: 'taskList',
          content: [
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Prioridade 1' }] }] },
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Prioridade 2' }] }] },
            { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Prioridade 3' }] }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Notas' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Lembretes' }]
        },
        {
          type: 'callout',
          attrs: { type: 'tip' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Anote lembretes importantes aqui' }]
            }
          ]
        }
      ]
    }
  },
  {
    id: 'case-study',
    name: 'Estudo de Caso',
    description: 'Analise detalhada de caso clinico',
    icon: 'BookOpen',
    color: '#ec4899',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Estudo de Caso' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Identificacao' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Paciente: ' },
            { type: 'text', text: '[Iniciais]' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Idade: ' },
            { type: 'text', text: '' }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Historia Clinica' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Exames' }]
        },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Exame' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Resultado' }] }] },
                { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Referencia' }] }] }
              ]
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] },
                { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] }
              ]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Diagnostico' }]
        },
        {
          type: 'callout',
          attrs: { type: 'info' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Diagnostico principal e diferenciais' }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Conduta' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Discussao' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        }
      ]
    }
  }
];

export default NOTE_TEMPLATES;
