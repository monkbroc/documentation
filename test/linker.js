var linker = require('../lib/output/util/linker'),
  test = require('tap').test;

test('linker', function (t) {

  t.equal(linker({})('string'),
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String',
    'Default global resolution of string');

  t.equal(linker({
    paths: {
      Point: 'http://geojson.org/geojson-spec.html#point'
    }
  })('Point'),
    'http://geojson.org/geojson-spec.html#point',
    'Custom hardcoded path for a GeoJSON type');

  t.end();
});
