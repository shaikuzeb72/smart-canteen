import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get User Cart
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user!.id },
      include: { product: true }
    });
    res.json(cartItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add to Cart
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    
    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Check if stock is sufficient
    if ((quantity || 1) > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} items left in stock` });
    }

    // Check if already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: { userId: req.user!.id, productId }
    });

    if (existingItem) {
      const newQty = existingItem.quantity + (quantity || 1);
      if (newQty > product.stock) {
        return res.status(400).json({ message: `Cannot add more. Only ${product.stock} items left in stock` });
      }

      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
        include: { product: true }
      });
      return res.json(updatedItem);
    }

    const newItem = await prisma.cartItem.create({
      data: {
        userId: req.user!.id,
        productId,
        quantity: quantity || 1
      },
      include: { product: true }
    });
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update Cart Item Quantity
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { quantity } = req.body;
    
    const existingItem = await prisma.cartItem.findFirst({
      where: { id: String(req.params.id), userId: req.user!.id },
      include: { product: true }
    });
    
    if (!existingItem) return res.status(404).json({ message: 'Cart item not found' });
    if (quantity > existingItem.product.stock) {
      return res.status(400).json({ message: `Only ${existingItem.product.stock} items left in stock` });
    }

    const item = await prisma.cartItem.updateMany({
      where: { id: String(req.params.id), userId: req.user!.id },
      data: { quantity }
    });
    
    res.json({ message: 'Cart updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove from Cart
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.cartItem.deleteMany({
      where: { id: String(req.params.id), userId: req.user!.id }
    });
    if (item.count === 0) return res.status(404).json({ message: 'Cart item not found' });
    
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
