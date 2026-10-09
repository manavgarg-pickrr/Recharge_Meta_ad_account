// Shared constants for the real Meta OAuth flow (app/api/auth/meta/*).
// Bump META_GRAPH_API_VERSION via env var when Meta deprecates the default
// below — check developers.facebook.com/docs/graph-api/changelog for the
// current version instead of assuming this one is still valid.
export const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v21.0';

// ads_read: list ad accounts + read spend/insights.
// business_management: needed to see ad accounts owned by a Business Manager
// rather than just ones directly on the personal profile.
export const META_OAUTH_SCOPES = 'ads_read,business_management';

export const META_STATE_COOKIE = 'meta_oauth_state';
export const META_TOKEN_COOKIE = 'meta_access_token';

export const isProd = process.env.NODE_ENV === 'production';
