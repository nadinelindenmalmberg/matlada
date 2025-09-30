import { FormEventHandler, useRef, useState } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { PageProps, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Trash2 } from 'lucide-react';
import { edit as profileEdit, update as profileUpdate } from '@/routes/profile';
import { upload as avatarUpload, deleteMethod as avatarDelete } from '@/routes/profile/avatar';
import { send as verificationSend } from '@/routes/verification';

export default function UpdateProfileInformationForm({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail?: boolean;
    status?: string;
}) {
    const user = usePage<PageProps>().props.auth.user;
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const {
        data: avatarData,
        setData: setAvatarData,
        post: postAvatar,
        processing: avatarProcessing,
        errors: avatarErrors,
        recentlySuccessful: avatarRecentlySuccessful,
    } = useForm({
        avatar: null as File | null,
    });

    const { delete: deleteAvatar, processing: deletingAvatar } = useForm();

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(profileUpdate().url);
    };    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarData('avatar', file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarUpload = () => {
        if (avatarData.avatar) {
            postAvatar(avatarUpload().url, {
                onSuccess: () => {
                    setAvatarPreview(null);
                    setAvatarData('avatar', null);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }
            });
        }
    };

    const handleAvatarDelete = () => {
        deleteAvatar(avatarDelete().url);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <section className="space-y-6">
            <div className="flex items-center space-x-6">
                <div className="relative">
                    <Avatar className="h-24 w-24">
                        <AvatarImage 
                            src={avatarPreview || user.avatar_url} 
                            alt={user.name} 
                        />
                        <AvatarFallback className="text-lg">
                            {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                        onClick={triggerFileInput}
                    >
                        <Camera className="h-4 w-4" />
                        <span className="sr-only">Change avatar</span>
                    </Button>
                </div>

                <div className="flex-1 space-y-2">
                    <div className="flex space-x-2">
                        {avatarPreview && (
                            <Button
                                type="button"
                                onClick={handleAvatarUpload}
                                disabled={avatarProcessing}
                                size="sm"
                            >
                                {avatarProcessing ? 'Uploading...' : 'Upload'}
                            </Button>
                        )}
                        
                        {user.avatar_url && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleAvatarDelete}
                                disabled={deletingAvatar}
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {deletingAvatar ? 'Deleting...' : 'Delete'}
                            </Button>
                        )}
                    </div>
                    
                    {avatarErrors.avatar && (
                        <p className="text-sm text-red-600">{avatarErrors.avatar}</p>
                    )}
                    
                    <Transition
                        show={avatarRecentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-600">Avatar updated.</p>
                    </Transition>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
            />

            <form onSubmit={submit} className="space-y-6">
                <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                    />
                    {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-xs text-gray-800 dark:text-gray-200">
                            Your email address is unverified.
                            <Link
                                href={verificationSend().url}
                                method="post"
                                as="button"
                                className="rounded-md text-xs text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">
                                A new verification link has been sent to your email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <Button disabled={processing}>Save</Button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}