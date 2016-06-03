var u = require('unist-builder'),
  globalsDocs = require('globals-docs');

/**
 * Helper used to automatically link items to global JS documentation or to internal
 * documentation.
 *
 * @param {String} text - text to potentially link
 * @param {function} [getHref] - a function that tries
 * to find a URL to point a named link to
 * @param {string} description text that will be shown to the user, if this
 * is a two-part link with both target and text
 * @returns {Object} [mdast](https://www.npmjs.com/package/mdast) node
 * @example
 * link('string').url // => 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String'
 */
function link(text, getHref, description) {
  var href = (getHref && getHref(text)) || globalsDocs.getDoc(text);
  if (href) {
    // TODO: this is a temporary fix until we drop remark 3.x support,
    // and then we should remove the 'href' property and only
    // have the url property of links
    return u('link', {
      href: href,
      url: href
    }, [u('text', description || text)]);
  }
  return u('text', text);
}

module.exports = link;
