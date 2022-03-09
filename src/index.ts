import type * as Hast from 'hast'
import { heading } from 'hast-util-heading'
import { convertElement } from 'hast-util-is-element'
import type { Test } from 'hast-util-is-element'
import { h } from 'hastscript'
import type { Transformer } from 'unified'
import { visit, SKIP } from 'unist-util-visit'

interface Options {
  test?: Test
  generate?: (node: Hast.Element, id: string) => Array<Hast.Element>
}

/**
 * @see https://github.com/remarkjs/remark-autolink-headings/issues/49
 * @see https://amberwilson.co.uk/blog/are-your-anchor-links-accessible/
 */
function generateNodes(node: Hast.Element, id: string) {
  return [h('a', { ariaLabelledBy: id, href: '#' + id }, '#'), node]
}

/**
 * @see https://github.com/rehypejs/rehype-autolink-headings
 */
export default function withFragmentLinks(options: Options = {}): Transformer<Hast.Root> {
  const is = options.test != null ? convertElement(options.test) : heading
  const generate = options.generate || generateNodes

  const transformer: Transformer<Hast.Root> = function transformer(tree, _file) {
    visit(tree, 'element', function onElement(node, index, parent) {
      if (!is(node, index, parent)) return

      if (node.properties == null) return
      if (index == null || parent == null) return

      const id = node.properties['id']
      if (typeof id !== 'string') return
      if (id.length === 0) return

      const nodes = generate(node, id)

      parent.children.splice(index, 1, ...nodes)

      return [SKIP, index + nodes.length]
    })
  }

  return transformer
}
