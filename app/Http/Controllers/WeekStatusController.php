<?php

namespace App\Http\Controllers;

use App\Models\Group;

use App\Models\User;
use App\Models\UserDayStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class WeekStatusController extends Controller
{
    public function index(Request $request): Response
    {
        // Auth is enforced by route middleware; no explicit policy needed here

        $weekParam = (string) $request->query('week');
        $groupParam = (string) $request->query('group');
        $now = Carbon::now();
        
        // If no week provided and it's weekend (Sat/Sun), use next ISO week
        if ($weekParam === '') {
            $isoWeekSource = in_array($now->dayOfWeekIso, [6, 7], true) ? $now->clone()->addWeek() : $now;
            $week = $isoWeekSource->isoFormat('GGGG-[W]WW');
        } else {
            $week = $weekParam;
        }

        $currentUser = $request->user();
        $currentUserId = $currentUser->id;

        // Get user's groups for the group selector
        $userGroups = $currentUser->groups()
            ->select(['groups.id', 'groups.name', 'groups.description', 'groups.code', 'groups.invite_link'])
            ->withPivot(['role'])
            ->get()
            ->map(function ($group) use ($currentUser) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'description' => $group->description,
                    'code' => $group->code,
                    'invite_link' => $group->invite_link,
                    'is_admin' => $group->pivot->role === 'admin',
                    'is_creator' => $group->created_by === $currentUser->id,
                    'invite_url' => $group->getInviteUrl(),
                    'invite_link_url' => $group->getInviteLinkUrl(),
                ];
            });

        // Get the group (if specified and user is a member)
        $group = null;
        if ($groupParam) {
            $group = Group::where('id', $groupParam)
                ->where('is_active', true)
                ->first();
            
            if ($group && !$group->isMember($currentUser)) {
                abort(403, 'You are not a member of this group.');
            }
        }

        // Get users and statuses based on privacy settings
        if ($group) {
            // Group view: show only group members
            $users = $group->users()
                ->select(['users.id', 'users.name', 'users.email', 'users.avatar'])
                ->orderByRaw('CASE WHEN users.id = ? THEN 0 ELSE 1 END', [$currentUserId])
                ->orderBy('users.name')
                ->get();
                
            // Get statuses visible to this group
            $statusQuery = UserDayStatus::query()
                ->where('iso_week', $week)
                ->where(function ($query) use ($group, $currentUserId) {
                    $query->where('group_id', $group->id)
                          ->orWhere(function ($subQuery) use ($currentUserId) {
                              // Show user's own statuses regardless of visibility
                              $subQuery->where('user_id', $currentUserId);
                          })
                          ->orWhere(function ($subQuery) use ($group) {
                              // Show statuses visible to all groups from users in this group
                              $subQuery->where('visibility', 'all_groups')
                                      ->whereIn('user_id', $group->users()->pluck('users.id'));
                          });
                });
        } else {
            // Global view: show users from all groups the current user belongs to
            $userGroupIds = $currentUser->groups()->pluck('groups.id');
            
            if ($userGroupIds->isEmpty()) {
                // User hasn't joined any groups yet - show only themselves
                $users = User::query()
                    ->where('id', $currentUserId)
                    ->select(['id', 'name', 'email', 'avatar'])
                    ->get();
                
                // Show only their own statuses (including personal statuses with group_id = null)
                $statusQuery = UserDayStatus::query()
                    ->where('iso_week', $week)
                    ->where('user_id', $currentUserId);
            } else {
                // User belongs to groups - show only group members
                $users = User::query()
                    ->whereHas('groups', function ($query) use ($userGroupIds) {
                        $query->whereIn('groups.id', $userGroupIds);
                    })
                    ->select(['id', 'name', 'email', 'avatar'])
                    ->orderByRaw('CASE WHEN id = ? THEN 0 ELSE 1 END', [$currentUserId])
                    ->orderBy('name')
                    ->get();
                    
                // Get statuses visible to group members
                $statusQuery = UserDayStatus::query()
                    ->where('iso_week', $week)
                    ->where(function ($query) use ($currentUserId, $userGroupIds) {
                        $query->where('user_id', $currentUserId) // User's own statuses
                              ->orWhere(function ($subQuery) use ($userGroupIds) {
                                  // Statuses visible to all groups from users in the same groups
                                  $subQuery->where('visibility', 'all_groups')
                                          ->whereIn('group_id', $userGroupIds);
                              })
                              ->orWhere(function ($subQuery) use ($userGroupIds) {
                                  // Statuses from groups the user belongs to
                                  $subQuery->whereIn('group_id', $userGroupIds)
                                          ->where('visibility', 'group_only');
                              });
                    });
            }
        }
        
        $statuses = $statusQuery->get()->groupBy('user_id');

        return Inertia::render('week-status/index', [
            'week' => $week,
            'group' => $group ? [
                'id' => $group->id,
                'name' => $group->name,
                'code' => $group->code,
            ] : null,
            'groups' => $userGroups,
            'activeWeekday' => $now->dayOfWeekIso >= 1 && $now->dayOfWeekIso <= 5 ? $now->dayOfWeekIso : 1,
            'users' => $users,
            'statuses' => $statuses,
            'canEditUserId' => (int) $currentUserId,
        ]);
    }

    public function upsert(Request $request): RedirectResponse
    {
        $request->validate([
            'iso_week' => ['required', 'string', 'regex:/^\\d{4}-W\\d{2}$/'],
            'weekday' => ['required', 'integer', 'between:1,5'],
            'status' => ['nullable', 'in:Lunchbox,Buying,Home,Away'],
            'arrival_time' => ['nullable', 'date_format:H:i'],
            'location' => ['nullable', 'string', 'max:120'],
            'group_id' => ['nullable', 'integer', 'exists:groups,id'],
            'start_location' => ['nullable', 'string', 'max:120'],
            'eat_location' => ['nullable', 'string', 'max:120'],
            'note' => ['nullable', 'string'],
            'visibility' => ['nullable', 'in:group_only,all_groups'],
        ]);

        $userId = (int) $request->user()->id;
        $group = null;

        // Validate group access if group_id is provided
        if ($request->has('group_id')) {
            $group = Group::find($request->group_id);
            if ($group && !$group->isMember($request->user())) {
                abort(403, 'You are not a member of this group.');
            }
        }

        // Handle visibility logic
        $visibility = $request->input('visibility', 'group_only');
        $groupId = $request->input('group_id');
        $userGroups = $request->user()->groups;
        
        // Handle users with no groups - create personal status
        if ($userGroups->isEmpty()) {
            $this->createOrUpdateStatus($request, $userId, null, 'group_only');
        } else if ($visibility === 'all_groups') {
            // Create status for all user's groups
            foreach ($userGroups as $userGroup) {
                $this->createOrUpdateStatus($request, $userId, $userGroup->id, $visibility);
            }
        } else {
            // Single group - validate that group_id is provided
            if (!$groupId) {
                abort(400, 'Group ID is required for group_only visibility.');
            }
            $this->createOrUpdateStatus($request, $userId, $groupId, $visibility);
        }

        return back();
    }

    private function createOrUpdateStatus(Request $request, int $userId, ?int $groupId, string $visibility): void
    {
        // Build only provided attributes to avoid nulling other fields on partial updates
        $providedAttributes = [];
        foreach (['status', 'arrival_time', 'location', 'start_location', 'eat_location', 'note'] as $attribute) {
            if ($request->exists($attribute)) {
                $providedAttributes[$attribute] = $request->input($attribute);
            }
        }
        
        $providedAttributes['visibility'] = $visibility;

        UserDayStatus::updateOrCreate(
            [
                'user_id' => $userId,
                'group_id' => $groupId,
                'iso_week' => $request->string('iso_week')->toString(),
                'weekday' => (int) $request->integer('weekday'),
            ],
            $providedAttributes
        );
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'iso_week' => ['required', 'string', 'regex:/^\\d{4}-W\\d{2}$/'],
            'weekday' => ['required', 'integer', 'between:1,5'],
            'group_id' => ['nullable', 'integer', 'exists:groups,id'],
        ]);

        $userId = (int) $request->user()->id;

        // Validate group access if group_id is provided
        if ($request->has('group_id')) {
            $group = Group::find($request->group_id);
            if ($group && !$group->isMember($request->user())) {
                abort(403, 'You are not a member of this group.');
            }
        }

        UserDayStatus::query()
            ->where('user_id', $userId)
            ->where('group_id', $request->input('group_id'))
            ->where('iso_week', $request->string('iso_week')->toString())
            ->where('weekday', (int) $request->integer('weekday'))
            ->delete();

        return back();
    }
}
