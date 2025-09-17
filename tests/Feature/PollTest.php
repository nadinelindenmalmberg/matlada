<?php

use App\Models\Poll;
use App\Models\PollOption;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

it('displays poll page with today\'s poll', function () {
    $poll = Poll::factory()->create([
        'poll_date' => now()->addDay()->toDateString(),
    ]);

    $options = PollOption::factory()->count(3)->create([
        'poll_id' => $poll->id,
    ]);

    $response = $this->get(route('poll.index'));

    $response->assertSuccessful();
    $response->assertInertia(
        fn($page) => $page->component('poll/index')
            ->has('poll')
            ->has('isVotingOpen')
    );
});

it('creates new poll for today if none exists', function () {
    $response = $this->get(route('poll.index'));

    $response->assertSuccessful();

    $this->assertDatabaseCount('polls', 1);

    $this->assertDatabaseCount('poll_options', 5); // Default options
});

it('allows user to vote for a poll option', function () {
    $poll = Poll::factory()->create([
        'poll_date' => now()->addDays(2)->toDateString(),
    ]);

    $option = PollOption::factory()->create([
        'poll_id' => $poll->id,
        'vote_count' => 0,
    ]);

    $response = $this->post(route('poll.vote'), [
        'poll_option_id' => $option->id,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Your vote has been recorded!');

    $this->assertDatabaseHas('votes', [
        'user_id' => $this->user->id,
        'poll_id' => $poll->id,
        'poll_option_id' => $option->id,
    ]);

    $this->assertDatabaseHas('poll_options', [
        'id' => $option->id,
        'vote_count' => 1,
    ]);
});

it('allows user to change their vote', function () {
    $poll = Poll::factory()->create([
        'poll_date' => now()->addDays(3)->toDateString(),
    ]);

    $firstOption = PollOption::factory()->create([
        'poll_id' => $poll->id,
        'vote_count' => 1,
    ]);

    $secondOption = PollOption::factory()->create([
        'poll_id' => $poll->id,
        'vote_count' => 0,
    ]);

    // Create existing vote
    Vote::create([
        'user_id' => $this->user->id,
        'poll_id' => $poll->id,
        'poll_option_id' => $firstOption->id,
    ]);

    $response = $this->post(route('poll.vote'), [
        'poll_option_id' => $secondOption->id,
    ]);

    $response->assertRedirect();

    // Check that old vote is removed and new vote is created
    $this->assertDatabaseMissing('votes', [
        'user_id' => $this->user->id,
        'poll_option_id' => $firstOption->id,
    ]);

    $this->assertDatabaseHas('votes', [
        'user_id' => $this->user->id,
        'poll_option_id' => $secondOption->id,
    ]);

    // Check vote counts are updated
    $this->assertDatabaseHas('poll_options', [
        'id' => $firstOption->id,
        'vote_count' => 0,
    ]);

    $this->assertDatabaseHas('poll_options', [
        'id' => $secondOption->id,
        'vote_count' => 1,
    ]);
});

it('prevents voting after deadline', function () {
    $poll = Poll::factory()->withDeadlinePassed()->create([
        'poll_date' => now()->subDay()->toDateString(),
    ]);

    $option = PollOption::factory()->create([
        'poll_id' => $poll->id,
    ]);

    $response = $this->post(route('poll.vote'), [
        'poll_option_id' => $option->id,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors(['voting']);

    $this->assertDatabaseMissing('votes', [
        'user_id' => $this->user->id,
        'poll_id' => $poll->id,
    ]);
});

it('prevents voting on inactive poll', function () {
    $poll = Poll::factory()->closed()->create([
        'poll_date' => now()->addDays(4)->toDateString(),
    ]);

    $option = PollOption::factory()->create([
        'poll_id' => $poll->id,
    ]);

    $response = $this->post(route('poll.vote'), [
        'poll_option_id' => $option->id,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors(['voting']);
});

it('validates poll option exists', function () {
    $response = $this->post(route('poll.vote'), [
        'poll_option_id' => 999,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors(['poll_option_id']);
});

it('shows user their current vote', function () {
    // First, create a poll for today
    $poll = Poll::factory()->create([
        'poll_date' => now()->toDateString(),
    ]);

    $option = PollOption::factory()->create([
        'poll_id' => $poll->id,
    ]);

    Vote::create([
        'user_id' => $this->user->id,
        'poll_id' => $poll->id,
        'poll_option_id' => $option->id,
    ]);

    $response = $this->get(route('poll.index'));

    $response->assertSuccessful();
    $response->assertInertia(
        fn($page) => $page->component('poll/index')
            ->has('userVote')
            ->where('userVote.poll_option_id', $option->id)
    );
});

it('shows poll results when voting is closed', function () {
    $poll = Poll::factory()->withDeadlinePassed()->create([
        'poll_date' => now()->subDay()->toDateString(),
    ]);

    $option1 = PollOption::factory()->create([
        'poll_id' => $poll->id,
        'vote_count' => 5,
    ]);

    $option2 = PollOption::factory()->create([
        'poll_id' => $poll->id,
        'vote_count' => 3,
    ]);

    $response = $this->get(route('poll.index'));

    $response->assertSuccessful();
    $response->assertInertia(
        fn($page) => $page->component('poll/index')
            ->where('isVotingOpen', false)
    );
});
