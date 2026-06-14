import { Router, Request, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();

// Get active coupons
router.get('/', async (req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { isActive: true }
    });
    res.json(coupons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Create Coupon
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { code, discountAmount, minOrderValue, expiryDate, isActive } = req.body;
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ message: 'Coupon already exists' });
    }
    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountAmount: Number(discountAmount),
        minOrderValue: Number(minOrderValue),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.status(201).json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Delete Coupon
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.coupon.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Update Coupon
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { code, discountAmount, minOrderValue, isActive } = req.body;
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing && existing.id !== req.params.id) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    const coupon = await prisma.coupon.update({
      where: { id: String(req.params.id) },
      data: {
        code,
        discountAmount: Number(discountAmount),
        minOrderValue: Number(minOrderValue),
        isActive
      }
    });
    res.json(coupon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
