import { describe, expect, it } from 'vitest';
import { slugify, readingMinutes } from '@/lib/format';
import { DocumentInput, PostInput, UploadRequest } from '@/lib/validation';
import { safeStudioPath } from '@/lib/auth-paths';

describe('slugify', () => {
  it('produces database-valid slugs', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
    expect(slugify('  Café  Économie  ')).toBe('cafe-economie');
    expect(slugify('---a---b---')).toBe('a-b');
    expect(slugify('x'.repeat(200)).length).toBeLessThanOrEqual(120);
  });
});

describe('readingMinutes', () => {
  it('is at least one minute', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('word '.repeat(450))).toBe(2);
  });
});

const basePost = { title: 'T', slug: 'ok-slug', excerpt: '', content: '', category: '', featured: false, status: 'draft' };

describe('PostInput', () => {
  it('accepts a valid post and normalises empty category to null', () => {
    const r = PostInput.parse(basePost);
    expect(r.category).toBeNull();
  });
  it.each(['Bad Slug', 'trailing-', '-leading', 'double--hyphen', 'UPPER'])('rejects slug %s', (slug) => {
    expect(PostInput.safeParse({ ...basePost, slug }).success).toBe(false);
  });
  it('rejects empty titles and unknown statuses', () => {
    expect(PostInput.safeParse({ ...basePost, title: '  ' }).success).toBe(false);
    expect(PostInput.safeParse({ ...basePost, status: 'archived' }).success).toBe(false);
  });
});

describe('DocumentInput', () => {
  const base = { title: 'D', slug: 'd', description: '', category: '', status: 'draft' };
  it('requires a file for file sources and https links for link sources', () => {
    expect(DocumentInput.safeParse({ ...base, source: 'file', file_path: '' }).success).toBe(false);
    expect(DocumentInput.safeParse({ ...base, source: 'file', file_path: 'abc-123.pdf' }).success).toBe(true);
    expect(DocumentInput.safeParse({ ...base, source: 'file', file_path: '../etc/passwd' }).success).toBe(false);
    expect(DocumentInput.safeParse({ ...base, source: 'link', external_url: 'http://insecure.example' }).success).toBe(false);
    expect(DocumentInput.safeParse({ ...base, source: 'link', external_url: 'javascript:alert(1)' }).success).toBe(false);
    expect(DocumentInput.safeParse({ ...base, source: 'link', external_url: 'https://docs.google.com/x' }).success).toBe(true);
  });
});

describe('UploadRequest', () => {
  it('only allows PDFs up to 10 MB', () => {
    expect(UploadRequest.safeParse({ fileName: 'a.pdf', size: 1000, type: 'application/pdf' }).success).toBe(true);
    expect(UploadRequest.safeParse({ fileName: 'a.exe', size: 1000, type: 'application/x-msdownload' }).success).toBe(false);
    expect(UploadRequest.safeParse({ fileName: 'a.pdf', size: 11 * 1024 * 1024, type: 'application/pdf' }).success).toBe(false);
  });
});

describe('safeStudioPath (open-redirect protection)', () => {
  it.each([
    ['/studio/posts', '/studio/posts'],
    ['https://evil.example', '/studio'],
    ['//evil.example', '/studio'],
    ['/studio\\@evil', '/studio'],
    ['/elsewhere', '/studio'],
    ['/studio/login', '/studio'],
    [undefined, '/studio'],
  ])('%s → %s', (input, expected) => {
    expect(safeStudioPath(input)).toBe(expected);
  });
});

import { PasswordChange } from '@/lib/validation';

describe('PasswordChange', () => {
  const ok = { current: 'Old-Passw0rd-1', next: 'New-Passw0rd-12', confirm: 'New-Passw0rd-12' };
  it('accepts a strong, confirmed, different password', () => {
    expect(PasswordChange.safeParse(ok).success).toBe(true);
  });
  it.each([
    ['too short', { ...ok, next: 'Ab1', confirm: 'Ab1' }],
    ['no uppercase', { ...ok, next: 'all-lower-pass1', confirm: 'all-lower-pass1' }],
    ['no digit', { ...ok, next: 'No-Digits-Here-x', confirm: 'No-Digits-Here-x' }],
    ['mismatch', { ...ok, confirm: 'Different-Passw0rd' }],
    ['same as current', { current: 'Same-Passw0rd-12', next: 'Same-Passw0rd-12', confirm: 'Same-Passw0rd-12' }],
  ])('rejects %s', (_label, input) => {
    expect(PasswordChange.safeParse(input).success).toBe(false);
  });
});
