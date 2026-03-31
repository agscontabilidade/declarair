import { loadStripe } from '@stripe/stripe-js';

// Using the publishable key from Stripe - this is safe to store in the codebase
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51RejZiP18NMeNQ6G720o6Aat8h0DTrqaXENsVOL2vqfs9AFiMajz6hPwGLY4MvW8xRL7B1B4LB6DfcyxMRDCVKua00UGvQGML0';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
