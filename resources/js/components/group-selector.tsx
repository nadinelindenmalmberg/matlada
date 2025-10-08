import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Copy, ExternalLink } from 'lucide-react';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface Group {
    id: number;
    name: string;
    description?: string;
    code: string;
    invite_link: string;
    is_admin: boolean;
    is_creator: boolean;
    member_count: number;
    invite_url: string;
    invite_link_url: string;
}

interface GroupSelectorProps {
    groups: Group[];
    currentGroupId?: number;
}

export function GroupSelector({ groups, currentGroupId }: GroupSelectorProps) {
    const { t } = useI18n();
    const [selectedGroupId, setSelectedGroupId] = useState<string>(
        currentGroupId ? currentGroupId.toString() : 'all'
    );
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleGroupChange = (groupId: string) => {
        setSelectedGroupId(groupId);
        if (groupId === 'all') {
            // Navigate to global view
            router.visit('/week-status', {
                preserveState: true,
                preserveScroll: true,
            });
        } else {
            // Navigate to group view
            router.visit(`/week-status?group=${groupId}`, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const copyToClipboard = async (text: string, type: 'code' | 'link') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedCode(type);
            setTimeout(() => setCopiedCode(null), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const currentGroup = groups.find(g => g.id === currentGroupId);

    return (
        <div className="space-y-4">
            {/* Group Selector */}
            <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Select value={selectedGroupId} onValueChange={handleGroupChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a group or view all users" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>All Users</span>
                            </div>
                        </SelectItem>
                        {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        <span>{group.name}</span>
                                    </div>
                                    {group.is_admin && (
                                        <Badge variant="secondary" className="text-xs ml-auto">
                                            Admin
                                        </Badge>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button asChild size="sm" variant="outline">
                    <Link href="/groups/create">
                        <Plus className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            {/* Current Group Info */}
            {currentGroup && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">{currentGroup.name}</CardTitle>
                                {currentGroup.description && (
                                    <CardDescription>{currentGroup.description}</CardDescription>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                    {currentGroup.member_count} member{currentGroup.member_count !== 1 ? 's' : ''}
                                </Badge>
                                {currentGroup.is_admin && (
                                    <Badge variant="secondary">Admin</Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            {/* Group Code */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Group Code:</span>
                                <div className="flex items-center gap-2">
                                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                        {currentGroup.code}
                                    </code>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(currentGroup.code, 'code')}
                                        className="h-6 w-6 p-0"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                    {copiedCode === 'code' && (
                                        <span className="text-xs text-green-600">Copied!</span>
                                    )}
                                </div>
                            </div>

                            {/* Invite Link */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Invite Link:</span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(currentGroup.invite_link_url, 'link')}
                                        className="h-6 px-2 text-xs"
                                    >
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Copy Link
                                    </Button>
                                    {copiedCode === 'link' && (
                                        <span className="text-xs text-green-600">Copied!</span>
                                    )}
                                </div>
                            </div>

                            {/* Group Actions */}
                            <div className="flex gap-2 pt-2">
                                <Button asChild size="sm" variant="outline">
                                    <Link href={`/groups/${currentGroup.id}`}>
                                        Manage Group
                                    </Link>
                                </Button>
                                {currentGroup.is_admin && (
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={`/groups/${currentGroup.id}`}>
                                            Settings
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* No Groups Message */}
            {groups.length === 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <Users className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                You're not part of any groups yet.
                            </p>
                            <Button asChild size="sm">
                                <Link href="/groups/create">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Group
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
