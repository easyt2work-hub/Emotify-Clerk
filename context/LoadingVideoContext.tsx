import React, { createContext, useContext, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

interface LoadingVideoContextType {
  showLoadingVideo: <T>(promise?: Promise<T>, minDurationMs?: number) => Promise<T | void>;
  triggerLoadingVideo: (durationMs?: number) => Promise<void>;
  setIsPageLoading: (isLoading: boolean) => void;
  isLoadingVideoActive: boolean;
}

const LoadingVideoContext = createContext<LoadingVideoContextType | undefined>(undefined);

export function LoadingVideoProvider({ children }: { children: React.ReactNode }) {
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isTransitionLoading, setIsTransitionLoading] = useState(false);

  const player = useVideoPlayer(require("@/assets/loading-video.mp4"), (playerInstance) => {
    playerInstance.loop = true;
    playerInstance.muted = true;
  });

  const isActive = isManualLoading || isPageLoading || isTransitionLoading;

  const showLoadingVideo = async <T,>(promise?: Promise<T>, minDurationMs = 3500): Promise<T | void> => {
    setIsManualLoading(true);
    player.currentTime = 0;
    player.play();

    const delayPromise = new Promise<void>((resolve) => setTimeout(resolve, minDurationMs));

    try {
      if (promise) {
        const [result] = await Promise.all([promise, delayPromise]);
        return result;
      } else {
        await delayPromise;
      }
    } finally {
      setIsManualLoading(false);
    }
  };

  const triggerLoadingVideo = async (durationMs = 3500) => {
    setIsTransitionLoading(true);
    player.currentTime = 0;
    player.play();
    
    await new Promise<void>((resolve) => setTimeout(resolve, durationMs));
    setIsTransitionLoading(false);
  };

  // Control playback based on active status
  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <LoadingVideoContext.Provider
      value={{
        showLoadingVideo,
        triggerLoadingVideo,
        setIsPageLoading,
        isLoadingVideoActive: isActive,
      }}
    >
      {children}
      {isActive && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            allowsFullscreen={false}
            nativeControls={false}
          />
        </View>
      )}
    </LoadingVideoContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "#F8F8F8",
    zIndex: 99999,
  },
});

export function useLoadingVideo() {
  const context = useContext(LoadingVideoContext);
  if (!context) {
    throw new Error("useLoadingVideo must be used within a LoadingVideoProvider");
  }
  return context;
}

export function usePageLoading(isLoading: boolean) {
  const { setIsPageLoading } = useLoadingVideo();

  useEffect(() => {
    setIsPageLoading(isLoading);
    return () => {
      setIsPageLoading(false);
    };
  }, [isLoading, setIsPageLoading]);
}
