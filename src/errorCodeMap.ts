/**
 * Map backend error messages to human-readable descriptions.
 * When the API returns a known message key, replace it with the mapped copy.
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  TOAST_SERVER_BUSY:
    'Sever busy：May be due to connection error, API error, etc. Please contact the dev',
};

/**
 * Get the display copy for a backend message.
 * Return the original message when no mapping is found.
 */
export function getErrorMessage(rawMessage: string): string {
  return ERROR_MESSAGE_MAP[rawMessage] || rawMessage;
}
