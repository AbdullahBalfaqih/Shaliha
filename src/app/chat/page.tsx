
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, MessageCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  properties: Pick<Database['public']['Tables']['properties']['Row'], 'id' | 'title' | 'images'>;
  guest: Pick<Database['public']['Tables']['users']['Row'], 'id' | 'full_name' | 'avatar_url'>;
  host: Pick<Database['public']['Tables']['users']['Row'], 'id' | 'full_name' | 'avatar_url'>;
  messages: { count: number }[];
};

type Message = Database['public']['Tables']['messages']['Row'];

function ChatInterface({ conversation, currentUser }: { conversation: Conversation, currentUser: any }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const otherUser = currentUser.id === conversation.host.id ? conversation.guest : conversation.host;

    useEffect(() => {
        const fetchMessages = async () => {
            if (!supabase) return;
            setLoading(true);
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversation.id)
                .order('created_at', { ascending: true });
            setMessages(data || []);
            setLoading(false);
        };
        fetchMessages();
    }, [conversation.id]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!supabase) return;
        const channel = supabase.channel(`messages:${conversation.id}`)
            .on<Message>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
            (payload) => {
                 if (payload.new.sender_id !== currentUser.id) {
                    setMessages(prev => [...prev, payload.new as Message]);
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [conversation.id, currentUser.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !supabase) return;

        const content = newMessage.trim();
        const tempId = `temp-${Date.now()}`;
        
        // Optimistic UI update
        const optimisticMessage: Message = {
            id: tempId,
            conversation_id: conversation.id,
            sender_id: currentUser.id,
            content: content,
            created_at: new Date().toISOString(),
            is_read: false
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage("");

        const { data: insertedMessage, error } = await supabase.from('messages').insert({
            conversation_id: conversation.id,
            sender_id: currentUser.id,
            content: content
        }).select().single();

        if (error) {
            console.error("Error sending message:", error);
            // Revert optimistic update on error
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } else if (insertedMessage) {
            // Replace temporary message with the real one from the DB
            setMessages(prev => prev.map(m => m.id === tempId ? insertedMessage : m));
        }
    };

    return (
        <div className="flex flex-col h-full bg-card">
            <CardHeader className="flex flex-row items-center gap-4 p-4 border-b">
                <Avatar>
                    <AvatarImage src={otherUser.avatar_url || undefined} alt={otherUser.full_name || ''} />
                    <AvatarFallback>{otherUser.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-semibold">{otherUser.full_name}</p>
                    <Link href={`/properties/${conversation.properties.id}`} className="text-xs text-muted-foreground hover:underline">
                        بخصوص: {conversation.properties.title}
                    </Link>
                </div>
            </CardHeader>
            <ScrollArea className="flex-grow p-4" ref={scrollAreaRef as any}>
                {loading ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <div className="space-y-4">
                        {messages.map(message => (
                            <div key={message.id} className={cn("flex items-end gap-2", message.sender_id === currentUser.id ? "justify-end" : "justify-start")}>
                                {message.sender_id !== currentUser.id && <Avatar className="w-8 h-8"><AvatarImage src={otherUser.avatar_url || ''} /><AvatarFallback>{otherUser.full_name?.charAt(0)}</AvatarFallback></Avatar>}
                                <div className={cn("max-w-xs md:max-w-md p-3 rounded-xl", message.sender_id === currentUser.id ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                                    <p className="text-sm">{message.content}</p>
                                    <p className="text-xs opacity-70 mt-1 text-right">{format(new Date(message.created_at), 'p', { locale: arSA })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
            <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="اكتب رسالتك..." autoComplete="off" />
                    <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
                </form>
            </div>
        </div>
    );
}


export default function ChatPage() {
    const { user, loading: authLoading } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchConversations = async () => {
            if (!user || !supabase) return;
            setLoading(true);

            let query = supabase
                .from('conversations')
                .select(`
                    *,
                    properties(id, title, images),
                    guest:users!conversations_guest_id_fkey(id, full_name, avatar_url),
                    host:users!conversations_host_id_fkey(id, full_name, avatar_url),
                    messages(count)
                `)
                .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) {
                console.error("Error fetching conversations:", error);
            } else {
                setConversations(data as any);
                if (data && data.length > 0) {
                    setSelectedConversation(data[0] as any);
                }
            }
            setLoading(false);
        };
        fetchConversations();
    }, [user]);

    if (authLoading || loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin" /></div>;
    }

    if (!user) return null;

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[85vh]">
                <Card className="md:col-span-1 lg:col-span-1 h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>محادثاتي</CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-grow">
                        <CardContent className="space-y-2">
                            {conversations.map(conv => {
                                const otherUser = user.id === conv.host_id ? conv.guest : conv.host;
                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedConversation(conv)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-lg text-right transition-colors",
                                            selectedConversation?.id === conv.id ? "bg-secondary" : "hover:bg-secondary/50"
                                        )}
                                    >
                                        <Avatar>
                                            <AvatarImage src={otherUser.avatar_url || undefined} alt={otherUser.full_name || ''} />
                                            <AvatarFallback>{otherUser.full_name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 truncate">
                                            <p className="font-semibold truncate">{otherUser.full_name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{conv.properties.title}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </CardContent>
                    </ScrollArea>
                </Card>

                <div className="md:col-span-2 lg:col-span-3 h-full">
                    {selectedConversation ? (
                        <ChatInterface conversation={selectedConversation} currentUser={user} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-card rounded-lg border">
                            <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold">حدد محادثة</h2>
                            <p className="text-muted-foreground">اختر محادثة من القائمة لبدء المراسلة.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
