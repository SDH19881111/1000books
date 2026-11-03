// 국립중앙도서관 ISBN 서지정보(seoji) API.
// 알라딘에 없는 책(비매품·학교 배부 도서 등)도 ISBN만 있으면 찾을 수 있다.

export interface NlBook {
  TITLE?: string;
  AUTHOR?: string;
  PUBLISHER?: string;
  EA_ISBN?: string;
  SET_ISBN?: string;
  TITLE_URL?: string;
  PUBLISH_PREDATE?: string;
  REAL_PUBLISH_DATE?: string;
}

export interface NlSearchResponse {
  TOTAL_COUNT?: number | string;
  PAGE_NO?: number | string;
  docs?: NlBook[];
}

export function createNlLookupUrl(isbn13: string, certKey: string) {
  const apiUrl = new URL('https://www.nl.go.kr/seoji/SearchApi.do');
  apiUrl.search = new URLSearchParams({
    cert_key: certKey,
    result_style: 'json',
    page_no: '1',
    page_size: '10',
    isbn: isbn13,
  }).toString();
  return apiUrl;
}

// 20240315 → 2024-03-15 (알라딘 pubDate 형식과 맞춘다)
function formatNlDate(date?: string) {
  const digits = (date || '').replace(/\D/g, '');
  if (digits.length !== 8) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

export function normalizeNlSearch(data: NlSearchResponse) {
  const items = (data.docs || [])
    .filter((book) => book.TITLE?.trim())
    .map((book) => ({
      title: (book.TITLE || '').trim(),
      author: (book.AUTHOR || '').trim(),
      image: book.TITLE_URL || '',
      isbn: book.EA_ISBN || book.SET_ISBN || '',
      description: '',
      publisher: book.PUBLISHER || '',
      pubdate: formatNlDate(book.REAL_PUBLISH_DATE || book.PUBLISH_PREDATE),
      link: '',
    }));

  return {
    total: items.length,
    start: 1,
    display: items.length,
    items,
  };
}
