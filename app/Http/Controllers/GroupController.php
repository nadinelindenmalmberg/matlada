<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class GroupController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        
        $groups = $user->groups()
            ->with(['creator', 'users' => function ($query) {
                $query->select('users.id', 'users.name', 'users.avatar')
                    ->orderBy('users.name');
            }])
            ->withCount('users')
            ->get()
            ->map(function ($group) use ($user) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'description' => $group->description,
                    'code' => $group->code,
                    'invite_link' => $group->invite_link,
                    'is_admin' => $group->isAdmin($user),
                    'is_creator' => $group->created_by === $user->id,
                    'member_count' => $group->users_count,
                    'created_at' => $group->created_at,
                    'invite_url' => $group->getInviteUrl(),
                    'invite_link_url' => $group->getInviteLinkUrl(),
                ];
            });

        return Inertia::render('groups/index', [
            'groups' => $groups,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('groups/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $group = Group::create([
            'name' => $request->name,
            'description' => $request->description,
            'created_by' => Auth::id(),
        ]);

        // Add creator as admin
        $group->addUser(Auth::user(), 'admin');

        return redirect()->route('groups.show', $group)
            ->with('success', 'Group created successfully!');
    }

    public function show(Group $group): Response
    {
        $user = Auth::user();
        
        if (!$group->isMember($user)) {
            abort(403, 'You are not a member of this group.');
        }

        $group->load([
            'users' => function ($query) {
                $query->select('users.id', 'users.name', 'users.avatar')
                    ->orderBy('users.name');
            },
            'creator' => function ($query) {
                $query->select('id', 'name', 'avatar');
            }
        ]);

        return Inertia::render('groups/show', [
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
                'description' => $group->description,
                'code' => $group->code,
                'invite_link' => $group->invite_link,
                'is_admin' => $group->isAdmin($user),
                'is_creator' => $group->created_by === $user->id,
                'created_at' => $group->created_at,
                'invite_url' => $group->getInviteUrl(),
                'invite_link_url' => $group->getInviteLinkUrl(),
                'users' => $group->users->map(function ($user) use ($group) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'avatar' => $user->avatar_url,
                        'role' => $user->pivot->role,
                        'joined_at' => $user->pivot->joined_at,
                        'is_admin' => $user->pivot->role === 'admin',
                    ];
                }),
                'creator' => [
                    'id' => $group->creator->id,
                    'name' => $group->creator->name,
                    'avatar' => $group->creator->avatar_url,
                ],
            ],
        ]);
    }

    public function join(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $group = Group::where('code', strtoupper($request->code))
            ->where('is_active', true)
            ->first();

        if (!$group) {
            return back()->withErrors(['code' => 'Invalid group code.']);
        }

        $user = Auth::user();

        if ($group->isMember($user)) {
            return back()->withErrors(['code' => 'You are already a member of this group.']);
        }

        $group->addUser($user, 'member');

        return redirect()->route('groups.show', $group)
            ->with('success', 'Successfully joined the group!');
    }

    public function joinByLink(string $link): RedirectResponse
    {
        $group = Group::where('invite_link', $link)
            ->where('is_active', true)
            ->first();

        if (!$group) {
            return redirect()->route('groups.index')
                ->withErrors(['error' => 'Invalid invite link.']);
        }

        $user = Auth::user();

        if ($group->isMember($user)) {
            return redirect()->route('groups.show', $group)
                ->with('info', 'You are already a member of this group.');
        }

        $group->addUser($user, 'member');

        return redirect()->route('groups.show', $group)
            ->with('success', 'Successfully joined the group!');
    }

    public function leave(Group $group): RedirectResponse
    {
        $user = Auth::user();

        if (!$group->isMember($user)) {
            abort(403, 'You are not a member of this group.');
        }

        if ($group->created_by === $user->id) {
            return back()->withErrors(['error' => 'Group creators cannot leave their groups. Transfer ownership or delete the group instead.']);
        }

        $group->removeUser($user);

        return redirect()->route('groups.index')
            ->with('success', 'You have left the group.');
    }

    public function removeMember(Request $request, Group $group): RedirectResponse
    {
        $user = Auth::user();

        if (!$group->isAdmin($user)) {
            abort(403, 'You are not authorized to remove members.');
        }

        $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $memberToRemove = User::findOrFail($request->user_id);

        if ($group->created_by === $memberToRemove->id) {
            return back()->withErrors(['error' => 'Cannot remove the group creator.']);
        }

        if (!$group->isMember($memberToRemove)) {
            return back()->withErrors(['error' => 'User is not a member of this group.']);
        }

        $group->removeUser($memberToRemove);

        return back()->with('success', 'Member removed successfully.');
    }

    public function updateMemberRole(Request $request, Group $group): RedirectResponse
    {
        $user = Auth::user();

        if (!$group->isAdmin($user)) {
            abort(403, 'You are not authorized to change member roles.');
        }

        $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'role' => ['required', Rule::in(['admin', 'member'])],
        ]);

        $member = User::findOrFail($request->user_id);

        if ($group->created_by === $member->id) {
            return back()->withErrors(['error' => 'Cannot change the group creator\'s role.']);
        }

        if (!$group->isMember($member)) {
            return back()->withErrors(['error' => 'User is not a member of this group.']);
        }

        $group->users()->updateExistingPivot($member->id, [
            'role' => $request->role,
        ]);

        return back()->with('success', 'Member role updated successfully.');
    }

    public function destroy(Group $group): RedirectResponse
    {
        $user = Auth::user();

        if ($group->created_by !== $user->id) {
            abort(403, 'Only the group creator can delete the group.');
        }

        DB::transaction(function () use ($group) {
            // Remove all day statuses for this group
            $group->userDayStatuses()->delete();
            
            // Remove all group memberships
            $group->users()->detach();
            
            // Delete the group
            $group->delete();
        });

        return redirect()->route('groups.index')
            ->with('success', 'Group deleted successfully.');
    }
}