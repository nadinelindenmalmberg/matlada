import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { useI18n } from '@/lib/i18n';

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { t } = useI18n();
    const { auth } = usePage<SharedData>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('Profile settings', 'Profile settings'),
            href: edit().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Profile settings', 'Profile settings')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title={t('Profile information', 'Profile information')} description={t('Update your name and email address', 'Update your name and email address')} />

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label>{t('Profile picture', 'Profile picture')}</Label>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12 overflow-hidden rounded-full">
                                            <AvatarImage src={auth.user.avatar_url} alt={auth.user.name} />
                                            <AvatarFallback className="rounded-full bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                {auth.user.name.split(' ').map((n: string) => n.charAt(0)).join('').slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Input id="avatar" name="avatar" type="file" accept="image/*" />
                                    </div>
                                    <InputError className="mt-2" message={errors.avatar} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">{t('Name', 'Name')}</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder={t('Full name', 'Full name')}
                                    />

                                    <InputError className="mt-2" message={errors.name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">{t('Email address', 'Email address')}</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder={t('Email address', 'Email address')}
                                    />

                                    <InputError className="mt-2" message={errors.email} />
                                </div>

                                {mustVerifyEmail && auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            {t('Your email address is unverified.', 'Your email address is unverified.')}{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                {t('Click here to resend the verification email.', 'Click here to resend the verification email.')}
                                            </Link>
                                        </p>

                                        {status === 'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                {t('A new verification link has been sent to your email address.', 'A new verification link has been sent to your email address.')}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing} data-test="update-profile-button">{t('Save', 'Save')}</Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">{t('Saved', 'Saved')}</p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
