import { Router, Request, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();

// Get settings
router.get('/', async (req: Request, res: Response) => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'global' }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'global',
          deliveryFee: 10,
          platformFee: 5,
          gstPercent: 5
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update settings (Admin only)
router.put('/', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { deliveryFee, platformFee, gstPercent } = req.body;
    
    const settings = await prisma.settings.upsert({
      where: { id: 'global' },
      update: {
        deliveryFee: Number(deliveryFee),
        platformFee: Number(platformFee),
        gstPercent: Number(gstPercent)
      },
      create: {
        id: 'global',
        deliveryFee: Number(deliveryFee),
        platformFee: Number(platformFee),
        gstPercent: Number(gstPercent)
      }
    });

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
