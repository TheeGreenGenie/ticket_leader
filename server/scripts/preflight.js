/* eslint-disable no-console */
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'RECAPTCHA_SECRET'];
const optionalEnv = ['TICKETMASTER_API_KEY', 'LASTFM_API_KEY', 'GEMINI_API_KEY'];

const requiredDeps = ['express', 'mongoose', 'cors', 'socket.io', 'bcryptjs', 'jsonwebtoken'];

let hasError = false;

console.log('[preflight] Validating runtime requirements...');

for (const name of requiredEnv) {
  if (!process.env[name] || !String(process.env[name]).trim()) {
    console.error(`[preflight] Missing required env var: ${name}`);
    hasError = true;
  }
}

for (const name of optionalEnv) {
  if (!process.env[name] || !String(process.env[name]).trim()) {
    console.warn(`[preflight] Optional env var not set: ${name}`);
  }
}

for (const dep of requiredDeps) {
  try {
    require.resolve(dep);
  } catch (_err) {
    console.error(`[preflight] Missing dependency in node_modules: ${dep}`);
    hasError = true;
  }
}

const major = Number(process.versions.node.split('.')[0]);
if (Number.isNaN(major) || major < 18) {
  console.error(`[preflight] Unsupported Node.js version: ${process.versions.node}. Require >=18.`);
  hasError = true;
}

if (hasError) {
  console.error('[preflight] Failed. Fix issues above before starting server.');
  process.exit(1);
}

console.log('[preflight] OK');
