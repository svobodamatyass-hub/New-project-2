import { useEffect } from 'react';
import { Platform } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import { useGame } from '../game/GameProvider';

const blackjackDealSound = require('../../assets/sounds/blackjack-deal.wav');
const blackjackHitSound = require('../../assets/sounds/blackjack-hit.wav');
const blackjackWinSound = require('../../assets/sounds/blackjack-win.wav');
const blackjackLoseSound = require('../../assets/sounds/blackjack-lose.wav');
const rouletteStopSound = require('../../assets/sounds/roulette-stop.wav');

function safeReplay(player: ReturnType<typeof useAudioPlayer>) {
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // Audio should never block gameplay.
  }
}

export function useCasinoFeedback() {
  const { state } = useGame();
  const isMuted = state.settings.feedback.masterMute;
  const hapticsIntensity = isMuted ? 0 : state.settings.feedback.hapticsIntensity;
  const blackjackVolume = isMuted ? 0 : state.settings.feedback.blackjackVolume;
  const rouletteVolume = isMuted ? 0 : state.settings.feedback.rouletteVolume;
  const dealPlayer = useAudioPlayer(blackjackDealSound);
  const hitPlayer = useAudioPlayer(blackjackHitSound);
  const winPlayer = useAudioPlayer(blackjackWinSound);
  const losePlayer = useAudioPlayer(blackjackLoseSound);
  const roulettePlayer = useAudioPlayer(rouletteStopSound);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    dealPlayer.volume = blackjackVolume;
    hitPlayer.volume = blackjackVolume;
    winPlayer.volume = blackjackVolume;
    losePlayer.volume = blackjackVolume;
    roulettePlayer.volume = rouletteVolume;
  }, [blackjackVolume, dealPlayer, hitPlayer, losePlayer, roulettePlayer, rouletteVolume, winPlayer]);

  function getImpactStyle() {
    if (hapticsIntensity < 0.34) {
      return Haptics.ImpactFeedbackStyle.Light;
    }

    if (hapticsIntensity < 0.67) {
      return Haptics.ImpactFeedbackStyle.Medium;
    }

    return Haptics.ImpactFeedbackStyle.Heavy;
  }

  async function runHaptic(task: () => Promise<void>) {
    if (Platform.OS === 'web' || hapticsIntensity <= 0) {
      return;
    }

    try {
      await task();
    } catch {
      // Haptics should never block gameplay.
    }
  }

  return {
    blackjackDeal() {
      if (blackjackVolume > 0) {
        safeReplay(dealPlayer);
      }

      void runHaptic(() => Haptics.impactAsync(getImpactStyle()));
    },
    blackjackHit() {
      if (blackjackVolume > 0) {
        safeReplay(hitPlayer);
      }

      void runHaptic(() => Haptics.impactAsync(getImpactStyle()));
    },
    blackjackResult(outcome: 'win' | 'loss' | 'push' | 'blackjack') {
      if (blackjackVolume > 0) {
        if (outcome === 'win' || outcome === 'blackjack') {
          safeReplay(winPlayer);
        } else if (outcome === 'loss') {
          safeReplay(losePlayer);
        }
      }

      if (outcome === 'win' || outcome === 'blackjack') {
        void runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
        return;
      }

      if (outcome === 'loss') {
        void runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
        return;
      }

      void runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft));
    },
    rouletteSpinStart() {
      void runHaptic(() => Haptics.impactAsync(getImpactStyle()));
    },
    rouletteResult(won: boolean) {
      if (rouletteVolume > 0) {
        safeReplay(roulettePlayer);
      }

      void runHaptic(() =>
        Haptics.notificationAsync(won ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning),
      );
    },
  };
}
