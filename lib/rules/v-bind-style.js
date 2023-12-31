/**
 * @author Toru Nagashima
 * @copyright 2017 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
'use strict'

const utils = require('../utils')

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'enforce `v-bind` directive style',
      categories: ['vue3-strongly-recommended', 'strongly-recommended'],
      url: 'https://eslint.vuejs.org/rules/v-bind-style.html'
    },
    fixable: 'code',
    schema: [{ enum: ['shorthand', 'longform'] }],
    messages: {
      expectedLonghand: "Expected 'v-bind' before ':'.",
      unexpectedLonghand: "Unexpected 'v-bind' before ':'.",
      expectedLonghandForProp: "Expected 'v-bind:' instead of '.'."
    }
  },
  /** @param {RuleContext} context */
  create(context) {
    const preferShorthand = context.options[0] !== 'longform'

    return utils.defineTemplateBodyVisitor(context, {
      /** @param {VDirective} node */
      "VAttribute[directive=true][key.name.name='bind'][key.argument!=null]"(
        node
      ) {
        const shorthandProp = node.key.name.rawName === '.'
        const shorthand = node.key.name.rawName === ':' || shorthandProp
        if (shorthand === preferShorthand) {
          return
        }

        let messageId = 'expectedLonghand'
        if (preferShorthand) {
          messageId = 'unexpectedLonghand'
        } else if (shorthandProp) {
          messageId = 'expectedLonghandForProp'
        }

        context.report({
          node,
          loc: node.loc,
          messageId,
          *fix(fixer) {
            if (preferShorthand) {
              yield fixer.remove(node.key.name)
            } else {
              yield fixer.insertTextBefore(node, 'v-bind')

              if (shorthandProp) {
                // Replace `.` by `:`.
                yield fixer.replaceText(node.key.name, ':')

                // Insert `.prop` modifier if it doesn't exist.
                const modifier = node.key.modifiers[0]
                const isAutoGeneratedPropModifier =
                  modifier.name === 'prop' && modifier.rawName === ''
                if (isAutoGeneratedPropModifier) {
                  yield fixer.insertTextBefore(modifier, '.prop')
                }
              }
            }
          }
        })
      }
    })
  }
}
