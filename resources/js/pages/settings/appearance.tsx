import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editAppearance } from '@/routes/appearance';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useI18n } from '@/lib/i18n';

export default function Appearance() {
    const { t } = useI18n();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('Appearance settings', 'Appearance settings'),
            href: editAppearance().url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('Appearance settings', 'Appearance settings')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title={t('Appearance settings', 'Appearance settings')} description={t('Update your account\'s appearance settings', 'Update your account\'s appearance settings')} />
                    <AppearanceTabs />
                    <LocaleSwitcher />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
