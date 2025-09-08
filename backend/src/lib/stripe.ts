import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
});

export default stripe;

export const createPaymentIntent = async (
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> => {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata,
  });
};

export const createCustomer = async (
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> => {
  return await stripe.customers.create({
    email,
    name,
    metadata,
  });
};

export const createConnectedAccount = async (
  email: string,
  type: 'express' = 'express'
): Promise<Stripe.Account> => {
  return await stripe.accounts.create({
    type,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
};

export const createAccountLink = async (
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink> => {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
};

export const createTransfer = async (
  amount: number,
  destination: string,
  metadata?: Record<string, string>
): Promise<Stripe.Transfer> => {
  return await stripe.transfers.create({
    amount,
    currency: 'usd',
    destination,
    metadata,
  });
};

export const createRefund = async (
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<Stripe.Refund> => {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason,
  });
};

export const retrieveAccount = async (accountId: string): Promise<Stripe.Account> => {
  return await stripe.accounts.retrieve(accountId);
};

export const retrieveBalance = async (accountId?: string): Promise<Stripe.Balance> => {
  if (accountId) {
    return await stripe.balance.retrieve({ stripeAccount: accountId });
  }
  return await stripe.balance.retrieve();
};