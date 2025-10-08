import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Copy, ExternalLink, Settings, Trash2 } from 'lucide-react';
import { Link, router, Head } from '@inertiajs/react';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

interface Group {
    id: number;
    name: string;
    description?: string;
    code: string;
    invite_link: string;
    is_admin: boolean;
    is_creator: boolean;
    member_count: number;
    created_at: string;
    invite_url: string;
    invite_link_url: string;
}

interface PageProps {
    groups: Group[];
}

export default function GroupsIndex({ groups }: PageProps) {
    const { t } = useI18n();
    const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('Groups', 'Groups'), href: '/groups' }
    ];

    const copyToClipboard = async (text: string, type: string, groupId: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedItems(prev => ({ ...prev, [`${type}-${groupId}`]: true }));
            setTimeout(() => {
                setCopiedItems(prev => ({ ...prev, [`${type}-${groupId}`]: false }));
            }, 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const handleDeleteGroup = (groupId: number) => {
        if (confirm(t('Are you sure you want to delete this group? This action cannot be undone.', 'Are you sure you want to delete this group? This action cannot be undone.'))) {
            router.delete(`/groups/${groupId}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('My Groups', 'My Groups')} />
            <div className="p-3 space-y-6">
                {/* Page Header */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">{t('My Groups', 'My Groups')}</h1>
                    <p className="text-muted-foreground">
                        {t('Manage your lunch planning groups', 'Manage your lunch planning groups')}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                    <Button asChild>
                        <Link href="/groups/create">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('Create Group', 'Create Group')}
                        </Link>
                    </Button>
                </div>

                {groups.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center space-y-4">
                                <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                                <div>
                                    <h3 className="text-lg font-semibold">{t('No groups yet', 'No groups yet')}</h3>
                                    <p className="text-muted-foreground">
                                        {t('Create your first group to start planning lunches with your team or class.', 'Create your first group to start planning lunches with your team or class.')}
                                    </p>
                                </div>
                                <Button asChild>
                                    <Link href="/groups/create">
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('Create Your First Group', 'Create Your First Group')}
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {groups.map((group) => (
                            <Card key={group.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg">{group.name}</CardTitle>
                                            {group.description && (
                                                <CardDescription className="line-clamp-2">
                                                    {group.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            {group.is_admin && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {t('Admin', 'Admin')}
                                                </Badge>
                                            )}
                                            {group.is_creator && (
                                                <Badge variant="outline" className="text-xs">
                                                    {t('Creator', 'Creator')}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Member Count */}
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>{group.member_count} {group.member_count !== 1 ? t('members', 'members') : t('member', 'member')}</span>
                                    </div>

                                    {/* Group Code */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{t('Group Code', 'Group Code')}:</span>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                                    {group.code}
                                                </code>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => copyToClipboard(group.code, 'code', group.id)}
                                                    className="h-6 w-6 p-0"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                                {copiedItems[`code-${group.id}`] && (
                                                    <span className="text-xs text-green-600">{t('Copied!', 'Copied!')}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Invite Link */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{t('Invite Link', 'Invite Link')}:</span>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => copyToClipboard(group.invite_link_url, 'link', group.id)}
                                                    className="h-6 px-2 text-xs"
                                                >
                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                    {t('Copy', 'Copy')}
                                                </Button>
                                                {copiedItems[`link-${group.id}`] && (
                                                    <span className="text-xs text-green-600">{t('Copied!', 'Copied!')}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <Button asChild size="sm" className="flex-1">
                                            <Link href={`/week-status?group=${group.id}`}>
                                                {t('View Week Status', 'View Week Status')}
                                            </Link>
                                        </Button>
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={`/groups/${group.id}`}>
                                                <Settings className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        {group.is_creator && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeleteGroup(group.id)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Join Group Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Join a Group', 'Join a Group')}</CardTitle>
                        <CardDescription>
                            {t('Have a group code? Enter it below to join an existing group.', 'Have a group code? Enter it below to join an existing group.')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const code = formData.get('code') as string;
                                if (code) {
                                    router.post('/groups/join', { code: code.toUpperCase() });
                                }
                            }}
                            className="flex gap-2"
                        >
                            <input
                                name="code"
                                type="text"
                                placeholder={t('Enter group code (e.g., ABC123)', 'Enter group code (e.g., ABC123)')}
                                className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                                maxLength={6}
                                style={{ textTransform: 'uppercase' }}
                            />
                            <Button type="submit">{t('Join Group', 'Join Group')}</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
