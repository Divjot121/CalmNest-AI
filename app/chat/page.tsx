import ChatInterface from '@/components/ChatInterface';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Empathetic AI Therapist | CalmNest',
  description: 'Connect with a private, anonymous AI therapist. Express your emotions freely in a safe space.',
  alternates: {
    canonical: '/chat',
  },
};

export default function ChatPage() {
  return <ChatInterface />;
}
