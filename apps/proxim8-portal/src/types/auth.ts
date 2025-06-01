/**
 * Represents an authenticated user
 */
export interface AuthUser {
  /**
   * The user's wallet address
   */
  walletAddress: string;

  /**
   * Whether the user has admin privileges
   */
  isAdmin: boolean;
}

/**
 * Authentication response from the server
 */
export interface AuthResponse {
  /**
   * Whether the authentication was successful
   */
  success: boolean;

  /**
   * The user's wallet address
   */
  walletAddress?: string;

  /**
   * Whether the user has admin privileges
   */
  isAdmin?: boolean;

  /**
   * Error message if authentication failed
   */
  error?: string;
}
