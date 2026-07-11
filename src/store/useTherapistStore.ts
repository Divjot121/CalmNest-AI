import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { supabase } from '@/lib/supabase';
import { getOrCreateAnonymousUUID } from '@/lib/identity-service';

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
      const targetId = user?.id || getOrCreateAnonymousUUID();

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user_id.eq.${targetId},anon_uuid.eq.${targetId}`)
        .order('updated_at', { ascending: false });

      if (error || !data) {
        set({ isLoadingConversations: false });
        return;
      }

      const conversations: ConversationSummary[] = data.map((d: any) => ({
        id: d.id,
        title: d.title || 'Chat Session',
        updatedAt: d.updated_at || new Date().toISOString()
      }));

      if (conversations.length === 0) {
        const newId = await get().createNewConversation('Welcome to CalmNest AI');
        if (newId) return;
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
      const { data: convData } = await supabase
        .from('conversations')
        .select('risk_detected')
        .eq('id', id)
        .single();

      if (convData) {
        set({ crisisDetected: convData.risk_detected || false });
      }

      const { data: msgData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })
        .limit(100);

      const flatMsgs: ChatMessage[] = (msgData || []).map((m: any) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        sentiment: m.sentiment,
        createdAt: m.created_at || new Date().toISOString()
      }));

      set({ messages: flatMsgs, isLoadingMessages: false });
    } catch (error) {
      set({ isLoadingMessages: false });
    }
  },
  createNewConversation: async (title = 'New Session') => {
    try {
      const user = useAuthStore.getState().user;
      const targetId = user?.id || getOrCreateAnonymousUUID();

      const { data: inserted, error } = await supabase
        .from('conversations')
        .insert({
          user_id: targetId,
          anon_uuid: targetId,
          title,
          risk_detected: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error || !inserted?.id) return null;

      const welcomeText = `Hello ${user?.name || 'friend'}! I am CalmNest, your safe space for support, reflection, and mindfulness. How are you feeling today?`;
      await supabase.from('messages').insert({
        conversation_id: inserted.id,
        role: 'assistant',
        content: welcomeText,
        created_at: new Date().toISOString()
      });

      const newConv: ConversationSummary = {
        id: inserted.id,
        title,
        updatedAt: new Date().toISOString()
      };

      set(state => ({
        conversations: [newConv, ...state.conversations],
        activeConversationId: inserted.id
      }));

      await get().selectConversation(inserted.id);
      return inserted.id;
    } catch (error) {
      return null;
    }
  },
  deleteConversation: async (id) => {
    try {
      await supabase.from('conversations').delete().eq('id', id);
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
      await supabase.from('conversations').update({ title: newTitle, updated_at: new Date().toISOString() }).eq('id', id);
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
    const targetId = user?.id || getOrCreateAnonymousUUID();

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
      const { data: userMsgDoc } = await supabase.from('messages').insert({
        conversation_id: convId,
        role: 'user',
        content: text,
        created_at: new Date().toISOString()
      }).select('id').single();

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

      const { data: aiMsgDoc } = await supabase.from('messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: aiResponseText,
        created_at: new Date().toISOString()
      }).select('id').single();

      if (crisis || get().crisisDetected) {
        await supabase.from('conversations').update({ risk_detected: true, updated_at: new Date().toISOString() }).eq('id', convId);
      } else {
        await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
      }

      const aiMsgObj: ChatMessage = {
        id: aiMsgDoc?.id || `ai-${Date.now()}`,
        role: 'assistant',
        content: aiResponseText,
        createdAt: new Date().toISOString()
      };

      set(state => ({
        messages: state.messages.filter(m => m.id !== tempUserMsg.id).concat({ ...tempUserMsg, id: userMsgDoc?.id || tempUserMsg.id }, aiMsgObj),
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
