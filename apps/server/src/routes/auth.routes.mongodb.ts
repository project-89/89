import { Router } from 'express';
import { z } from 'zod';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import jwt from 'jsonwebtoken';
import { getDb } from '../utils/mongodb';
import { ObjectId } from 'mongodb';
import { publicEndpoint, authenticatedEndpoint } from '../middleware/chains.middleware';

const router = Router();

// Auth schemas - direct body validation
const loginBodySchema = z.object({
  walletAddress: z.string().min(32).max(44),
  signature: z.string(),
  message: z.string(),
});

const refreshBodySchema = z.object({
  refreshToken: z.string().optional(),
});

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

// Helper to verify Solana signature
async function verifySolanaSignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(walletAddress);

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Login endpoint - verify signature and issue JWT
router.post('/login', async (req, res) => {
  try {
    console.log('[Auth] Login request received');
    console.log('[Auth] Headers:', req.headers);
    console.log('[Auth] Body:', req.body);
    console.log('[Auth] Content-Type:', req.headers['content-type']);
    console.log('[Auth] Raw body type:', typeof req.body);
    
    // Validate request body manually
    const validationResult = loginBodySchema.safeParse(req.body);
    if (!validationResult.success) {
      console.log('[Auth] Validation failed:', validationResult.error.errors);
      return res.status(400).json({
        error: 'Invalid request body',
        success: false,
        details: validationResult.error.errors,
      });
    }
    
    const { walletAddress, signature, message } = validationResult.data;

    // Validate required fields
    if (!walletAddress || !signature || !message) {
      console.log('[Auth] Missing required fields:', { 
        walletAddress: !!walletAddress, 
        signature: !!signature, 
        message: !!message 
      });
      return res.status(400).json({
        error: 'Missing required fields',
        success: false,
        details: {
          walletAddress: !walletAddress ? 'Required' : undefined,
          signature: !signature ? 'Required' : undefined,
          message: !message ? 'Required' : undefined,
        }
      });
    }

    console.log(`[Auth] Login attempt for wallet: ${walletAddress?.slice(0, 8)}...`);

    // Verify signature
    const isValid = await verifySolanaSignature(walletAddress, signature, message);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid signature',
        success: false,
      });
    }

    // Get MongoDB database
    const db = await getDb();
    
    // Find or create account using MongoDB directly
    let account = await db.collection('accounts').findOne({ walletAddress });

    if (!account) {
      console.log(`[Auth] Creating new account for wallet: ${walletAddress}`);
      
      const newAccount = {
        _id: new ObjectId(),
        walletAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.collection('accounts').insertOne(newAccount);
      account = newAccount;
    }

    // Check for proxim8User
    const proxim8User = await db.collection('proxim8_users').findOne({ 
      accountId: account._id 
    });

    // Generate tokens
    const token = jwt.sign(
      {
        id: account._id.toString(),
        walletAddress: account.walletAddress,
        isAdmin: proxim8User?.isAdmin || false,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      {
        id: account._id.toString(),
        type: 'refresh',
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    console.log(`[Auth] Login successful for wallet: ${walletAddress.slice(0, 8)}...`);

    return res.json({
      token,
      refreshToken,
      walletAddress: account.walletAddress,
      isAdmin: proxim8User?.isAdmin || false,
      accountId: account._id.toString(),
      success: true,
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      success: false,
    });
  }
});

// Logout endpoint - invalidate session
router.post('/logout', authenticatedEndpoint(), async (req, res) => {
  try {
    // In a production system, you would:
    // 1. Add the token to a blacklist
    // 2. Clear any server-side sessions
    // 3. Invalidate refresh tokens

    // For now, we'll just return success and let the client clear its state
    console.log(`[Auth] Logout for account: ${req.auth?.account?.id}`);

    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return res.status(500).json({
      error: 'Logout failed',
      success: false,
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const refreshToken = req.body.refreshToken || authHeader?.split(' ')[1];

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        success: false,
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        error: 'Invalid token type',
        success: false,
      });
    }

    // Get MongoDB database
    const db = await getDb();
    
    // Get account
    const account = await db.collection('accounts').findOne({ 
      _id: new ObjectId(decoded.id) 
    });

    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        success: false,
      });
    }

    // Get proxim8User separately
    const proxim8User = await db.collection('proxim8_users').findOne({ 
      accountId: account._id 
    });

    // Generate new tokens
    const token = jwt.sign(
      {
        id: account._id.toString(),
        walletAddress: account.walletAddress,
        isAdmin: proxim8User?.isAdmin || false,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const newRefreshToken = jwt.sign(
      {
        id: account._id.toString(),
        type: 'refresh',
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    return res.json({
      token,
      refreshToken: newRefreshToken,
      success: true,
    });
  } catch (error) {
    console.error('[Auth] Refresh error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        success: false,
      });
    }

    return res.status(500).json({
      error: 'Token refresh failed',
      success: false,
    });
  }
});

// Status endpoint - check authentication status
router.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({
        authenticated: false,
        success: true,
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Get MongoDB database
    const db = await getDb();
    
    // Get account
    const account = await db.collection('accounts').findOne({ 
      _id: new ObjectId(decoded.id) 
    });

    if (!account) {
      return res.json({
        authenticated: false,
        success: true,
      });
    }

    // Get proxim8User separately
    const proxim8User = await db.collection('proxim8_users').findOne({ 
      accountId: account._id 
    });

    return res.json({
      authenticated: true,
      walletAddress: account.walletAddress,
      isAdmin: proxim8User?.isAdmin || false,
      accountId: account._id.toString(),
      success: true,
    });
  } catch (error) {
    console.error('[Auth] Status check error:', error);
    
    return res.json({
      authenticated: false,
      success: true,
    });
  }
});

// Verify endpoint - verify a token without refreshing
router.post('/verify', publicEndpoint(), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        valid: false,
        error: 'No token provided',
        success: false,
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    return res.json({
      valid: true,
      walletAddress: decoded.walletAddress,
      isAdmin: decoded.isAdmin,
      success: true,
    });
  } catch (error) {
    console.error('[Auth] Verify error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        valid: false,
        error: 'Invalid token',
        success: false,
      });
    }

    return res.status(500).json({
      valid: false,
      error: 'Verification failed',
      success: false,
    });
  }
});

// Validate endpoint - used by client middleware to validate tokens
router.get('/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        authenticated: false,
        error: 'No token provided',
        success: false,
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Get MongoDB database
    const db = await getDb();
    
    // Get account details
    const account = await db.collection('accounts').findOne({ 
      _id: new ObjectId(decoded.id) 
    });

    if (!account) {
      return res.status(401).json({
        authenticated: false,
        error: 'Account not found',
        success: false,
      });
    }

    // Get proxim8User separately
    const proxim8User = await db.collection('proxim8_users').findOne({ 
      accountId: account._id 
    });

    // Return user data in format expected by client
    return res.json({
      user: {
        id: account._id.toString(),
        walletAddress: account.walletAddress,
        isAdmin: proxim8User?.isAdmin || false,
      },
      walletAddress: account.walletAddress,
      isAdmin: proxim8User?.isAdmin || false,
      success: true,
    });
  } catch (error) {
    console.error('[Auth] Validate error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        authenticated: false,
        error: 'Invalid token',
        success: false,
      });
    }

    return res.status(500).json({
      authenticated: false,
      error: 'Validation failed',
      success: false,
    });
  }
});

export default router;