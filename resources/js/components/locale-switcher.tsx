import { router } from '@inertiajs/react'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Globe } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface LocaleSwitcherProps {
    label?: string
    iconOnly?: boolean
}

export function LocaleSwitcher({ label, iconOnly = false }: LocaleSwitcherProps) {
    const current = (typeof document !== 'undefined' ? document.documentElement.lang : 'en') || 'en'
    const [value, setValue] = useState<string>(current)
    const { t } = useI18n()

    const submit = (locale: string): void => {
        router.post('/locale', { locale }, { preserveScroll: true, preserveState: true })
    }

    return (
        <div className="flex items-center gap-2">
            {!iconOnly && label && <span className="text-sm">{label}</span>}
            <Select
                defaultValue={value}
                onValueChange={(v) => {
                    setValue(v)
                    submit(v)
                }}
            >
                <SelectTrigger
                    className={
                        iconOnly
                            ? 'h-9 w-9 justify-center rounded-md px-0 border-0 bg-transparent text-[#1b1b18] hover:bg-[#19140035] hover:text-[#1b1b18] dark:text-[#EDEDEC] dark:hover:bg-[#3E3E3A] dark:hover:text-[#EDEDEC] shadow-none focus:outline-none focus-visible:ring-0 focus-visible:border-transparent'
                            : 'h-8 text-[#1b1b18] dark:text-[#EDEDEC]'
                    }
                    hideIndicator={iconOnly}
                    aria-label={t('Change language', 'Change language')}
                >
                    {iconOnly ? (
                        <Globe className="h-5 w-5 text-current" />
                    ) : (
                        <SelectValue placeholder={t('Select language', 'Select language')} />
                    )}
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sv">Svenska</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
