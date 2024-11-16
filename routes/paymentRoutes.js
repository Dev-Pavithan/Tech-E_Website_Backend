import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// MongoDB Schema for Payment Intent
const paymentSchema = new mongoose.Schema({
  paymentIntentId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  clientSecret: { type: String, required: true },
  cardholderName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// MongoDB Model for Payment Intent
const Payment = mongoose.model('Payment', paymentSchema);

// POST route to create a new payment intent and store it in MongoDB
router.post('/payment-intent', async (req, res) => {
  const { amount, cardholderName } = req.body;

  // Validate input
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  if (!cardholderName || typeof cardholderName !== 'string' || cardholderName.trim().length === 0) {
    return res.status(400).json({ error: 'Cardholder name is required' });
  }

  try {
    // Create the payment intent using Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card'],
    });

    // Store the payment intent details in MongoDB
    const newPayment = new Payment({
      paymentIntentId: paymentIntent.id,
      amount,
      currency: 'usd',
      clientSecret: paymentIntent.client_secret,
      cardholderName: cardholderName.trim(),
    });

    await newPayment.save();

    res.status(201).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Error creating payment intent', details: error.message });
  }
});

// GET route to retrieve a payment intent by ID
router.get('/payment-intent/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const payment = await Payment.findOne({ paymentIntentId: id });

    if (!payment) {
      return res.status(404).json({ error: 'Payment intent not found' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    res.status(500).json({ error: 'Error retrieving payment intent', details: error.message });
  }
});

// GET route to retrieve all payment intents
router.get('/payment-intents', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error retrieving payment intents:', error);
    res.status(500).json({ error: 'Error retrieving payment intents', details: error.message });
  }
});

// GET route to retrieve the last transaction
router.get('/last-transaction', async (req, res) => {
  try {
    const lastTransaction = await Payment.findOne().sort({ createdAt: -1 }); // Get the most recent transaction

    if (!lastTransaction) {
      return res.status(404).json({ error: 'No transactions found' });
    }

    res.status(200).json(lastTransaction);
  } catch (error) {
    console.error('Error retrieving last transaction:', error);
    res.status(500).json({ error: 'Error retrieving last transaction', details: error.message });
  }
});

export default router;
