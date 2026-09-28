import React, { createContext, useContext, ReactNode } from "react";
import music from "~/configs/music";
import { useAudio, type HTMLAudioState, type HTMLAudioControls } from "~/hooks/useAudio";

interface AudioContextType {
  audio: HTMLAudioElement;
  audioState: HTMLAudioState;
  controls: HTMLAudioControls;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [audio, audioState, controls, audioRef] = useAudio({
    src: music.audio.startsWith("/") ? music.audio : `/${music.audio}`,
    autoReplay: true,
  });

  return (
    <AudioContext.Provider value={{ audio, audioState, controls, audioRef }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudioContext = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudioContext must be used within an AudioProvider");
  }
  return context;
};
