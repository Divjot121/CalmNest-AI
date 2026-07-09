import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sentiment?: string | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

interface TherapistState {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  crisisDetected: boolean;
  fetchConversations: () => Promise<void>;
  selectConversation: (id: string | null) => Promise<void>;
  createNewConversation: (title?: string) => Promise<string | null>;
  deleteConversation: (id: string) => Promise<boolean>;
  renameConversation: (id: string, newTitle: string) => Promise<boolean>;
  sendMessage: (text: string) => Promise<boolean>;
  setCrisisDetected: (val: boolean) => void;
}

export const useTherapistStore = create<TherapistState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoadingConversations: true,
  isLoadingMessages: false,
  isSending: false,
  crisisDetected: false,
  fetchConversations: async () => {
    try {
      set({ isLoadingConversations: true });
      let user = useAuthStore.getState().user;
      if (!user?.id) {
        user = await useAuthStore.getState().checkAuth();
      }
      if (!user?.id) {
        user = (await useAuthStore.getState().loginAnonymously())?.success ? useAuthStore.getState().user : null;
      }
      if (!user?.id) {
        set({ isLoadingConversations: false });
        return;
      }
      const q = query(
        collection(db, 'chats'),
        where('userId', '==', user.id),
        orderBy('updatedAt', 'desc')
      );
      const snap = await getDocs(q);
      const conversations: ConversationSummary[] = snap.docs.map(d => ({
        id: d.id,
        title: d.data().title || 'Chat Session',
        updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }));

      // If no conversations exist, auto-create a welcome session
      if (conversations.length === 0) {
        const newId = await get().createNewConversation('Welcome to CalmNest AI');
        if (newId) {
          return;
        }
      }

      set({ conversations, isLoadingConversations: false });
      if (!get().activeConversationId && conversations.length > 0) {
        await get().selectConversation(conversations[0].id);
      }
    } catch (error) {
      set({ isLoadingConversations: false });
    }
  },
  selectConversation: async (id) => {
    if (!id) {
      set({ activeConversationId: null, messages: [] });
      return;
    }
    set({ activeConversationId: id, isLoadingMessages: true, crisisDetected: false });
    try {
      const chatDocRef = doc(db, 'chats', id);
      const chatDoc = await getDoc(chatDocRef);
      if (chatDoc.exists()) {
        set({ crisisDetected: chatDoc.data()?.crisisDetected || false });
      }

      const q = query(
        collection(db, 'chats', id, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(100)
      );
      const snap = await getDocs(q);
      const flatMsgs: ChatMessage[] = [];
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.text) {
          flatMsgs.push({
            id: d.id + '-user',
            role: 'user',
            content: data.text,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          });
        }
        if (data.responseText) {
          flatMsgs.push({
            id: d.id + '-ai',
            role: 'assistant',
            content: data.responseText,
            createdAt: data.responseCreatedAt?.toDate?.()?.toISOString() || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          });
        }
      });

      set({ messages: flatMsgs, isLoadingMessages: false });
    } catch (error) {
      set({ isLoadingMessages: false });
    }
  },
  createNewConversation: async (title = 'New Session') => {
    try {
      const user = useAuthStore.getState().user;
      if (!user?.id) return null;

      const chatRef = await addDoc(collection(db, 'chats'), {
        userId: user.id,
        title,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        crisisDetected: false
      });

      // Add welcome message inside a messages doc using response fields
      await addDoc(collection(db, 'chats', chatRef.id, 'messages'), {
        responseText: `Hello ${user.name || 'friend'}! I am CalmNest, your safe space for support, reflection, and mindfulness. How are you feeling today?`,
        senderId: 'ai',
        senderType: 'ai',
        role: 'assistant',
        createdAt: serverTimestamp(),
        responseCreatedAt: serverTimestamp()
      });

      const newConv: ConversationSummary = {
        id: chatRef.id,
        title,
        updatedAt: new Date().toISOString()
      };

      set(state => ({
        conversations: [newConv, ...state.conversations],
        activeConversationId: chatRef.id
      }));

      await get().selectConversation(chatRef.id);
      return chatRef.id;
    } catch (error) {
      return null;
    }
  },
  deleteConversation: async (id) => {
    try {
      await deleteDoc(doc(db, 'chats', id));
      set(state => {
        const remaining = state.conversations.filter(c => c.id !== id);
        const nextActive = state.activeConversationId === id ? (remaining[0]?.id || null) : state.activeConversationId;
        return {
          conversations: remaining,
          activeConversationId: nextActive,
          messages: nextActive === state.activeConversationId && nextActive !== null ? state.messages : []
        };
      });
      if (get().activeConversationId && get().activeConversationId !== id) {
        const nextId = get().activeConversationId;
        if (nextId) await get().selectConversation(nextId);
      }
      return true;
    } catch (error) {
      return false;
    }
  },
  renameConversation: async (id, newTitle) => {
    try {
      await updateDoc(doc(db, 'chats', id), { title: newTitle, updatedAt: serverTimestamp() });
      set(state => ({
        conversations: state.conversations.map(c => c.id === id ? { ...c, title: newTitle } : c)
      }));
      return true;
    } catch (error) {
      return false;
    }
  },
  sendMessage: async (text) => {
    if (!text.trim() || get().isSending) return false;
    const user = useAuthStore.getState().user;
    if (!user?.id) return false;

    let convId = get().activeConversationId;
    if (!convId) {
      convId = await get().createNewConversation('Chat Session');
      if (!convId) return false;
    }

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };

    set(state => ({
      messages: [...state.messages, tempUserMsg],
      isSending: true
    }));

    try {
      // Save user query to Firestore messages collection
      const msgDocRef = await addDoc(collection(db, 'chats', convId, 'messages'), {
        text,
        content: text,
        senderId: user.id,
        anonymousUserId: user.id,
        senderType: 'user',
        role: 'user',
        createdAt: serverTimestamp()
      });

      // Call Gemini endpoint
      const currentMessages = get().messages.map(m => ({
        role: m.role,
        content: m.content
      })).concat({ role: 'user', content: text });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages })
      });

      let aiResponseText = "I'm here for you. Take a deep breath—I am listening.";
      let crisis = false;

      if (res.ok) {
        const data = await res.json();
        aiResponseText = data.text || aiResponseText;
        crisis = data.crisisDetected || false;
      }

      // Save AI response inside the same messages document under response fields
      await updateDoc(msgDocRef, {
        responseText: aiResponseText,
        responseCreatedAt: serverTimestamp()
      });

      if (crisis) {
        await updateDoc(doc(db, 'chats', convId), { crisisDetected: true, updatedAt: serverTimestamp() });
      } else {
        await updateDoc(doc(db, 'chats', convId), { updatedAt: serverTimestamp() });
      }

      const aiMsgObj: ChatMessage = {
        id: msgDocRef.id + '-ai',
        role: 'assistant',
        content: aiResponseText,
        createdAt: new Date().toISOString()
      };

      set(state => ({
        messages: state.messages.filter(m => m.id !== tempUserMsg.id).concat({ ...tempUserMsg, id: msgDocRef.id + '-user' }, aiMsgObj),
        isSending: false,
        crisisDetected: state.crisisDetected || crisis
      }));

      return true;
    } catch (error) {
      set({ isSending: false });
      return false;
    }
  },
  setCrisisDetected: (val) => set({ crisisDetected: val })
}));
