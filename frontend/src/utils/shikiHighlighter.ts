import { createHighlighterCore } from '@shikijs/core';
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript';
import tsxLang from '@shikijs/langs/tsx';
import darkPlusTheme from '@shikijs/themes/dark-plus';

let highlighterPromise: ReturnType<typeof createHighlighterCore> | null = null;

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      engine: createJavaScriptRegexEngine(),
      langs: [...tsxLang],
      themes: [darkPlusTheme],
    });
  }

  return highlighterPromise;
}

export async function highlightTsxToHtml(code: string): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang: 'tsx',
    theme: 'dark-plus',
  });
}
