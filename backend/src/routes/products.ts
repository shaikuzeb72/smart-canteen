import { Router, Request, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();

// Get all products (Public or Auth depending on requirement, let's make it Public for browsing)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    const whereClause: any = {};
    if (category) whereClause.category = String(category);
    if (search) whereClause.name = { contains: String(search), mode: 'insensitive' };

    const products = await prisma.product.findMany({
      where: whereClause
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single product
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: String(req.params.id) }
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Create Product
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, price, weight, description, stock, imageUrl } = req.body;
    const finalCategory = category || 'Food & Cafe';
    const product = await prisma.product.create({
      data: { name, category: finalCategory, price: Number(price), weight, description, stock: Number(stock), imageUrl }
    });
    res.status(201).json(product);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    console.error(errorMsg);
    res.status(400).json({ message: errorMsg });
  }
});

// Admin: Update Product
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, category, price, weight, description, stock, imageUrl } = req.body;
    const finalCategory = category || 'Food & Cafe';
    const product = await prisma.product.update({
      where: { id: String(req.params.id) },
      data: { name, category: finalCategory, price: Number(price), weight, description, stock: Number(stock), imageUrl }
    });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Delete Product
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    console.error(errorMsg);
    res.status(400).json({ message: errorMsg });
  }
});

export default router;
