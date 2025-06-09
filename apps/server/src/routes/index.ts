import { Router } from 'express';
import { publicEndpoint } from '../middleware';
import { sendSuccess } from '../utils';
import accountRoutes from './account.routes';
import agentRoutes from './agent.routes';
import agentInviteRoutes from './agentInvite.routes';
import capabilityRoutes from './capability.routes';
import fingerprintRoutes from './fingerprint.routes';
import impressionRoutes from './impression.routes';
import knowledgeRoutes from './knowledge.routes';
import missionRoutes from './mission.routes';
import nftRoutes from './nft.routes';
import notificationRoutes from './notification.routes';
import onboardingRoutes from './onboarding.routes';
import presenceRoutes from './presence.routes';
import priceRoutes from './price.routes';
import profileRoutes from './profile.routes';
import proxim8UserRoutes from './proxim8User.routes';
import statsRoutes from './stats.routes';
import tagRoutes from './tag.routes';
import trainingMissionRoutes from './trainingMission.routes';
import videoRoutes from './video.routes';
import visitRoutes from './visit.routes';
import zenstackRoutes from './zenstack.routes';

const router = Router();

// Health check endpoint
router.get('/health', ...publicEndpoint(), (_, res) => {
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Mount domain-specific routers
router.use(accountRoutes); // /accounts/*
router.use(fingerprintRoutes); // /fingerprints/*
router.use(visitRoutes); // /visits/*
router.use(tagRoutes); // /tags/*
router.use(priceRoutes); // /prices/*
router.use(presenceRoutes); // /presence/*
router.use(impressionRoutes); // /impressions/*
router.use(capabilityRoutes); // /capabilities/*
router.use(profileRoutes); // /profiles/*
router.use(statsRoutes); // /stats/*
router.use(onboardingRoutes); // /onboarding/*
router.use(agentRoutes); // /agents/*
router.use(agentInviteRoutes); // /agents/invites/*
router.use(knowledgeRoutes); // /knowledge/*
router.use(missionRoutes); // /missions/*
router.use(nftRoutes); // /nfts/*
router.use(notificationRoutes); // /notifications/*
router.use(proxim8UserRoutes); // /users/*
router.use(videoRoutes); // /videos/*
router.use('/training', trainingMissionRoutes); // /training/*

// ZenStack auto-CRUD endpoints
router.use(zenstackRoutes); // /api/model/*

export default router;
