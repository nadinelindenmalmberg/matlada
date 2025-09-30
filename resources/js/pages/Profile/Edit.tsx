import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import AuthenticatedLayout from '@/layouts/authenticated-layout';
import UpdateProfileInformationForm from './partials/update-profile-information-form';
import UpdatePasswordForm from './partials/update-password-form';
import DeleteUserForm from './partials/delete-user-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail?: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your account's profile information and email address.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Update Password</CardTitle>
                            <CardDescription>
                                Ensure your account is using a long, random password to stay secure.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UpdatePasswordForm />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Delete Account</CardTitle>
                            <CardDescription>
                                Once your account is deleted, all of its resources and data will be permanently deleted.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DeleteUserForm />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}