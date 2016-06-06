'use strict';

var fs = require('fs'),
  path = require('path'),
  File = require('vinyl'),
  vfs = require('vinyl-fs'),
  _ = require('lodash'),
  concat = require('concat-stream'),
  formatters = require('./lib/formatters'),
  highlight = require('./lib/highlight');

module.exports = function (comments, options, callback) {

  var namespaces = comments.map(function (comment) {
    return comment.namespace;
  });

  var sharedImports = {
    imports: {
      shortSignature: function (section, hasSectionName) {
        var prefix = '';
        if (section.kind === 'class') {
          prefix = 'new ';
        }
        if (section.kind !== 'function' && !hasSectionName) {
          return '';
        }
        if (hasSectionName) {
          return prefix + section.name + formatters.parameters(section, true);
        } else if (!hasSectionName && formatters.parameters(section)) {
          return formatters.parameters(section, true);
        }
        return '()';
      },
      signature: function (section, hasSectionName) {
        var returns = '';
        var prefix = '';
        if (section.kind === 'class') {
          prefix = 'new ';
        } else if (section.kind !== 'function') {
          return section.name;
        }
        if (section.returns) {
          returns = ': ' +
            formatters.type(section.returns[0].type, namespaces);
        }
        if (hasSectionName) {
          return prefix + section.name +
            formatters.parameters(section) + returns;
        } else if (!hasSectionName && formatters.parameters(section)) {
          return section.name + formatters.parameters(section) + returns;
        }
        return section.name + '()' + returns;
      },
      md: function (ast, inline) {
        if (inline && ast && ast.children.length && ast.children[0].type === 'paragraph') {
          ast = {
            type: 'root',
            children: ast.children[0].children.concat(ast.children.slice(1))
          };
        }
        return formatters.markdown(ast, namespaces);
      },
      formatType: function (section) {
        return formatters.type(section.type, namespaces);
      },
      autolink: function (text) {
        return formatters.link(namespaces, text);
      },
      highlight: highlight(options.hljs || {})
    }
  };

  var pageTemplate = _.template(
    fs.readFileSync(path.join(__dirname, 'index._'), 'utf8'), {
      imports: {
        renderSection: _.template(
          fs.readFileSync(path.join(__dirname, 'section._'), 'utf8'),
          sharedImports),
        renderNote: _.template(
          fs.readFileSync(path.join(__dirname, 'note._'), 'utf8'),
          sharedImports),
        renderSectionList: _.template(
          fs.readFileSync(path.join(__dirname, 'section_list._'), 'utf8'),
          sharedImports)
      }
    });

  // push assets into the pipeline as well.
  vfs.src([__dirname + '/assets/**'], { base: __dirname })
    .pipe(concat(function (files) {
      callback(null, files.concat(new File({
        path: 'index.html',
        contents: new Buffer(pageTemplate({
          docs: comments,
          options: options
        }), 'utf8')
      })));
    }));
};
