/**
 * Embedding Cache
 * 쿼리 임베딩을 캐싱하여 OpenAI API 호출 비용과 시간 절약
 *
 * 현재: Supabase 테이블 기반
 * 나중에: Redis로 쉽게 교체 가능 (EmbeddingCache 인터페이스 구현만 변경)
 */

import { createServiceClient } from '@/lib/supabase/server';

// 캐시 인터페이스 - Redis 전환 시 이 인터페이스만 구현하면 됨
export interface EmbeddingCache {
  get(query: string): Promise<number[] | null>;
  set(query: string, embedding: number[]): Promise<void>;
}

/** 쿼리 정규화 (대소문자 통일, 공백 제거) */
function normalizeQuery(query: string): string {
  return query.toLowerCase().trim();
}

// Supabase 기반 캐시 구현
class SupabaseEmbeddingCache implements EmbeddingCache {
  async get(query: string): Promise<number[] | null> {
    try {
      const normalizedQuery = normalizeQuery(query);
      const supabase = createServiceClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('query_embeddings_cache')
        .select('embedding, hit_count')
        .eq('query', normalizedQuery)
        .single();

      if (error || !data?.embedding) {
        return null;
      }

      // hit_count 증가 (비동기, 에러 무시)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void (supabase as any)
        .from('query_embeddings_cache')
        .update({
          hit_count: (data.hit_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('query', normalizedQuery);

      return data.embedding;
    } catch {
      return null;
    }
  }

  async set(query: string, embedding: number[]): Promise<void> {
    try {
      const supabase = createServiceClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('query_embeddings_cache').upsert(
        {
          query: normalizeQuery(query),
          embedding,
          hit_count: 1,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'query',
        }
      );
    } catch (error) {
      // 캐시 저장 실패는 무시 (검색은 계속 진행)
      console.error('[EmbeddingCache] Failed to save:', error);
    }
  }
}

// 싱글톤 인스턴스
export const embeddingCache: EmbeddingCache = new SupabaseEmbeddingCache();
