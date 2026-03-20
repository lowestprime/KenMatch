import type { AttestationStatus, ParticipationState, SybilRiskBand } from "@/lib/types";

export interface ParticipationPolicy {
  state: ParticipationState;
  note: string;
  voiceMultiplier: number;
  effectiveVoiceCredits: number;
  canSubmit: boolean;
  canComment: boolean;
  canPulse: boolean;
  canAllocateVoice: boolean;
}

export function resolveParticipationPolicy(
  status: AttestationStatus,
  sybilRisk: SybilRiskBand,
  voiceCredits: number,
): ParticipationPolicy {
  if (status === "limited" || sybilRisk === "high") {
    return {
      state: "read-only",
      note: "Reading remains open, but public actions stay paused until identity review is completed.",
      voiceMultiplier: 0,
      effectiveVoiceCredits: 0,
      canSubmit: false,
      canComment: false,
      canPulse: false,
      canAllocateVoice: false,
    };
  }

  if (status === "review") {
    const voiceMultiplier = sybilRisk === "low" ? 0.7 : 0.6;
    return {
      state: "review-limited",
      note: "Public participation is available while review is pending, with a temporary voice cap until stronger identity signals are confirmed.",
      voiceMultiplier,
      effectiveVoiceCredits: Math.max(Math.floor(voiceCredits * voiceMultiplier), 1),
      canSubmit: true,
      canComment: true,
      canPulse: true,
      canAllocateVoice: true,
    };
  }

  if (sybilRisk === "medium") {
    const voiceMultiplier = 0.8;
    return {
      state: "review-limited",
      note: "This account is verified, but medium-risk identity signals keep the voice cap slightly reduced until additional review lands.",
      voiceMultiplier,
      effectiveVoiceCredits: Math.max(Math.floor(voiceCredits * voiceMultiplier), 1),
      canSubmit: true,
      canComment: true,
      canPulse: true,
      canAllocateVoice: true,
    };
  }

  return {
    state: "full",
    note: "Identity review is strong enough for full public participation and full voice capacity.",
    voiceMultiplier: 1,
    effectiveVoiceCredits: voiceCredits,
    canSubmit: true,
    canComment: true,
    canPulse: true,
    canAllocateVoice: true,
  };
}
