import { useCallback } from 'react';
import { POSTER_KEY } from '../types';
import type { Poster } from '../types';
import { putFile, deleteFile } from '../lib/fileStore';
import { parsePosters } from '../lib/records';
import { usePersistentState } from './usePersistentState';

export function usePosters() {
  const [posters, setPosters] = usePersistentState(POSTER_KEY, parsePosters);

  const addPoster = useCallback(async (file: File): Promise<void> => {
    const id = crypto.randomUUID();
    const imageKey = `image_${id}`;
    await putFile(imageKey, file);
    const poster: Poster = { id, imageKey, name: file.name, addedAt: new Date().toISOString() };
    setPosters(prev => [...prev, poster]);
  }, [setPosters]);

  const deletePoster = useCallback((id: string) => {
    const target = posters.find(poster => poster.id === id);
    if (target) deleteFile(target.imageKey).catch(console.error);
    setPosters(prev => prev.filter(poster => poster.id !== id));
  }, [posters, setPosters]);

  return { posters, addPoster, deletePoster };
}
