<?php

namespace App\Models;

use App\Enums\ServiceRequestStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'guardian_id',
    'student_id',
    'assigned_to',
    'request_number',
    'category',
    'priority',
    'status',
    'subject',
    'description',
    'resolution',
    'resolved_at',
])]
class FamilyServiceRequest extends Model
{
    use HasFactory, HasUlids;

    protected function casts(): array
    {
        return [
            'status' => ServiceRequestStatus::class,
            'resolved_at' => 'datetime',
        ];
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(GuardianProfile::class, 'guardian_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
