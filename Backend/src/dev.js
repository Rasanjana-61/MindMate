import dotenv from 'dotenv';
import { spawn } from 'node:child_process';

dotenv.config();

const PORT = Number(process.env.PORT ?? 8080);
const healthUrl = `http://127.0.0.1:${PORT}/api/health`;

async function isMindMateBackendRunning() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(healthUrl, {
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    return response.ok && body?.status === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function runNodemon() {
  const child = spawn(
    'npx',
    ['nodemon', '--legacy-watch', '--watch', 'src', '--ext', 'js,json', 'src/server.js'],
    {
      stdio: 'inherit',
      shell: true,
    }
  );

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

if (await isMindMateBackendRunning()) {
  console.log(`MindMate backend is already running on http://localhost:${PORT}`);
  process.exit(0);
}

runNodemon();
