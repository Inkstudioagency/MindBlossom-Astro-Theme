/**
 * Renders Strapi "Blocks" rich text to HTML that matches Webflow's rich text output,
 * so the template's `.w-richtext` styles apply unchanged.
 */

type TextNode = { type: 'text'; text: string; bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean; code?: boolean };
type LinkNode = { type: 'link'; url: string; children: TextNode[] };
type InlineNode = TextNode | LinkNode;
type ImageData = { url: string; alternativeText?: string | null; width?: number | null; height?: number | null };
type Block =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: 'list'; format: 'ordered' | 'unordered'; children: Array<{ type: 'list-item'; children: InlineNode[] } | Block> }
  | { type: 'quote'; children: InlineNode[] }
  | { type: 'code'; children: TextNode[] }
  | { type: 'image'; image: ImageData };

export interface RenderOptions {
  /**
   * How images are laid out, like Webflow's rich text image alignment:
   * - "fullwidth": as wide as the text column, up to the image's own width
   * - "normal": Webflow's default figure (up to 60% of the text column)
   */
  imageAlign?: 'fullwidth' | 'normal';
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function text(node: TextNode): string {
  // soft line breaks (Shift+Enter in the editor) become <br>, like in Webflow
  let html = escape(node.text).replace(/\n/g, '<br>');
  if (node.code) html = `<code>${html}</code>`;
  if (node.strikethrough) html = `<s>${html}</s>`;
  if (node.underline) html = `<u>${html}</u>`;
  if (node.italic) html = `<em>${html}</em>`;
  if (node.bold) html = `<strong>${html}</strong>`;
  return html;
}

function inline(nodes: InlineNode[]): string {
  return nodes.map((n) => (n.type === 'link' ? `<a href="${escape(n.url)}">${inline(n.children)}</a>` : text(n))).join('');
}

function image(img: ImageData, align: RenderOptions['imageAlign']): string {
  const tag = `<img alt="${escape(img.alternativeText ?? '')}" src="${escape(img.url)}" loading="lazy">`;
  if (align === 'normal') {
    return `<figure class="w-richtext-figure-type-image" data-rt-type="image" data-rt-align=""><div>${tag}</div></figure>`;
  }
  const maxWidth = img.width ? ` style="max-width:${img.width}px"` : '';
  return `<figure class="w-richtext-figure-type-image w-richtext-align-fullwidth"${maxWidth} data-rt-type="image" data-rt-align="fullwidth"><div>${tag}</div></figure>`;
}

function block(b: Block, options: RenderOptions): string {
  switch (b.type) {
    case 'paragraph':
      return `<p>${inline(b.children)}</p>`;
    case 'heading':
      return `<h${b.level}>${inline(b.children)}</h${b.level}>`;
    case 'list': {
      const tag = b.format === 'ordered' ? 'ol' : 'ul';
      const items = b.children.map((c) => (c.type === 'list-item' ? `<li>${inline(c.children)}</li>` : block(c, options))).join('');
      return `<${tag}>${items}</${tag}>`;
    }
    case 'quote':
      return `<blockquote>${inline(b.children)}</blockquote>`;
    case 'code':
      return `<pre><code>${b.children.map((c) => escape(c.text)).join('')}</code></pre>`;
    case 'image':
      return b.image?.url ? image(b.image, options.imageAlign ?? 'fullwidth') : '';
    default:
      return '';
  }
}

export function renderBlocks(blocks: unknown[] | null | undefined, options: RenderOptions = {}): string {
  return ((blocks as Block[] | undefined) ?? []).map((b) => block(b, options)).join('');
}
