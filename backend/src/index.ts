import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { join } from 'path';

const app = new Hono();

// 📂 Move up out of backend/src/ and backend/ into the root blockPrint/ folder
const ROOT_STORAGE_PATH = join(import.meta.dir, '../../notebooks_backup.json');

// 🛡️ Enable CORS so your Vite frontend (5173) can talk to this server seamlessly
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  }),
);

console.log(`🚀 Starting blockPrint Hono server...`);

// 📖 GET Endpoint: Read and return the saved notebooks
app.get('/api/load', async (c) => {
  try {
    const file = Bun.file(ROOT_STORAGE_PATH);

    // If the backup file doesn't exist yet, return an empty slate safely
    if (!(await file.exists())) {
      return c.json({ notebooks: [] }, 200);
    }

    // Bun.file makes reading text or JSON incredibly fast
    const fileContent = await file.text();
    const data = JSON.parse(fileContent);

    return c.json(data, 200);
  } catch (error) {
    return c.json(
      { success: false, error: 'Failed to read data from disk' },
      500,
    );
  }
});

// 💾 POST Endpoint: Catch and save notebook JSON payload
app.post('/api/save', async (c) => {
  try {
    // In Hono, 'c' is the Context object. c.req.json() parses the incoming body!
    const body = await c.req.json();

    // 📝 Bun's lightning-fast native file writer
    await Bun.write(ROOT_STORAGE_PATH, JSON.stringify(body, null, 2));

    return c.json(
      { success: true, message: 'Notebook saved to root successfully!' },
      200,
    );
  } catch (error) {
    return c.json(
      { success: false, error: 'Failed to write payload to disk' },
      500,
    );
  }
});

export default {
  port: 3001, // Run on 3001 so it stays clear of Vite
  fetch: app.fetch, // Hand over the web standard requests to Hono
};
