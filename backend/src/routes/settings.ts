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
          gstPercent: 5,
          isMaintenance: false
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
    const data: any = {};
    if (req.body.deliveryFee !== undefined) data.deliveryFee = Number(req.body.deliveryFee);
    if (req.body.platformFee !== undefined) data.platformFee = Number(req.body.platformFee);
    if (req.body.gstPercent !== undefined) data.gstPercent = Number(req.body.gstPercent);
    if (req.body.isMaintenance !== undefined) data.isMaintenance = Boolean(req.body.isMaintenance);
    if (req.body.maintenanceReason !== undefined) data.maintenanceReason = req.body.maintenanceReason;
    if (req.body.maintenanceInfo !== undefined) data.maintenanceInfo = req.body.maintenanceInfo;
    
    const settings = await prisma.settings.upsert({
      where: { id: 'global' },
      update: data,
      create: {
        id: 'global',
        deliveryFee: data.deliveryFee ?? 10,
        platformFee: data.platformFee ?? 5,
        gstPercent: data.gstPercent ?? 5,
        isMaintenance: data.isMaintenance ?? false,
        maintenanceReason: data.maintenanceReason || null,
        maintenanceInfo: data.maintenanceInfo || null
      }
    });

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
