export const APPLY_CONFIRM_PHRASE = "i confirm I am not an agent.";

export function isApplyConfirmPhraseValid(value: string): boolean {
  return value === APPLY_CONFIRM_PHRASE;
}
