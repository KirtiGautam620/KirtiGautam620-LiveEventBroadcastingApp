const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js resolves the "ws" package via package.json "exports"
// conditions that Metro's default resolver mishandles, producing
// "Unable to resolve ... stream/ws" errors at bundle time. Disabling
// package-exports resolution falls back to Metro's classic "main" field
// resolution, which is what supabase-js's React Native usage expects.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
