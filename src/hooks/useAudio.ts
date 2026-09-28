import { useState, useRef, useEffect } from "react";
import music from "~/configs/music";

export interface SongInfo {
  title: string;
  artist: string;
  cover: string;
  src: string;
  duration?: number;
  youtubeId?: string;
}

export interface ExternalPlayer {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek?: (time: number) => void;
}

export interface HTMLAudioState {
  volume: number;
  playing: boolean;
  time: number;
  duration: number;
  progress: number; // 0 to 100
  song: SongInfo;
}

export interface HTMLAudioControls {
  play: () => Promise<void> | void;
  pause: () => Promise<void> | void;
  toggle: (play?: boolean) => Promise<void> | void;
  seek: (timeInSeconds: number) => void;
  seekPercent: (percent: number) => void;
  volume: (value: number) => void;
  setSong: (song: Partial<SongInfo> & { title: string }, autoPlay?: boolean) => void;
  setPlaying: (playing: boolean) => void;
  registerExternalPlayer: (player: ExternalPlayer | null) => void;
}

export interface HTMLAudioProps {
  src: string;
  autoReplay?: boolean;
}

export function useAudio(props: HTMLAudioProps) {
  const initialSong: SongInfo = {
    title: music.title,
    artist: music.artist,
    cover: music.cover,
    src: music.audio.startsWith("/") ? music.audio : `/${music.audio}`,
  };

  const elementRef = useRef<HTMLAudioElement | null>(null);
  if (!elementRef.current && typeof window !== "undefined") {
    elementRef.current = new Audio(initialSong.src);
  }

  const externalPlayerRef = useRef<ExternalPlayer | null>(null);

  const [state, setState] = useState<HTMLAudioState>({
    volume: 1,
    playing: false,
    time: 0,
    duration: 0,
    progress: 0,
    song: initialSong,
  });

  const controls: HTMLAudioControls = {
    play: (): Promise<void> | void => {
      if (externalPlayerRef.current) {
        externalPlayerRef.current.play();
        setState((prev) => ({ ...prev, playing: true }));
        return;
      }
      const el = elementRef.current;
      if (el) {
        return el.play().then(() => {
          setState((prev) => ({ ...prev, playing: true }));
        }).catch((err) => {
          console.warn("Audio play prevented:", err);
        });
      }
    },

    pause: (): Promise<void> | void => {
      if (externalPlayerRef.current) {
        externalPlayerRef.current.pause();
        setState((prev) => ({ ...prev, playing: false }));
        return;
      }
      const el = elementRef.current;
      if (el) {
        el.pause();
        setState((prev) => ({ ...prev, playing: false }));
      }
    },

    toggle: (play?: boolean): Promise<void> | void => {
      if (externalPlayerRef.current) {
        const shouldPlay = play !== undefined ? play : !state.playing;
        if (shouldPlay) {
          externalPlayerRef.current.play();
        } else {
          externalPlayerRef.current.pause();
        }
        setState((prev) => ({ ...prev, playing: shouldPlay }));
        return;
      }
      const el = elementRef.current;
      if (el) {
        const shouldPlay = play !== undefined ? play : el.paused;
        if (shouldPlay) {
          return controls.play();
        } else {
          return controls.pause();
        }
      }
    },

    seek: (timeInSeconds: number): void => {
      if (externalPlayerRef.current?.seek) {
        externalPlayerRef.current.seek(timeInSeconds);
      }
      const el = elementRef.current;
      if (el) {
        const target = Math.max(0, Math.min(timeInSeconds, el.duration || 9999));
        el.currentTime = target;
        const dur = el.duration || state.duration || 1;
        setState((prev) => ({
          ...prev,
          time: target,
          progress: (target / dur) * 100,
        }));
      }
    },

    seekPercent: (percent: number): void => {
      const el = elementRef.current;
      if (el) {
        const dur = el.duration || state.duration || 0;
        if (dur > 0) {
          const target = (percent / 100) * dur;
          el.currentTime = target;
          setState((prev) => ({
            ...prev,
            time: target,
            progress: percent,
          }));
        }
      }
    },

    volume: (value: number): void => {
      const el = elementRef.current;
      if (el) {
        const val = Math.min(1, Math.max(0, value));
        el.volume = val;
        setState((prev) => ({ ...prev, volume: val }));
      }
    },

    setPlaying: (playing: boolean): void => {
      setState((prev) => ({ ...prev, playing }));
    },

    registerExternalPlayer: (player: ExternalPlayer | null): void => {
      externalPlayerRef.current = player;
    },

    setSong: (newSong: Partial<SongInfo> & { title: string }, autoPlay = true): void => {
      const el = elementRef.current;
      const resolvedSong: SongInfo = {
        title: newSong.title,
        artist: newSong.artist || "Unknown Artist",
        cover: newSong.cover || "/music/thumbnail.png",
        src: newSong.src || (el ? el.src : "/music/faded.mp3"),
        duration: newSong.duration,
        youtubeId: newSong.youtubeId,
      };

      setState((prev) => ({
        ...prev,
        song: resolvedSong,
        time: 0,
        progress: 0,
        duration: resolvedSong.duration || (el ? el.duration : prev.duration),
        playing: autoPlay ? true : prev.playing,
      }));

      if (el && newSong.src) {
        const needsReload = resolvedSong.src && el.src !== resolvedSong.src;
        if (needsReload) {
          el.pause();
          el.src = resolvedSong.src;
          el.load();
        }
        if (autoPlay) {
          el.play().then(() => {
            setState((prev) => ({ ...prev, playing: true }));
          }).catch((err) => {
            console.warn("Auto-play prevented:", err);
          });
        }
      }
    },
  };

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      const cur = el.currentTime || 0;
      const dur = el.duration || state.duration || 0;
      setState((prev) => ({
        ...prev,
        time: cur,
        duration: dur || prev.duration,
        progress: dur > 0 ? (cur / dur) * 100 : 0,
      }));
    };

    const onPlay = () => setState((prev) => ({ ...prev, playing: true }));
    const onPause = () => setState((prev) => ({ ...prev, playing: false }));
    const onEnded = () => {
      setState((prev) => ({ ...prev, playing: false, time: 0, progress: 0 }));
      if (props.autoReplay) {
        controls.play();
      }
    };
    const onLoadedMetadata = () => {
      if (el.duration && !isNaN(el.duration)) {
        setState((prev) => ({ ...prev, duration: el.duration }));
      }
    };

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [props.autoReplay, state.duration]);

  return [elementRef.current as HTMLAudioElement, state, controls, elementRef] as const;
}
