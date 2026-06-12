import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = Router();

// Place a new order
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { totalAmount, paymentStatus, paymentMode, paymentId, address } = req.body;
    const userId = req.user!.id;

    // Get user's cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate stock
    for (const item of cartItems) {
      if (item.quantity > item.product.stock) {
        return res.status(400).json({ message: `Insufficient stock for ${item.product.name}. Only ${item.product.stock} left.` });
      }
    }

    // Generate Estimated Time
    const minMins = 10;
    const maxMins = 30;
    const est = Math.floor(Math.random() * (maxMins - minMins + 1) + minMins);
    const estimatedTime = `Estimated Delivery: ${est}-${est + 5} mins`;

    const isCod = paymentMode === 'COD';

    // Create Order
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        paymentMode: paymentMode || 'ONLINE',
        paymentStatus: paymentStatus || 'PENDING',
        paymentId,
        estimatedTime,
        orderItems: {
          create: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price
          }))
        },
        address: {
          create: {
            building: address.building,
            room: address.room,
            instructions: address.instructions,
            mobileNumber: address.mobileNumber
          }
        }
      },
      include: { orderItems: true, address: true }
    });

    // Handle Saved Address UPSERT
    if (address.building && address.room) {
      // Find if this exact address exists for user
      const existingAddress = await prisma.savedAddress.findFirst({
        where: {
          userId,
          building: address.building,
          room: address.room
        }
      });
      if (!existingAddress) {
        await prisma.savedAddress.create({
          data: {
            userId,
            building: address.building,
            floor: address.floor || null,
            room: address.room,
            instructions: address.instructions,
            mobileNumber: address.mobileNumber
          }
        });
      }
    }

    // If COD, clear the cart automatically and deduct stock. If ONLINE, verify handles it.
    if (isCod) {
      await prisma.cartItem.deleteMany({ where: { userId } });

      for (const item of cartItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }
    }

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel Order (User aborting Razorpay)
router.put('/:id/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: String(req.params.id) } });
    if (!order || order.userId !== req.user?.id) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: String(req.params.id) },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'FAILED'
      }
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete Order History
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: String(req.params.id) } });
    if (!order || order.userId !== req.user?.id) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await prisma.order.delete({
      where: { id: String(req.params.id) }
    });

    res.json({ message: 'Order history deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's orders
router.get('/my-orders', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      include: { orderItems: { include: { product: true } }, address: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Staff/Admin: Get all active orders
router.get('/', authenticateToken, authorizeRoles('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { user: { select: { name: true, mobile: true } }, orderItems: { include: { product: true } }, address: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Staff/Admin: Update order status
router.put('/:id/status', authenticateToken, authorizeRoles('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: String(req.params.id) },
      data: { status }
    });
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Staff/Admin: Cancel Order
router.put('/:id/staff-cancel', authenticateToken, authorizeRoles('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { cancellationReason } = req.body;
    const order = await prisma.order.findUnique({ 
      where: { id: String(req.params.id) },
      include: { orderItems: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: String(req.params.id) },
      data: {
        status: 'CANCELLED',
        cancellationReason: cancellationReason || 'Cancelled by Staff',
        cancelledBy: req.user?.id,
        cancelledAt: new Date()
      }
    });

    // Restore stock if it was already deducted
    // Stock is deducted when: COD is placed, or ONLINE payment is SUCCESS
    if (order.paymentMode === 'COD' || order.paymentStatus === 'SUCCESS') {
      for (const item of order.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
