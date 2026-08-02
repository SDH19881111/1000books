export interface AladinBook {
  title?: string;
  author?: string;
  cover?: string;
  isbn?: string;
  isbn13?: string;
  description?: string;
  publisher?: string;
  pubDate?: string;
  pubdate?: string;
  link?: string;
}

export interface AladinSearchResponse {
  errorCode?: number | string;
  errorMessage?: string;
  totalResults?: number;
  startIndex?: number;
  item?: AladinBook[];
}

export function createAladinSearchUrl(query: string, ttbKey: string) {
  const apiUrl = new URL('https://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
  apiUrl.search = new URLSearchParams({
    ttbkey: ttbKey,
    Query: query,
    QueryType: 'Keyword',
    MaxResults: '10',
    start: '1',
    SearchTarget: 'Book',
    output: 'JS',
    Version: '20131101',
    Cover: 'Big',
    InputEncoding: 'utf-8',
  }).toString();
  return apiUrl;
}

export function normalizeAladinSearch(data: AladinSearchResponse) {
  const items = (data.item || []).map((book) => ({
    title: book.title || '',
    author: book.author || '',
    image: book.cover || '',
    isbn: book.isbn13 || book.isbn || '',
    description: book.description || '',
    publisher: book.publisher || '',
    pubdate: book.pubDate || book.pubdate || '',
    link: book.link || '',
  }));

  return {
    total: data.totalResults || items.length,
    start: data.startIndex || 1,
    display: items.length,
    items,
  };
}
