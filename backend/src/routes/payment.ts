import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../db';
import crypto from 'crypto';
import Razorpay from 'razorpay';

const router = Router();

// Ensure test keys are used (can be loaded from env, hardcoded for now as requested)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SsRgPaAKjIR8OJ',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '2wXqRvIbAUrpfQZ4lZIsLBKZ',
});

// Create Razorpay Order
router.post('/create-order', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, receipt } = req.body;

    const options = {
      amount: Math.round(amount * 100), // Razorpay requires amount in paise
      currency: 'INR',
      receipt: receipt || `rcpt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Razorpay create order error:', error);
    res.status(500).json({ message: 'Internal server error while creating payment session' });
  }
});

// Verify Payment and clear cart
router.post('/verify', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user!.id;

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || '2wXqRvIbAUrpfQZ4lZIsLBKZ';
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      // Mark as failed if order exists
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'FAILED' }
        });
      }
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({ 
      where: { id: orderId },
      include: { orderItems: true }
    });
    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: 'Order not found or access denied.' });
    }

    // Update order status to SUCCESS
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'SUCCESS',
        status: 'ACCEPTED',
        paymentId: razorpay_payment_id
      }
    });

    // Deduct stock for successful online payment
    for (const item of order.orderItems) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }
    }

    // Successfully verified and updated order! Now Clear the cart
    await prisma.cartItem.deleteMany({ where: { userId } });

    res.json({ message: 'Payment verified successfully. Order confirmed and cart cleared.' });
  } catch (error) {
    console.error('Razorpay verify error:', error);
    res.status(500).json({ message: 'Internal server error during verification' });
  }
});

export default router;
