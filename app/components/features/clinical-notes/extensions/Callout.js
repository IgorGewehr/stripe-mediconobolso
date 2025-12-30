import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Callout Extension para Tiptap
 * Blocos de destaque coloridos estilo Notion
 */
export const Callout = Node.create({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-type') || 'info',
        renderHTML: attributes => ({
          'data-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '', class: `callout callout-${HTMLAttributes['data-type'] || 'info'}` }), 0];
  },

  addCommands() {
    return {
      setCallout: (type = 'info') => ({ commands }) => {
        return commands.wrapIn(this.name, { type });
      },
      toggleCallout: (type = 'info') => ({ commands }) => {
        return commands.toggleWrap(this.name, { type });
      },
      setCalloutType: (type) => ({ commands, state }) => {
        const { from, to } = state.selection;
        return commands.updateAttributes(this.name, { type });
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-c': () => this.editor.commands.toggleCallout('info'),
    };
  },
});

export default Callout;
