var remark = require('remark'),
  html = require('remark-html'),
  Syntax = require('doctrine').Syntax,
  visit = require('unist-util-visit'),
  formatType = require('../../lib/output/util/format_type'),
  link = require('../../lib/output/util/link');

function getHref(paths) {
  return function (text) {
    if (paths && paths.indexOf(text) !== -1) {
      return '#' + text;
    }
  };
}

/**
 * Reroute inline jsdoc links in documentation
 * @param {Object} ast remark AST
 * @returns {Object} that ast with rerouted links
 * @private
 */
function rerouteLinks(ast) {
  visit(ast, 'link', function (node) {
    if (node.jsdoc && !node.url.match(/^(http|https|\.)/)) {
      node.url = '#' + node.url;
    }
  });
  return ast;
}

/**
 * This helper is exposed in templates as `md` and is useful for showing
 * Markdown-formatted text as proper HTML.
 *
 * @name formatMarkdown
 * @param {Object} ast - mdast tree
 * @returns {string} HTML
 * @private
 * @example
 * var x = remark.parse('## foo');
 * // in template
 * // {{ md x }}
 * // generates <h2>foo</h2>
 */
module.exports.markdown = function (ast) {
  if (ast) {
    return remark().use(html).stringify(rerouteLinks(ast));
  }
};

module.exports.type = function (type, paths) {
  return module.exports.markdown({
    type: 'root',
    children: formatType(type, getHref(paths))
  }).replace(/\n/g, '');
};

/**
 * Link text to this page or to a central resource.
 * @param {Array<string>} paths list of valid namespace paths that are linkable
 * @param {string} text inner text of the link
 * @param {string} description link text override
 * @returns {string} potentially linked HTML
 */
module.exports.link = function (paths, text, description) {
  return module.exports({
    type: 'root',
    children: [link(text, getHref(paths), description)]
  }).replace(/\n/g, '');
};

/**
 * Format a parameter name. This is used in formatParameters
 * and just needs to be careful about differentiating optional
 * parameters
 *
 * @param {Object} param a param as a type spec
 * @returns {string} formatted parameter representation.
 */
function formatParameter(param, short) {
  if (short) {
    return param.type.type == Syntax.OptionalType ? '[' + param.name + ']' : param.name;
  } else {
    return param.name + ': ' + formatMarkdown.type(param.type).replace(/\n/g, '');
  }
}

/**
 * Format the parameters of a function into a quickly-readable
 * summary that resembles how you would call the function
 * initially.
 *
 * @param {Object} section  comment node from documentation
 * @returns {string} formatted parameters
 */
module.exports.parameters = function (section, short) {
  if (section.params) {
    return '(' + section.params.map(function (param) {
      return formatParameter(param, short);
    }).join(', ') + ')';
  } else if (!section.params && (section.kind === 'function' || section.kind === 'class')) {
    return '()';
  }
  return '';
};
