// Local contract checks. Platform rendering and editor acceptance remain separate checks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const manifest = JSON.parse(fs.readFileSync('twilight.json'));
const locales = ['ar', 'en'].map(language => JSON.parse(fs.readFileSync(`src/locales/${language}.json`)));
const components = manifest.components.filter(component => component.path.startsWith('home.noora-'));
assert.equal(components.length, 6, 'All six merchant blocks must be registered');
assert.equal(new Set(manifest.components.map(component => component.key)).size, manifest.components.length);
assert.equal(new Set(manifest.components.map(component => component.path)).size, manifest.components.length);
function fields(items) {
  assert.equal(new Set(items.map(item => item.id)).size, items.length, 'Duplicate sibling field IDs');
  for (const field of items) {
    assert.ok(['string', 'number', 'boolean', 'items', 'collection', 'static'].includes(field.type));
    if (field.type === 'boolean' && field.value !== undefined) assert.equal(typeof field.value, 'boolean');
    if (field.fields) fields(field.fields);
    if (field.source && field.format === 'dropdown-list') assert.ok(Array.isArray(field.options));
    if (field.multilanguage && field.value && typeof field.value === 'object') {
      assert.ok('ar' in field.value && 'en' in field.value, `Missing localized default for ${field.id}`);
    }
  }
}
fields(manifest.settings.filter(field => field.id?.startsWith('nl_')));
for (const component of components) {
  fields(component.fields);
  assert.ok(fs.existsSync(`src/views/components/${component.path.replaceAll('.', '/')}.twig`));
}
for (const locale of locales) assert.deepEqual(Object.keys(locale.noora).sort(), Object.keys(locales[0].noora).sort());
const product = fs.readFileSync('src/views/components/noora/products.twig', 'utf8');
assert.ok(product.includes('custom-salla-product-card') && product.includes('product.id'));
assert.ok(!/\b(?:SAR|USD)\b|source-value="\[\d/.test(product), 'No fixed currency/product IDs');
const picture = fs.readFileSync('src/views/components/noora/picture.twig', 'utf8');
assert.ok(picture.includes('fetchpriority="high"') && picture.includes("'eager' : 'lazy'"));
for (const name of ['hero-1440','hero-960','hero-mobile','editorial-1024','editorial-640','editorial-mobile']) {
  const file = `src/assets/images/noora/${name}.webp`;
  assert.ok(fs.statSync(file).size < 250000, `${file} exceeds demo image budget`);
}
const home = fs.readFileSync('src/views/pages/index.twig', 'utf8');
assert.ok(home.includes('{% component home %}') && !home.includes('preview check'));
const layout = fs.readFileSync('src/views/layouts/master.twig', 'utf8');
for (const integration of ["{% hook 'head:start' %}", '{% hook head %}', "{% hook 'body:end' %}", '<salla-login-modal', '<salla-search']) assert.ok(layout.includes(integration), `Missing ${integration}`);
console.log('PASS: six component registrations, field/default/locale contracts, native product integration, image budget/loading, dispatcher and platform hooks.');
console.log('These checks do not validate server rendering, editor import or live commerce.');
