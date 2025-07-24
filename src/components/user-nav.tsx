
"use client";

import Link from "next/link";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User, LayoutDashboard, Heart, Shield, Home, MessageSquare } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export function UserNav() {
    const { user, logout, loading } = useAuth();

    if (loading) {
        return <Skeleton className="h-8 w-8 rounded-full" />;
    }

    if (!user) {
        return null;
    }

    const { role, full_name, avatar_url, email, phone } = user;

    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={avatar_url || ''} alt={full_name || ''} />
                            <AvatarFallback>{full_name ? full_name.charAt(0) : 'U'}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{full_name}</p>
                            {email && (
                                <p className="text-xs leading-none text-muted-foreground">
                                    {email}
                                </p>
                            )}
                            {phone && (
                                <p className="text-xs leading-none text-muted-foreground" dir="ltr">
                                    {phone}
                                </p>
                            )}
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        {role === 'admin' && (
                            <DropdownMenuItem asChild>
                                <Link href="/admin/dashboard">
                                    <Shield className="mr-2 h-4 w-4" />
                                    <span>لوحة تحكم المدير</span>
                                </Link>
                            </DropdownMenuItem>
                        )}
                        {(role === 'host' || role === 'admin') && (
                            <DropdownMenuItem asChild>
                                <Link href="/host/dashboard">
                                    <Home className="mr-2 h-4 w-4" />
                                    <span>لوحة تحكم المضيف</span>
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>لوحة التحكم</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/chat">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                <span>الرسائل</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard?tab=profile">
                                <User className="mr-2 h-4 w-4" />
                                <span>الملف الشخصي</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard?tab=wishlist">
                                <Heart className="mr-2 h-4 w-4" />
                                <span>قائمة الرغبات</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>تسجيل الخروج</span>
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        سيؤدي هذا الإجراء إلى تسجيل خروجك من حسابك.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={() => logout()}>تأكيد</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
