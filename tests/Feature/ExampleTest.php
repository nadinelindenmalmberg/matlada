<?php

it('returns a successful response', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});

it('welcome page shows footer credit', function () {
    $response = $this->get('/');

    $response->assertOk();
    $response->assertSee('made by Filip Sjölander', escape: false);
});
