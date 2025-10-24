/**
 * Finite State Machine (FSM) for /start onboarding flow
 */

export type UserState = 'NEW' | 'WELCOME_VIDEO_SENT' | 'TTS_SENT' | 'DONE';

/**
 * State transition logic
 * @param current - Current user state
 * @returns Next state in the flow
 */
export function nextState(current?: UserState): UserState {
  switch (current ?? 'NEW') {
    case 'NEW':
      return 'WELCOME_VIDEO_SENT';
    case 'WELCOME_VIDEO_SENT':
      return 'TTS_SENT';
    case 'TTS_SENT':
      return 'DONE';
    case 'DONE':
    default:
      return 'DONE';
  }
}

/**
 * Check if a state transition is allowed
 * @param from - Current state
 * @param to - Target state
 * @returns true if transition is valid
 */
export function isValidTransition(from: UserState | undefined, to: UserState): boolean {
  const expected = nextState(from);
  return to === expected || to === 'NEW'; // Allow reset to NEW via /restart
}

/**
 * Get a human-readable description of the state
 */
export function getStateDescription(state?: UserState): string {
  switch (state ?? 'NEW') {
    case 'NEW':
      return 'New user - not started onboarding';
    case 'WELCOME_VIDEO_SENT':
      return 'Welcome video sent - awaiting TTS';
    case 'TTS_SENT':
      return 'TTS greeting sent - onboarding complete';
    case 'DONE':
      return 'Onboarding complete';
    default:
      return 'Unknown state';
  }
}

/**
 * Create state progress entry with timestamp
 */
export function createProgressEntry(state: UserState): string {
  return `${state}@${new Date().toISOString()}`;
}
