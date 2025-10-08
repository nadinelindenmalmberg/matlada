import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Users } from 'lucide-react';
import { Link, router, Head } from '@inertiajs/react';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';

export default function CreateGroup() {
    const { t } = useI18n();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Groups', href: '/groups' },
        { title: 'Create Group', href: '/groups/create' }
    ];

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
        };

        router.post('/groups', data, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Group" />
            <div className="p-3 max-w-2xl mx-auto space-y-6">

                <div>
                    <h1 className="text-2xl font-bold">Create New Group</h1>
                    <p className="text-muted-foreground">
                        Create a group to plan lunches with your team, class, or friends.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Group Details
                        </CardTitle>
                        <CardDescription>
                            Fill in the details for your new group. You can always change these later.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Group Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g., Class 5A, Team Alpha, Lunch Buddies"
                                    required
                                    maxLength={255}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Choose a name that clearly identifies your group.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Describe your group or add any special instructions..."
                                    maxLength={1000}
                                    rows={3}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Help others understand what this group is for.
                                </p>
                            </div>

                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                <h4 className="font-medium text-sm">What happens next?</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• You'll become the group admin automatically</li>
                                    <li>• A unique group code will be generated (e.g., ABC123)</li>
                                    <li>• An invite link will be created for easy sharing</li>
                                    <li>• You can start planning lunches right away</li>
                                </ul>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Group'}
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/groups">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
