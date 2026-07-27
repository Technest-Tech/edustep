<?php

namespace App\Http\Controllers\Api\V1\Communication;

use App\Enums\MessageChannel;
use App\Enums\MessageStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Communication\StoreMessageRequest;
use App\Http\Resources\Api\V1\Communication\MessageResource;
use App\Models\GuardianProfile;
use App\Models\Message;
use App\Models\MessageTemplate;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class MessageController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Message::query()
            ->with(['sender:id,name', 'guardian.user:id,name', 'student:id,student_code,full_name', 'template:id,name'])
            ->when($request->string('channel')->toString(), fn ($query, string $channel) => $query->where('channel', $channel))
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('body', 'like', "%{$search}%")
                        ->orWhereHas('student', fn ($query) => $query->where('full_name', 'like', "%{$search}%"))
                        ->orWhereHas('guardian.user', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest();

        return MessageResource::collection(
            $query->paginate(min(max($request->integer('per_page', 20), 5), 100)),
        );
    }

    public function store(StoreMessageRequest $request): MessageResource
    {
        $data = $request->validated();
        $student = isset($data['student_id'])
            ? Student::query()->findOrFail($data['student_id'])
            : null;
        $guardian = isset($data['guardian_id'])
            ? GuardianProfile::query()->with('user:id,name')->findOrFail($data['guardian_id'])
            : $student?->guardians()->with('user:id,name')->orderByPivot('is_primary', 'desc')->first();

        if (! $guardian) {
            throw ValidationException::withMessages([
                'guardian_id' => 'لا يوجد ولي أمر مرتبط بهذا الطالب.',
            ]);
        }

        if ($student && ! $guardian->students()->whereKey($student->id)->exists()) {
            throw ValidationException::withMessages([
                'student_id' => 'الطالب غير مرتبط بولي الأمر المحدد.',
            ]);
        }

        $template = isset($data['message_template_id'])
            ? MessageTemplate::query()->findOrFail($data['message_template_id'])
            : null;
        $channel = isset($data['channel'])
            ? MessageChannel::from($data['channel'])
            : ($template?->channel ?? MessageChannel::Internal);
        $replacements = [
            '{{student_name}}' => $student?->full_name ?? 'الطالب',
            '{{guardian_name}}' => $guardian->user?->name ?? 'ولي الأمر',
            '{{academy_name}}' => 'EduStep English Academy',
        ];
        $body = strtr($data['body'] ?? $template?->body ?? '', $replacements);
        $subject = strtr($data['subject'] ?? $template?->subject ?? '', $replacements) ?: null;
        $isInternal = $channel === MessageChannel::Internal;

        $message = Message::query()->create([
            'sender_id' => $request->user()->id,
            'guardian_id' => $guardian->id,
            'student_id' => $student?->id,
            'message_template_id' => $template?->id,
            'channel' => $channel,
            'direction' => 'outbound',
            'subject' => $subject,
            'body' => $body,
            'status' => $isInternal ? MessageStatus::Delivered : MessageStatus::Queued,
            'scheduled_at' => $data['scheduled_at'] ?? null,
            'sent_at' => $isInternal ? now() : null,
            'delivered_at' => $isInternal ? now() : null,
            'metadata' => [
                'provider_connected' => $isInternal,
                'delivery_note' => $isInternal
                    ? 'تم التسليم داخل بوابة ولي الأمر.'
                    : 'بانتظار ربط مزود القناة الرسمي.',
            ],
        ]);

        return new MessageResource(
            $message->load(['sender:id,name', 'guardian.user:id,name', 'student:id,student_code,full_name', 'template:id,name']),
        );
    }
}
