<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserDayStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AlignmentController extends Controller
{
    public function index(Request $request): Response
    {
        $weekParam = (string) $request->query('week');
        $now = Carbon::now();
        if ($weekParam === '') {
            $isoWeekSource = in_array($now->dayOfWeekIso, [6, 7], true) ? $now->clone()->addWeek() : $now;
            $week = $isoWeekSource->isoFormat('GGGG-[W]WW');
        } else {
            $week = $weekParam;
        }

        $users = User::query()
            ->select(['id', 'name', 'email', 'avatar'])
            ->orderBy('name')
            ->get();

        $statuses = UserDayStatus::query()
            ->where('iso_week', $week)
            ->get();

        return Inertia::render('alignment/index', [
            'week' => $week,
            'activeWeekday' => $now->dayOfWeekIso >= 1 && $now->dayOfWeekIso <= 5 ? $now->dayOfWeekIso : 1,
            'users' => $users,
            'statuses' => $statuses,
        ]);
    }
}
