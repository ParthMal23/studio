
'use server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface TmdbSearchResult {
  id: number;
  poster_path?: string | null;
  media_type?: 'movie' | 'tv';
  // For movie results directly
  title?: string;
  // For TV results directly
  name?: string;
}

interface TmdbSearchResponse {
  results: TmdbSearchResult[];
}

interface ContentDetails {
  posterUrl?: string;
  watchUrl?: string;
}

async function fetchFromTmdb<T>(endpoint: string, queryParams: Record<string, string> = {}): Promise<T | null> {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY_HERE') {
    console.warn('TMDB_API_KEY is not configured. Skipping TMDB fetch.');
    return null;
  }

  const queryString = new URLSearchParams({
    api_key: TMDB_API_KEY,
    ...queryParams,
  }).toString();

  try {
    const response = await fetch(`${TMDB_BASE_URL}/${endpoint}?${queryString}`);
    if (!response.ok) {
      console.error(`TMDB API error for ${endpoint}: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error('TMDB Error Body:', errorBody);
      return null;
    }
    return await response.json() as T;
  } catch (error) {
    console.error(`Error fetching from TMDB ${endpoint}:`, error);
    return null;
  }
}

export async function fetchContentDetailsFromTmdb(
  title: string,
  contentType: 'MOVIES' | 'TV_SERIES' | 'BOTH'
): Promise<ContentDetails> {
  let searchPath: 'search/movie' | 'search/tv' | 'search/multi' = 'search/multi';
  let effectiveMediaType: 'movie' | 'tv' | undefined;

  if (contentType === 'MOVIES') {
    searchPath = 'search/movie';
    effectiveMediaType = 'movie';
  } else if (contentType === 'TV_SERIES') {
    searchPath = 'search/tv';
    effectiveMediaType = 'tv';
  }

  const data = await fetchFromTmdb<TmdbSearchResponse>(searchPath, { query: title });

  const details: ContentDetails = {};

  if (data && data.results && data.results.length > 0) {
    const result = data.results[0];

    if (result.poster_path) {
      details.posterUrl = `${TMDB_IMAGE_BASE_URL}${result.poster_path}`;
    }

    const mediaTypeForResult = result.media_type || effectiveMediaType;
    if (result.id && mediaTypeForResult) {
      details.watchUrl = `https://www.themoviedb.org/${mediaTypeForResult}/${result.id}/watch?locale=US`;
    }
  }
  return details;
}
