/**
 * Tests for Next.js Training API Relay Endpoints
 * 
 * These tests verify that the Next.js API routes properly relay requests
 * to the Express server and handle authentication correctly.
 */

import { createMocks } from 'node-mocks-http';
import { GET as getMissions } from '../missions/route';
import { GET as getMissionDetails } from '../missions/[missionId]/route';
import { POST as deployMission } from '../missions/[missionId]/deploy/route';
import { GET as getDeploymentStatus } from '../deployments/[deploymentId]/status/route';

// Mock the API_BASE_URL config
jest.mock('@/config', () => ({
  API_BASE_URL: 'http://localhost:4000/api'
}));

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Training API Relay Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_KEY = 'test-api-key';
  });

  describe('GET /api/training/missions', () => {
    it('should relay request to Express server with auth token', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            missions: [],
            agent: { codename: 'TestAgent' }
          }
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          cookie: 'authToken=test-jwt-token'
        }
      });

      // Add cookies mock
      req.cookies = {
        get: jest.fn().mockReturnValue({ value: 'test-jwt-token' })
      };

      const response = await getMissions(req as any);
      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/training/missions',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-jwt-token',
            'X-API-Key': 'test-api-key'
          })
        })
      );

      expect(result.success).toBe(true);
    });

    it('should return 401 when no auth token provided', async () => {
      const { req } = createMocks({
        method: 'GET'
      });

      req.cookies = {
        get: jest.fn().mockReturnValue(undefined)
      };

      const response = await getMissions(req as any);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
    });

    it('should handle Express server errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({
          message: 'Internal server error'
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const { req } = createMocks({
        method: 'GET'
      });

      req.cookies = {
        get: jest.fn().mockReturnValue({ value: 'test-jwt-token' })
      };

      const response = await getMissions(req as any);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { req } = createMocks({
        method: 'GET'
      });

      req.cookies = {
        get: jest.fn().mockReturnValue({ value: 'test-jwt-token' })
      };

      const response = await getMissions(req as any);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch training missions');
    });
  });

  describe('GET /api/training/missions/[missionId]', () => {
    it('should relay mission details request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            mission: { id: 'training_001' },
            agent: { availableProxim8s: [] }
          }
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const { req } = createMocks({
        method: 'GET'
      });

      req.cookies = {
        get: jest.fn().mockReturnValue({ value: 'test-jwt-token' })
      };

      const response = await getMissionDetails(req as any, {
        params: { missionId: 'training_001' }
      });
      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/training/missions/training_001',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-jwt-token'
          })
        })
      );

      expect(result.success).toBe(true);
    });

    it('should return 400 for missing mission ID', async () => {
      const { req } = createMocks({
        method: 'GET'
      });

      req.cookies = {
        get: jest.fn().mockReturnValue({ value: 'test-jwt-token' })
      };

      const response = await getMissionDetails(req as any, {
        params: { missionId: '' }
      });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Mission ID is required');
    });
  });

  describe('POST /api/training/missions/[missionId]/deploy', () => {
    it('should relay deployment request with validation', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            deployment: { deploymentId: 'deploy-123' },
            message: 'Mission deployed successfully'
          }
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const { req } = createMocks({
        method: 'POST',
        body: {
          proxim8Id: 'proxim8-test-1',
          approach: 'medium'
        }
      });

      req.cookies = {
        get: jest.fn().mockReturnValue({ value: 'test-jwt-token' })
      };
      req.json = jest.fn().mockResolvedValue({
        proxim8Id: 'proxim8-test-1',
        approach: 'medium'
      });

      const response = await deployMission(req as any, {
        params: { missionId: 'training_001' }
      });
      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/training/missions/training_001/deploy',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            proxim8Id: 'proxim8-test-1',
            approach: 'medium'
          })
        })
      );

      expect(result.success).toBe(true);
    });

    it('should validate required fields', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          proxim8Id: 'proxim8-test-1'
          // Missing approach
        }
      });

      req.cookies = {
        get: jest.fn().mockReturnValue({ value: 'test-jwt-token' })
      };
      req.json = jest.fn().mockResolvedValue({
        proxim8Id: 'proxim8-test-1'
      });

      const response = await deployMission(req as any, {
        params: { missionId: 'training_001' }
      });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Proxim8 ID and approach are required');
    });

    it('should validate approach values', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          proxim8Id: 'proxim8-test-1',
          approach: 'invalid'
        }
      });

      req.cookies = {
        get: jest.fn().mockReturnValue({ value: 'test-jwt-token' })
      };
      req.json = jest.fn().mockResolvedValue({
        proxim8Id: 'proxim8-test-1',
        approach: 'invalid'
      });

      const response = await deployMission(req as any, {
        params: { missionId: 'training_001' }
      });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid approach. Must be low, medium, or high');
    });
  });

  describe('GET /api/training/deployments/[deploymentId]/status', () => {
    it('should relay deployment status request', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            deploymentId: 'deploy-123',
            status: 'active',
            progress: { phases: [] }
          }
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const { req } = createMocks({
        method: 'GET'
      });

      req.cookies = {
        get: jest.fn().mockReturnValue({ value: 'test-jwt-token' })
      };

      const response = await getDeploymentStatus(req as any, {
        params: { deploymentId: 'deploy-123' }
      });
      const result = await response.json();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/training/deployments/deploy-123/status',
        expect.objectContaining({
          method: 'GET'
        })
      );

      expect(result.success).toBe(true);
    });

    it('should return 400 for missing deployment ID', async () => {
      const { req } = createMocks({
        method: 'GET'
      });

      req.cookies = {
        get: jest.fn().mockReturnValue({ value: 'test-jwt-token' })
      };

      const response = await getDeploymentStatus(req as any, {
        params: { deploymentId: '' }
      });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Deployment ID is required');
    });
  });

  describe('Error handling', () => {
    it('should handle Express server returning non-JSON responses', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: jest.fn().mockResolvedValue('Internal Server Error')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const { req } = createMocks({
        method: 'GET'
      });

      req.cookies = {
        get: jest.fn().mockReturnValue({ value: 'test-jwt-token' })
      };

      const response = await getMissions(req as any);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
    });

    it('should preserve error status codes from Express server', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({
          error: 'Mission not found'
        })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const { req } = createMocks({
        method: 'GET'
      });

      req.cookies = {
        get: jest.fn().mockReturnValue({ value: 'test-jwt-token' })
      };

      const response = await getMissionDetails(req as any, {
        params: { missionId: 'invalid_mission' }
      });
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
    });
  });
});