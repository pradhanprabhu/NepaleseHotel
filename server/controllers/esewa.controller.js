const Transaction = require('../models/Transaction.model');
const { EsewaPaymentGateway, EsewaCheckStatus } = require('esewajs');

const EsewaInitiatePayment = async (req, res) => {
  const { amount, productId } = req.body;

  // Validate required environment variables
  const requiredEnvVars = [
    'MERCHANT_ID',
    'SECRET',
    'SUCCESS_URL',
    'FAILURE_URL',
    'ESEWAPAYMENT_URL'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    return res.status(500).json({
      message: 'Server configuration error',
      details: 'Missing required environment variables'
    });
  }

  // Validate request body
  if (!amount || !productId) {
    return res.status(400).json({
      message: 'Invalid request',
      details: 'Amount and productId are required'
    });
  }

  try {
    console.log('Initiating Esewa payment with:', {
      amount,
      productId,
      merchantId: process.env.MERCHANT_ID,
      successUrl: process.env.SUCCESS_URL,
      failureUrl: process.env.FAILURE_URL
    });

    const reqPayment = await EsewaPaymentGateway(
      amount, 0, 0, 0, productId, process.env.MERCHANT_ID, process.env.SECRET, 
      process.env.SUCCESS_URL, process.env.FAILURE_URL, process.env.ESEWAPAYMENT_URL, 
      undefined, undefined
    );

    if (!reqPayment) {
      console.error('Esewa payment gateway returned no response');
      return res.status(400).json({
        message: 'Payment initiation failed',
        details: 'No response from payment gateway'
      });
    }

    if (reqPayment.status === 200) {
      const transaction = new Transaction({
        product_id: productId,
        amount: amount,
      });
      await transaction.save();
      console.log("Transaction saved successfully");
      return res.send({
        url: reqPayment.request.res.responseUrl,
      });
    } else {
      console.error('Esewa payment gateway returned non-200 status:', reqPayment.status);
      return res.status(400).json({
        message: 'Payment initiation failed',
        details: 'Invalid response from payment gateway'
      });
    }
  } catch (error) {
    console.error('Error in Esewa payment initiation:', error);
    return res.status(400).json({
      message: 'Payment initiation failed',
      details: error.message || 'Unknown error occurred'
    });
  }
};

const paymentStatus = async (req, res) => {
  const { product_id } = req.body;
  try {
    const transaction = await Transaction.findOne({ product_id });
    if (!transaction) {
      return res.status(400).json({ message: "Transaction not found" });
    }

    const paymentStatusCheck = await EsewaCheckStatus(
      transaction.amount,
      transaction.product_id,
      process.env.MERCHANT_ID,
      process.env.ESEWAPAYMENT_STATUS_CHECK_URL
    );

    if (paymentStatusCheck.status === 200) {
      transaction.status = paymentStatusCheck.data.status;
      await transaction.save();
      res.status(200).json({ message: "Transaction status updated successfully" });
    }
  } catch (error) {
    console.error("Error updating transaction status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  EsewaInitiatePayment,
  paymentStatus
};
