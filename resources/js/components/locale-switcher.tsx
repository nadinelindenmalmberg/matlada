import { router } from '@inertiajs/react'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface LocaleSwitcherProps {
    label?: string
}

export function LocaleSwitcher({ label }: LocaleSwitcherProps) {
    const current = (typeof document !== 'undefined' ? document.documentElement.lang : 'en') || 'en'
    const [value, setValue] = useState<string>(current)

    const submit = (locale: string): void => {
        router.post('/locale', { locale }, { preserveScroll: true, preserveState: true })
    }

    return (
        <div className="flex items-center gap-2">
            {label && <span className="text-sm text-neutral-600 dark:text-neutral-300">{label}</span>}
            <Select
                defaultValue={value}
                onValueChange={(v) => {
                    setValue(v)
                    submit(v)
                }}
            >
                <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sv">Svenska</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
