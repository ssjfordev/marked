/**
 * OpenAI Embedding Generator
 * 시맨틱 검색을 위한 텍스트 임베딩 생성
 */

// OpenAI text-embedding-3-large: 2000차원, $0.13/1M tokens
// 다국어 (한국어 ↔ 영어) 시맨틱 검색 성능이 우수
const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIMENSION = 2000;

export interface EmbeddingResult {
  success: boolean;
  embedding?: number[];
  error?: string;
  model?: string;
  tokensUsed?: number;
}

/**
 * Generate embedding for text using OpenAI API
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
    };
  }

  // Truncate text if too long (max ~8000 tokens for embedding model)
  const truncatedText = text.slice(0, 30000); // ~7500 tokens rough estimate

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: truncatedText,
        dimensions: EMBEDDING_DIMENSION,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    const embedding = data.data?.[0]?.embedding;

    if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error('Invalid embedding response');
    }

    return {
      success: true,
      embedding,
      model: EMBEDDING_MODEL,
      tokensUsed: data.usage?.total_tokens,
    };
  } catch (error) {
    console.error('[Embedding Error]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate embedding for a link (title + description + URL context + tags)
 *
 * Weight system:
 * - User-provided content (memo, tags): 2x weight (repeated twice)
 * - Auto-extracted content (title, URL): 1x weight
 */
export async function generateLinkEmbedding(link: {
  url: string;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
}): Promise<EmbeddingResult> {
  const parts: string[] = [];

  // Title (1x weight - auto-extracted)
  if (link.title) {
    parts.push(link.title);
  }

  // User memo/description (2x weight - user input is important)
  if (link.description) {
    parts.push(link.description);
    parts.push(link.description); // 2x weight
  }

  // User tags (2x weight - explicit user categorization)
  if (link.tags && link.tags.length > 0) {
    const tagText = link.tags.join(' ');
    parts.push(tagText);
    parts.push(tagText); // 2x weight
  }

  // Extract domain/path info from URL for context (1x weight)
  try {
    const url = new URL(link.url);
    parts.push(url.hostname.replace('www.', ''));
    // Add path segments (e.g., "/docs/react/hooks" -> "docs react hooks")
    const pathParts = url.pathname.split('/').filter(Boolean).join(' ');
    if (pathParts) {
      parts.push(pathParts);
    }
  } catch {
    parts.push(link.url);
  }

  const text = parts.join(' ');

  if (!text.trim()) {
    return {
      success: false,
      error: 'No text content to embed',
    };
  }

  return generateEmbedding(text);
}

/**
 * Generate embeddings for multiple links in batch
 */
export async function generateLinkEmbeddingsBatch(
  links: Array<{
    id: string;
    url: string;
    title?: string | null;
    description?: string | null;
    tags?: string[] | null;
  }>,
  options: {
    onProgress?: (current: number, total: number) => void;
    delayMs?: number;
  } = {}
): Promise<Map<string, EmbeddingResult>> {
  const { onProgress, delayMs = 100 } = options;
  const results = new Map<string, EmbeddingResult>();

  for (let i = 0; i < links.length; i++) {
    const link = links[i]!;

    const result = await generateLinkEmbedding(link);
    results.set(link.id, result);

    if (onProgress) {
      onProgress(i + 1, links.length);
    }

    // Small delay to avoid rate limiting
    if (i < links.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSION };
