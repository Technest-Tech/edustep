<?php

namespace App\Http\Controllers\Api\V1\Communication;

use App\Http\Controllers\Controller;
use App\Models\MessageTemplate;
use Illuminate\Http\JsonResponse;

class MessageTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => MessageTemplate::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn (MessageTemplate $template) => [
                    'id' => $template->id,
                    'key' => $template->key,
                    'name' => $template->name,
                    'channel' => $template->channel->value,
                    'subject' => $template->subject,
                    'body' => $template->body,
                ]),
        ]);
    }
}
