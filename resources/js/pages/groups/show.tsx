import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    Users,
    Copy,
    ExternalLink,
    Settings,
    Trash2,
    UserMinus,
    UserCheck,
    Crown,
    Calendar
} from 'lucide-react';
import { Link, router, Head } from '@inertiajs/react';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

interface User {
    id: number;
    name: string;
    avatar?: string;
    role: string;
    joined_at: string;
    is_admin: boolean;
}

interface Creator {
    id: number;
    name: string;
    avatar?: string;
}

interface Group {
    id: number;
    name: string;
    description?: string;
    code: string;
    invite_link: string;
    is_admin: boolean;
    is_creator: boolean;
    created_at: string;
    invite_url: string;
    invite_link_url: string;
    users: User[];
    creator: Creator;
}

interface PageProps {
    group: Group;
}

export default function GroupShow({ group }: PageProps) {
    const { t } = useI18n();
    const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('Groups', 'Groups'), href: '/groups' },
        { title: group.name, href: `/groups/${group.id}` }
    ];

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedItems(prev => ({ ...prev, [type]: true }));
            setTimeout(() => {
                setCopiedItems(prev => ({ ...prev, [type]: false }));
            }, 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const handleRemoveMember = (userId: number) => {
        if (confirm(t('Are you sure you want to remove this member from the group?', 'Are you sure you want to remove this member from the group?'))) {
            router.delete(`/groups/${group.id}/members`, {
                data: { user_id: userId }
            });
        }
    };

    const handleChangeRole = (userId: number, newRole: string) => {
        router.patch(`/groups/${group.id}/members/role`, {
            user_id: userId,
            role: newRole
        });
    };

    const handleLeaveGroup = () => {
        if (confirm(t('Are you sure you want to leave this group?', 'Are you sure you want to leave this group?'))) {
            router.delete(`/groups/${group.id}/leave`);
        }
    };

    const handleDeleteGroup = () => {
        if (confirm(t('Are you sure you want to delete this group? This action cannot be undone and will remove all group data.', 'Are you sure you want to delete this group? This action cannot be undone and will remove all group data.'))) {
            router.delete(`/groups/${group.id}`);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={group.name} />
            <div className="p-3 max-w-4xl mx-auto space-y-6">

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{group.name}</h1>
                        {group.description && (
                            <p className="text-muted-foreground mt-1">{group.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                                {group.users.length} {group.users.length !== 1 ? t('members', 'members') : t('member', 'member')}
                            </Badge>
                            {group.is_admin && (
                                <Badge variant="secondary">{t('Admin', 'Admin')}</Badge>
                            )}
                            {group.is_creator && (
                                <Badge variant="default">{t('Creator', 'Creator')}</Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild>
                            <Link href={`/week-status?group=${group.id}`}>
                                <Calendar className="h-4 w-4 mr-2" />
                                {t('View Week Status', 'View Week Status')}
                            </Link>
                        </Button>
                        {!group.is_creator && (
                            <Button variant="outline" onClick={handleLeaveGroup}>
                                {t('Leave Group', 'Leave Group')}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Group Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                {t('Group Information', 'Group Information')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Group Code */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">{t('Group Code', 'Group Code')}</Label>
                                <div className="flex items-center gap-2">
                                    <code className="bg-muted px-3 py-2 rounded text-sm font-mono flex-1">
                                        {group.code}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(group.code, 'code')}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    {copiedItems.code && (
                                        <span className="text-xs text-green-600">{t('Copied!', 'Copied!')}</span>
                                    )}
                                </div>
                            </div>

                            {/* Invite Link */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">{t('Invite Link', 'Invite Link')}</Label>
                                <div className="flex items-center gap-2">
                                    <code className="bg-muted px-3 py-2 rounded text-sm font-mono flex-1 truncate">
                                        {group.invite_link_url}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(group.invite_link_url, 'link')}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    {copiedItems.link && (
                                        <span className="text-xs text-green-600">{t('Copied!', 'Copied!')}</span>
                                    )}
                                </div>
                            </div>

                            {/* Created Info */}
                            <div className="pt-2 border-t">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{t('Created by', 'Created by')}</span>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={group.creator.avatar} />
                                            <AvatarFallback className="text-xs">
                                                {getInitials(group.creator.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{group.creator.name}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(group.created_at).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Danger Zone */}
                            {group.is_creator && (
                                <div className="pt-4 border-t">
                                    <h4 className="text-sm font-medium text-destructive mb-2">{t('Danger Zone', 'Danger Zone')}</h4>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDeleteGroup}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {t('Delete Group', 'Delete Group')}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Members */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                {t('Members', 'Members')} ({group.users.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {group.users.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{user.name}</span>
                                                    {user.role === 'admin' && (
                                                        <Crown className="h-4 w-4 text-yellow-500" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {t('Joined', 'Joined')} {new Date(user.joined_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        {group.is_admin && user.id !== group.creator.id && (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleChangeRole(user.id, e.target.value)}
                                                    className="text-xs border rounded px-2 py-1 bg-background"
                                                >
                                                    <option value="member">{t('Member', 'Member')}</option>
                                                    <option value="admin">{t('Admin', 'Admin')}</option>
                                                </select>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleRemoveMember(user.id)}
                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <UserMinus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
