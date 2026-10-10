import assert from 'node:assert/strict';
import test from 'node:test';
import { parseIsbn } from '@/lib/isbn';
import { createAladinLookupUrl } from '@/lib/aladinBooks';

test('book barcodes (EAN-13 starting with 978/979) are accepted only with a valid checksum', () => {
  assert.equal(parseIsbn('9788936434120'), '9788936434120');
  assert.equal(parseIsbn('978-89-364-3412-0'), '9788936434120');
  assert.equal(parseIsbn(' 9791160505771 '), '9791160505771');
  assert.equal(parseIsbn('9788936434121'), null);
});

test('non-book barcodes and plain titles are not treated as ISBNs', () => {
  assert.equal(parseIsbn('8801234567893'), null);
  assert.equal(parseIsbn('어린 왕자'), null);
  assert.equal(parseIsbn('12345'), null);
});

test('ISBN-10 is converted to ISBN-13', () => {
  assert.equal(parseIsbn('8936434128'), '9788936434120');
  assert.equal(parseIsbn('0-306-40615-2'), '9780306406157');
  assert.equal(parseIsbn('8936434120'), null);
});

test('ISBN lookups use the Aladin ItemLookUp endpoint', () => {
  const url = createAladinLookupUrl('9788936434120', 'key');
  assert.equal(url.pathname, '/ttb/api/ItemLookUp.aspx');
  assert.equal(url.searchParams.get('ItemId'), '9788936434120');
  assert.equal(url.searchParams.get('ItemIdType'), 'ISBN13');
});
