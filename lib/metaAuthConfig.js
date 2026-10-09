// Shared constants for the real Meta OAuth flow (app/api/auth/meta/*).
// As of writing (Oct 2026) Meta's current versions are v25.0 (stable,
// supported until Jul 2028) and v26.0 (launched Jul 2026). Using v25.0 as
// the default since it's had more time to shake out launch-week issues.
// Bump META_GRAPH_API_VERSION via env var once v25.0 nears its own sunset —
// check developers.facebook.com/docs/graph-api/changelog/versions for the
// current status instead of assuming this one is still valid.
export const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0';

// ads_read: list ad accounts + read spend/insights.
// business_management: needed to see ad accounts owned by a Business Manager
// rather than just ones directly on the personal profile.
export const META_OAUTH_SCOPES = 'ads_read,business_management';

export const META_STATE_COOKIE = 'meta_oauth_state';
export const META_TOKEN_COOKIE = 'meta_access_token';

export const isProd = process.env.NODE_ENV === 'production';
