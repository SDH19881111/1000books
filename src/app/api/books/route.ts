import { NextRequest, NextResponse } from 'next/server';
import {
  AladinSearchResponse,
  createAladinSearchUrl,
  normalizeAladinSearch,
} from '@/lib/aladinBooks';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: '검색어를 입력해주세요.' }, { status: 400 });
  }

  const ttbKey = process.env.ALADIN_TTB_KEY;

  if (!ttbKey) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
  }

  try {
    const apiUrl = createAladinSearchUrl(query, ttbKey);

    const res = await fetch(apiUrl, { cache: 'no-store' });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Aladin API error:', errText);
      return NextResponse.json({ error: '알라딘 API 오류가 발생했습니다.' }, { status: res.status });
    }

    const data = (await res.json()) as AladinSearchResponse;

    if (data.errorCode) {
      console.error('Aladin API error:', data.errorCode, data.errorMessage);
      return NextResponse.json(
        { error: data.errorMessage || '알라딘 API 오류가 발생했습니다.' },
        { status: 502 }
      );
    }

    return NextResponse.json(normalizeAladinSearch(data));
  } catch (err) {
    console.error('fetch error:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
