import { NextRequest, NextResponse } from 'next/server';
import {
  AladinSearchResponse,
  createAladinLookupUrl,
  createAladinSearchUrl,
  normalizeAladinSearch,
} from '@/lib/aladinBooks';
import { NlSearchResponse, createNlLookupUrl, normalizeNlSearch } from '@/lib/nlBooks';
import { parseIsbn } from '@/lib/isbn';

const EMPTY_RESULT = normalizeAladinSearch({});
const TITLE_SEARCH_DOWN =
  '지금은 제목 검색이 잘 안 돼요. 📷 바코드로 찾거나 아래에 직접 입력해 주세요.';

// 알라딘 응답을 읽는다. 서비스 종료 등으로 JSON이 아니면 null
async function readAladin(url: URL) {
  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();
  try {
    const data = JSON.parse(text) as AladinSearchResponse;
    return res.ok ? data : null;
  } catch {
    console.error('Aladin API error:', res.status, text.slice(0, 200));
    return null;
  }
}

// 국립중앙도서관에서 ISBN 조회. 없는 책이거나 오류면 null
async function lookupNl(isbn: string, certKey: string) {
  try {
    const res = await fetch(createNlLookupUrl(isbn, certKey), { cache: 'no-store' });
    if (!res.ok) {
      console.error('NL API error:', await res.text());
      return null;
    }
    const result = normalizeNlSearch((await res.json()) as NlSearchResponse);
    return result.items.length > 0 ? result : null;
  } catch (err) {
    console.error('NL API error:', err);
    return null;
  }
}

// 알라딘에서 ISBN 한 권 조회. 없는 책이거나 오류면 null
async function lookupAladin(isbn: string, ttbKey: string) {
  try {
    const data = await readAladin(createAladinLookupUrl(isbn, ttbKey));
    if (!data || data.errorCode) return null;
    const result = normalizeAladinSearch(data);
    return result.items.length > 0 ? result : null;
  } catch (err) {
    console.error('Aladin API error:', err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: '검색어를 입력해주세요.' }, { status: 400 });
  }

  const ttbKey = process.env.ALADIN_TTB_KEY;
  const nlKey = process.env.NL_CERT_KEY;
  const isbn = parseIsbn(query);

  // 바코드/ISBN이면 국립중앙도서관 → 알라딘 순서로 그 책 한 권을 찾는다
  if (isbn) {
    if (!ttbKey && !nlKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
    }
    const found =
      (nlKey ? await lookupNl(isbn, nlKey) : null) ??
      (ttbKey ? await lookupAladin(isbn, ttbKey) : null);
    return NextResponse.json(found ?? EMPTY_RESULT);
  }

  if (!ttbKey) {
    return NextResponse.json({ error: TITLE_SEARCH_DOWN }, { status: 503 });
  }

  try {
    const data = await readAladin(createAladinSearchUrl(query, ttbKey));

    if (!data || data.errorCode) {
      if (data) console.error('Aladin API error:', data.errorCode, data.errorMessage);
      return NextResponse.json({ error: TITLE_SEARCH_DOWN }, { status: 503 });
    }

    return NextResponse.json(normalizeAladinSearch(data));
  } catch (err) {
    console.error('fetch error:', err);
    return NextResponse.json({ error: TITLE_SEARCH_DOWN }, { status: 503 });
  }
}
