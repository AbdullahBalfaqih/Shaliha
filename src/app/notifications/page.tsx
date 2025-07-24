
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, BellOff } from "lucide-react";

type Notification = Database['public']['Tables']['notifications']['Row'];

export default function NotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!user || !supabase) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching notifications", error);
        } else {
            setNotifications(data || []);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);
    
    useEffect(() => {
        if (!user || !supabase) return;

        const channel = supabase.channel(`notifications-page:${user.id}`)
            .on<Notification>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            (payload) => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAllAsRead = async () => {
        if (!user || !supabase) return;
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds);

        if (!error) {
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="max-w-3xl mx-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>الإشعارات</CardTitle>
                        <CardDescription>جميع تحديثاتك في مكان واحد.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={notifications.every(n => n.is_read)}>
                        <Mail className="ml-2 h-4 w-4" />
                        وضع علامة "مقروء" على الكل
                    </Button>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[60vh]">
                        <div className="space-y-4 pr-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map(notification => (
                                    <NotificationItem key={notification.id} notification={notification} />
                                ))
                            ) : (
                                <div className="text-center py-16 text-muted-foreground">
                                    <BellOff className="h-12 w-12 mx-auto mb-4" />
                                    <p>لا توجد إشعارات لعرضها حالياً.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}

function NotificationItem({ notification }: { notification: Notification }) {
    const content = (
        <div className={`relative flex items-start gap-4 p-4 rounded-lg transition-colors ${!notification.is_read ? 'bg-secondary' : 'bg-card'}`}>
            {!notification.is_read && (
                <div className="absolute top-1/2 -translate-y-1/2 right-[-20px] h-2 w-2 rounded-full bg-primary" />
            )}
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-foreground">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: arSA })}
                    </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
            </div>
        </div>
    );

    if (notification.link) {
        return <Link href={notification.link} className="block hover:bg-secondary/50 rounded-lg">{content}</Link>;
    }

    return content;
}
