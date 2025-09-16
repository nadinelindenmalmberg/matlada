import { usePage } from '@inertiajs/react'

type Messages = Record<string, string>

export function useI18n() {
    const page = usePage<{ locale: string; messages: Record<'en' | 'sv', Messages> }>()
    const currentLocale = page.props.locale as 'en' | 'sv'
    const allMessages = page.props.messages
    const messages: Messages = allMessages?.[currentLocale] ?? {}

    function t(key: string, fallback?: string): string {
        return messages[key] ?? fallback ?? key
    }

    return { t, locale: currentLocale }
}
