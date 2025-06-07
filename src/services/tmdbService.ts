
'use server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; // w500 is a common poster size

interface TmdbSearchResult {
  id: number;
  poster_path?: string | null;
  media_type?: 'movie' | 'tv'; // From 'multi' search
  // Add other fields if needed in the future
}

interface TmdbSearchResponse {
  results: TmdbSearchResult[];
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

export async function fetchPosterUrl(
  title: string,
  contentType: 'MOVIES' | 'TV_SERIES' | 'BOTH'
): Promise<string | undefined> {
  let searchType: 'movie' | 'tv' | 'multi' = 'multi';
  if (contentType === 'MOVIES') {
    searchType = 'movie';
  } else if (contentType === 'TV_SERIES') {
    searchType = 'tv';
  }

  const data = await fetchFromTmdb<TmdbSearchResponse>(`search/${searchType}`, { query: title });

  if (data && data.results && data.results.length > 0) {
    // For 'multi' search, prefer the item that matches the broader type or just take the first good one.
    // For specific 'movie' or 'tv' search, the first result is usually best.
    const result = data.results[0];
    if (result.poster_path) {
      return `${TMDB_IMAGE_BASE_URL}${result.poster_path}`;
    }
  }
  return undefined;
}
