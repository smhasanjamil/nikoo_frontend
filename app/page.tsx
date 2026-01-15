// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login'); // Automatically redirect to login
  return null; // No content needed since redirecting
}