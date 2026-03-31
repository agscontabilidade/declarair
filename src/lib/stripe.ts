import { loadStripe } from '@stripe/stripe-js';

// Using the publishable key from Stripe - this is safe to store in the codebase
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51RejZiP18NMeNQ6GqwJDPVMM3jkZL6nVaGjj7t8P7e3pJz3rPDhLLrPxMl2hCuqLtMk67H5q3rHE8ygqWzYGAji00VjJ4GqJV';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
