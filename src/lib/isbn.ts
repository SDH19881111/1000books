// 바코드(EAN-13)·직접 입력한 문자열에서 도서 ISBN-13을 골라낸다.
// 책 뒷면 바코드는 978/979로 시작하는 EAN-13이며, 마지막 자리는 검증 숫자다.

function hasValidIsbn13Checksum(digits: string) {
  const sum = digits
    .slice(0, 12)
    .split('')
    .reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10 === Number(digits[12]);
}

function isbn10ToIsbn13(isbn10: string) {
  const body = `978${isbn10.slice(0, 9)}`;
  const sum = body
    .split('')
    .reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return body + ((10 - (sum % 10)) % 10);
}

function hasValidIsbn10Checksum(isbn10: string) {
  const sum = isbn10.split('').reduce((acc, ch, i) => {
    const value = ch === 'X' ? 10 : Number(ch);
    return acc + value * (10 - i);
  }, 0);
  return sum % 11 === 0;
}

/** 유효한 도서 ISBN이면 ISBN-13으로 돌려주고, 아니면 null */
export function parseIsbn(input: string): string | null {
  const compact = input.replace(/[\s-]/g, '').toUpperCase();

  if (/^97[89]\d{10}$/.test(compact)) {
    return hasValidIsbn13Checksum(compact) ? compact : null;
  }

  if (/^\d{9}[\dX]$/.test(compact)) {
    return hasValidIsbn10Checksum(compact) ? isbn10ToIsbn13(compact) : null;
  }

  return null;
}
