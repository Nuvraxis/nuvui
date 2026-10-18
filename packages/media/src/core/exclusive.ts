// The media elements of each group. Starting one pauses the others in it.
const groups = new Map<string, Set<HTMLMediaElement>>();

export function joinGroup(name: string, media: HTMLMediaElement): () => void {
  const members = groups.get(name) ?? new Set<HTMLMediaElement>();
  groups.set(name, members);
  members.add(media);
  const onPlay = () => {
    for (const other of members) {
      if (other !== media && !other.paused) other.pause();
    }
  };
  media.addEventListener("play", onPlay);
  return () => {
    media.removeEventListener("play", onPlay);
    members.delete(media);
    if (members.size === 0) groups.delete(name);
  };
}
