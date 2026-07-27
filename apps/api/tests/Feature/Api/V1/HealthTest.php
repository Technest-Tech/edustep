<?php

namespace Tests\Feature\Api\V1;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_the_api_health_endpoint_returns_the_standard_envelope(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response
            ->assertOk()
            ->assertHeader('X-Request-Id')
            ->assertHeader('X-Response-Time-Ms')
            ->assertJsonPath('data.service', 'edustep-api')
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath('data.version', 'v1')
            ->assertJsonStructure([
                'data' => ['service', 'status', 'version', 'time'],
                'meta' => ['request_id'],
            ]);
    }
}
