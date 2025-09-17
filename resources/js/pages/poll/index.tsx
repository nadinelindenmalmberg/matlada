import { Head, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, CheckCircle, XCircle } from 'lucide-react'
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types'
import { useI18n } from '@/lib/i18n'

interface PollOption {
    id: number
    name: string
    description: string
    vote_count: number
}

interface Poll {
    id: number
    poll_date: string
    deadline: string
    is_active: boolean
    options: PollOption[]
}

interface UserVote {
    id: number
    poll_option_id: number
    pollOption: PollOption
}

interface Props {
    poll: Poll
    userVote: UserVote | null
    isVotingOpen: boolean
    timeUntilDeadline: string | null
}

export default function PollIndex({ poll, userVote, isVotingOpen, timeUntilDeadline }: Props) {
    const { post, processing } = useForm()

    const handleVote = (optionId: number) => {
        post(route('poll.vote').url, {
            poll_option_id: optionId,
        })
    }
    const buildBreadcrumbs = (t: (key: string, fallback?: string) => string): BreadcrumbItem[] => {
        return [
            { title: t('Lunch Poll'), href: '/poll' },
        ];
    }
    const totalVotes = poll.options.reduce((sum, option) => sum + option.vote_count, 0)
    const { t } = useI18n();
    const breadcrumbs = buildBreadcrumbs(t);
    return (
        <AppLayout breadcrumbs={breadcrumbs} >
            <Head title="Lunch Poll" />

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Where should we have lunch today?
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Vote for your preferred lunch location. Voting closes at 11:00 AM.
                    </p>
                </div>

                {/* Voting Status */}
                <div className="mb-6">
                    {isVotingOpen ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Voting is open! {timeUntilDeadline && `Closes ${timeUntilDeadline}`}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Voting has closed for today
                            </span>
                        </div>
                    )}
                </div>

                {/* Poll Options */}
                <div className="grid gap-4 md:grid-cols-2">
                    {poll.options.map((option) => {
                        const percentage = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0
                        const isUserVote = userVote?.poll_option_id === option.id
                        const isWinning = poll.options.length > 0 && option.vote_count === Math.max(...poll.options.map(o => o.vote_count)) && option.vote_count > 0

                        return (
                            <Card
                                key={option.id}
                                className={`relative transition-all duration-200 hover:shadow-lg ${isUserVote ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                                    } ${isWinning ? 'ring-2 ring-green-500 dark:ring-green-400' : ''}`}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {option.name}
                                                {isUserVote && (
                                                    <CheckCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                                )}
                                                {isWinning && !isUserVote && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Leading
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {option.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    {/* Vote Count and Percentage */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Users className="h-4 w-4" />
                                            <span>{option.vote_count} vote{option.vote_count !== 1 ? 's' : ''}</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {percentage}%
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${isWinning ? 'bg-green-500' : 'bg-blue-500'
                                                }`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>

                                    {/* Vote Button */}
                                    {isVotingOpen && (
                                        <Button
                                            onClick={() => handleVote(option.id)}
                                            disabled={processing}
                                            variant={isUserVote ? "outline" : "default"}
                                            className="w-full"
                                        >
                                            {processing ? (
                                                'Voting...'
                                            ) : isUserVote ? (
                                                'Change Vote'
                                            ) : (
                                                'Vote for this option'
                                            )}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Results Summary */}
                {!isVotingOpen && totalVotes > 0 && (
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle className="text-xl">Final Results</CardTitle>
                            <CardDescription>
                                The poll has closed. Here are the final results:
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {poll.options
                                    .sort((a, b) => b.vote_count - a.vote_count)
                                    .map((option, index) => {
                                        const percentage = Math.round((option.vote_count / totalVotes) * 100)
                                        return (
                                            <div key={option.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-bold text-gray-500 dark:text-gray-400">
                                                        #{index + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium">{option.name}</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {option.vote_count} vote{option.vote_count !== 1 ? 's' : ''} ({percentage}%)
                                                        </p>
                                                    </div>
                                                </div>
                                                {index === 0 && option.vote_count > 0 && (
                                                    <Badge className="bg-green-500 text-white">
                                                        Winner!
                                                    </Badge>
                                                )}
                                            </div>
                                        )
                                    })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* No Votes Message */}
                {!isVotingOpen && totalVotes === 0 && (
                    <Card className="mt-8">
                        <CardContent className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No votes were cast today
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Voting has closed and no one participated in today's poll.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    )
}
function route(arg0: string) {
    throw new Error('Function not implemented.')
}
