"use client";

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Callout } from './extensions/Callout';
import { cn } from '@/lib/utils';

// Sanitize content to remove empty text nodes that cause Tiptap errors
const sanitizeContent = (content) => {
  if (!content || typeof content !== 'object') return content;

  const sanitizeNode = (node) => {
    if (!node) return null;

    // Remove empty text nodes
    if (node.type === 'text' && (!node.text || node.text === '')) {
      return null;
    }

    // Recursively sanitize content array
    if (Array.isArray(node.content)) {
      node.content = node.content
        .map(sanitizeNode)
        .filter(n => n !== null);

      // Remove nodes with empty content arrays (except for specific types)
      if (node.content.length === 0 && !['hardBreak', 'horizontalRule'].includes(node.type)) {
        // Keep paragraph nodes but add default content
        if (node.type === 'paragraph') {
          return node;
        }
      }
    }

    return node;
  };

  return sanitizeNode({ ...content });
};

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Table as TableIcon,
  Code,
  Minus,
  Undo,
  Redo,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';

// =============================================================================
// SLASH COMMAND MENU - Comandos disponiveis
// =============================================================================

const SLASH_COMMANDS = [
  // Titulos
  { name: 'Titulo 1', command: 'heading1', icon: Heading1, description: 'Titulo grande', category: 'basico' },
  { name: 'Titulo 2', command: 'heading2', icon: Heading2, description: 'Titulo medio', category: 'basico' },
  { name: 'Titulo 3', command: 'heading3', icon: Heading3, description: 'Titulo pequeno', category: 'basico' },

  // Listas
  { name: 'Lista', command: 'bulletList', icon: List, description: 'Lista com marcadores', category: 'listas' },
  { name: 'Lista Numerada', command: 'orderedList', icon: ListOrdered, description: 'Lista numerada', category: 'listas' },
  { name: 'Checklist', command: 'taskList', icon: ListTodo, description: 'Lista de tarefas', category: 'listas' },

  // Callouts
  { name: 'Info', command: 'calloutInfo', icon: Info, description: 'Bloco informativo azul', category: 'callouts' },
  { name: 'Aviso', command: 'calloutWarning', icon: AlertTriangle, description: 'Bloco de aviso amarelo', category: 'callouts' },
  { name: 'Sucesso', command: 'calloutSuccess', icon: CheckCircle, description: 'Bloco de sucesso verde', category: 'callouts' },
  { name: 'Erro', command: 'calloutError', icon: XCircle, description: 'Bloco de erro vermelho', category: 'callouts' },
  { name: 'Dica', command: 'calloutTip', icon: Lightbulb, description: 'Bloco de dica roxo', category: 'callouts' },
  { name: 'Nota', command: 'calloutNote', icon: MessageSquare, description: 'Bloco de nota cinza', category: 'callouts' },

  // Outros
  { name: 'Citacao', command: 'blockquote', icon: Quote, description: 'Bloco de citacao', category: 'outros' },
  { name: 'Codigo', command: 'codeBlock', icon: Code, description: 'Bloco de codigo', category: 'outros' },
  { name: 'Tabela', command: 'table', icon: TableIcon, description: 'Inserir tabela 3x3', category: 'outros' },
  { name: 'Divisor', command: 'horizontalRule', icon: Minus, description: 'Linha divisoria', category: 'outros' },
];

// =============================================================================
// TOOLBAR BUTTON
// =============================================================================

const MenuButton = ({ onClick, isActive, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "p-1.5 rounded hover:bg-slate-100 transition-colors",
      isActive && "bg-primary/10 text-primary"
    )}
  >
    {children}
  </button>
);

// =============================================================================
// CALLOUT TOOLBAR
// =============================================================================

const CalloutMenu = ({ editor, isOpen, onClose, anchorEl }) => {
  if (!isOpen || !anchorEl) return null;

  const calloutTypes = [
    { type: 'info', icon: Info, label: 'Info', color: 'text-blue-600' },
    { type: 'warning', icon: AlertTriangle, label: 'Aviso', color: 'text-amber-600' },
    { type: 'success', icon: CheckCircle, label: 'Sucesso', color: 'text-green-600' },
    { type: 'error', icon: XCircle, label: 'Erro', color: 'text-red-600' },
    { type: 'tip', icon: Lightbulb, label: 'Dica', color: 'text-purple-600' },
    { type: 'note', icon: MessageSquare, label: 'Nota', color: 'text-slate-600' },
  ];

  const rect = anchorEl.getBoundingClientRect();

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 p-2 flex gap-1"
      style={{ top: rect.bottom + 4, left: rect.left }}
    >
      {calloutTypes.map(({ type, icon: Icon, label, color }) => (
        <button
          key={type}
          onClick={() => {
            editor.chain().focus().toggleCallout(type).run();
            onClose();
          }}
          title={label}
          className={cn(
            "p-2 rounded hover:bg-slate-100 transition-colors",
            color
          )}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
};

// =============================================================================
// SLASH COMMAND MENU
// =============================================================================

const SlashCommandMenu = ({ editor, isOpen, position, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filter, setFilter] = useState('');
  const menuRef = useRef(null);

  const filteredCommands = SLASH_COMMANDS.filter(cmd =>
    cmd.name.toLowerCase().includes(filter.toLowerCase()) ||
    cmd.description.toLowerCase().includes(filter.toLowerCase())
  );

  const executeCommand = useCallback((command) => {
    if (!editor) return;

    // Remove o "/" do texto
    editor.commands.deleteRange({
      from: editor.state.selection.from - filter.length - 1,
      to: editor.state.selection.from,
    });

    switch (command) {
      case 'heading1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'heading3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'taskList':
        editor.chain().focus().toggleTaskList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'codeBlock':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'table':
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case 'horizontalRule':
        editor.chain().focus().setHorizontalRule().run();
        break;
      // Callouts
      case 'calloutInfo':
        editor.chain().focus().toggleCallout('info').run();
        break;
      case 'calloutWarning':
        editor.chain().focus().toggleCallout('warning').run();
        break;
      case 'calloutSuccess':
        editor.chain().focus().toggleCallout('success').run();
        break;
      case 'calloutError':
        editor.chain().focus().toggleCallout('error').run();
        break;
      case 'calloutTip':
        editor.chain().focus().toggleCallout('tip').run();
        break;
      case 'calloutNote':
        editor.chain().focus().toggleCallout('note').run();
        break;
    }

    onClose();
  }, [editor, filter, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(0);
      setFilter('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev <= 0 ? filteredCommands.length - 1 : prev - 1
          );
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev >= filteredCommands.length - 1 ? 0 : prev + 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex].command);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, executeCommand, onClose]);

  if (!isOpen) return null;

  // Agrupar comandos por categoria
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const cat = cmd.category || 'outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cmd);
    return acc;
  }, {});

  const categoryLabels = {
    basico: 'Basico',
    listas: 'Listas',
    callouts: 'Callouts',
    outros: 'Outros',
  };

  let globalIndex = -1;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-2 min-w-[260px] max-h-[400px] overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {Object.entries(groupedCommands).map(([category, commands]) => (
        <div key={category}>
          <div className="px-3 py-1.5 text-xs text-slate-400 uppercase tracking-wider font-medium">
            {categoryLabels[category] || category}
          </div>
          {commands.map((cmd) => {
            globalIndex++;
            const currentIndex = globalIndex;
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.command}
                type="button"
                onClick={() => executeCommand(cmd.command)}
                className={cn(
                  "w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors",
                  currentIndex === selectedIndex && "bg-slate-100"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded flex items-center justify-center",
                  cmd.category === 'callouts' ? 'bg-slate-50' : 'bg-slate-100'
                )}>
                  <Icon className={cn(
                    "w-4 h-4",
                    cmd.command === 'calloutInfo' && 'text-blue-600',
                    cmd.command === 'calloutWarning' && 'text-amber-600',
                    cmd.command === 'calloutSuccess' && 'text-green-600',
                    cmd.command === 'calloutError' && 'text-red-600',
                    cmd.command === 'calloutTip' && 'text-purple-600',
                    cmd.command === 'calloutNote' && 'text-slate-600',
                    !cmd.command.startsWith('callout') && 'text-slate-600'
                  )} />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">{cmd.name}</div>
                  <div className="text-xs text-slate-500">{cmd.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
      {filteredCommands.length === 0 && (
        <div className="px-3 py-4 text-center text-sm text-slate-500">
          Nenhum comando encontrado
        </div>
      )}
    </div>
  );
};

// =============================================================================
// MAIN EDITOR COMPONENT
// =============================================================================

const MedicalEditor = ({
  content,
  onUpdate,
  placeholder = "Digite '/' para ver os comandos...",
  editable = true,
  className,
  autoFocus = false,
}) => {
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [calloutMenuOpen, setCalloutMenuOpen] = useState(false);
  const [calloutAnchor, setCalloutAnchor] = useState(null);
  const editorRef = useRef(null);
  const calloutButtonRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Callout,
    ],
    content: sanitizeContent(content),
    editable,
    autofocus: autoFocus,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onUpdate?.(json);

      // Detect slash command
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 10),
        from,
        ' '
      );

      if (textBefore.endsWith('/') || textBefore.match(/\/\w*$/)) {
        const coords = editor.view.coordsAtPos(from);
        setSlashMenuPosition({
          top: coords.bottom + 8,
          left: coords.left,
        });
        setSlashMenuOpen(true);
      } else {
        setSlashMenuOpen(false);
      }
    },
  });

  useEffect(() => {
    if (editor && content) {
      const sanitized = sanitizeContent(content);
      if (JSON.stringify(editor.getJSON()) !== JSON.stringify(sanitized)) {
        editor.commands.setContent(sanitized);
      }
    }
  }, [content, editor]);

  const closeSlashMenu = useCallback(() => {
    setSlashMenuOpen(false);
  }, []);

  if (!editor) return null;

  return (
    <div ref={editorRef} className={cn("relative bg-white rounded-lg border border-slate-200", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200 flex-wrap">
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Desfazer"
        >
          <Undo className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Refazer"
        >
          <Redo className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italico"
        >
          <Italic className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Sublinhado"
        >
          <UnderlineIcon className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Riscado"
        >
          <Strikethrough className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          title="Destacar"
        >
          <Highlighter className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Titulo 1"
        >
          <Heading1 className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Titulo 2"
        >
          <Heading2 className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Titulo 3"
        >
          <Heading3 className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Lista"
        >
          <List className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Lista Numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          title="Checklist"
        >
          <ListTodo className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Citacao"
        >
          <Quote className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Codigo"
        >
          <Code className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Tabela"
        >
          <TableIcon className="w-4 h-4" />
        </MenuButton>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Callout buttons */}
        <div ref={calloutButtonRef} className="relative">
          <MenuButton
            onClick={() => {
              setCalloutAnchor(calloutButtonRef.current);
              setCalloutMenuOpen(!calloutMenuOpen);
            }}
            isActive={editor.isActive('callout')}
            title="Callout"
          >
            <Info className="w-4 h-4" />
          </MenuButton>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Slash Command Menu */}
      <SlashCommandMenu
        editor={editor}
        isOpen={slashMenuOpen}
        position={slashMenuPosition}
        onClose={closeSlashMenu}
      />

      {/* Callout Menu */}
      <CalloutMenu
        editor={editor}
        isOpen={calloutMenuOpen}
        onClose={() => setCalloutMenuOpen(false)}
        anchorEl={calloutAnchor}
      />

      {/* Editor Styles */}
      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }

        .ProseMirror:focus {
          outline: none;
        }

        .ProseMirror h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }

        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .ProseMirror ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          margin-top: 0.25rem;
        }

        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }

        .ProseMirror blockquote {
          border-left: 3px solid #e2e8f0;
          padding-left: 1rem;
          margin: 0.5rem 0;
          color: #64748b;
        }

        .ProseMirror pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
        }

        .ProseMirror code {
          background: #f1f5f9;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, monospace;
          font-size: 0.875rem;
        }

        .ProseMirror pre code {
          background: none;
          padding: 0;
        }

        .ProseMirror hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 1rem 0;
        }

        .ProseMirror table {
          border-collapse: collapse;
          margin: 1rem 0;
          width: 100%;
        }

        .ProseMirror th,
        .ProseMirror td {
          border: 1px solid #e2e8f0;
          padding: 0.5rem 0.75rem;
          text-align: left;
        }

        .ProseMirror th {
          background: #f8fafc;
          font-weight: 600;
        }

        .ProseMirror mark {
          background: #fef08a;
          padding: 0 0.125rem;
          border-radius: 0.125rem;
        }

        .ProseMirror p {
          margin: 0.25rem 0;
        }

        /* Callout Styles */
        .ProseMirror .callout {
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 0.75rem 0;
          border-left: 4px solid;
        }

        .ProseMirror .callout-info {
          background: #eff6ff;
          border-left-color: #3b82f6;
        }

        .ProseMirror .callout-warning {
          background: #fffbeb;
          border-left-color: #f59e0b;
        }

        .ProseMirror .callout-success {
          background: #f0fdf4;
          border-left-color: #22c55e;
        }

        .ProseMirror .callout-error {
          background: #fef2f2;
          border-left-color: #ef4444;
        }

        .ProseMirror .callout-tip {
          background: #faf5ff;
          border-left-color: #a855f7;
        }

        .ProseMirror .callout-note {
          background: #f8fafc;
          border-left-color: #64748b;
        }

        .ProseMirror .callout p {
          margin: 0;
        }

        .ProseMirror .callout p:first-child {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default MedicalEditor;
