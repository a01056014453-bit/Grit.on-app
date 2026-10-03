import { describe, it, expect } from 'vitest';
import { isDeferredReleaseRoute } from '../../src/lib/release-scope';
describe('first free release scope', () => {
  it('blocks deferred pages and their APIs', () => {
    for (const path of ['/rooms', '/rooms/123/upload', '/teachers', '/profile/teacher-register', '/api/feedback/upload-url', '/api/help-requests']) expect(isDeferredReleaseRoute(path)).toBe(true);
  });
  it('keeps core features, account deletion and support available', () => {
    for (const path of ['/', '/practice', '/ai-analysis', '/ranking', '/profile', '/support', '/delete-account', '/api/delete-account', '/api/analyze-song-v2/start']) expect(isDeferredReleaseRoute(path)).toBe(false);
  });
});
