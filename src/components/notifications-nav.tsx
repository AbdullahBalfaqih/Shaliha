
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, BellRing, Mail } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';

type Notification = Database['public']['Tables']['notifications']['Row'];

export function NotificationsNav() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!user || !supabase) return;
        
        const { data, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (!error && data) {
            setNotifications(data);
            const unread = data.filter(n => !n.is_read).length;
            setUnreadCount(unread);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        if (!user || !supabase) return;

        const channel = supabase.channel(`notifications:${user.id}`)
            .on<Notification>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev.slice(0, 9)]);
                setUnreadCount(prev => prev + 1);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = async (notificationId: string) => {
        if (!supabase) return;
        const notification = notifications.find(n => n.id === notificationId);
        if (!notification || notification.is_read) return;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    return (
        <Popover onOpenChange={(isOpen) => { if(isOpen) fetchNotifications()}}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    {unreadCount > 0 ? <BellRing className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5" />}
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4">
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-xs text-primary-foreground items-center justify-center">{unreadCount}</span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <div className="p-4 border-b">
                    <h4 className="font-medium leading-none">الإشعارات</h4>
                </div>
                <ScrollArea className="h-96">
                    {notifications.length > 0 ? (
                        <div className="p-2">
                            {notifications.map(n => (
                                <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-10">لا توجد إشعارات جديدة.</p>
                    )}
                </ScrollArea>
                <div className="p-2 border-t text-center">
                    <Button variant="link" asChild>
                        <Link href="/notifications">عرض كل الإشعارات</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function NotificationItem({ notification, onRead }: { notification: Notification, onRead: (id: string) => void }) {
    
    const handleClick = () => {
        if (!notification.is_read) {
            onRead(notification.id);
        }
    }
    
    const content = (
         <div onClick={handleClick} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${notification.is_read ? 'hover:bg-secondary/50' : 'bg-primary/10 hover:bg-primary/20'}`}>
            {!notification.is_read && <div className="h-2.5 w-2.5 mt-1 rounded-full bg-primary" />}
            <div className="flex-1">
                <p className="font-semibold text-sm">{notification.title}</p>
                <p className="text-xs text-muted-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: arSA })}
                </p>
            </div>
         </div>
    );

    if (notification.link) {
        return <Link href={notification.link}>{content}</Link>;
    }
    
    return content;
}
