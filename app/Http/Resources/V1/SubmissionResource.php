<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubmissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'form_id'      => $this->form_id,
            'form_title'   => $this->whenLoaded('form', fn () => $this->form->title),
            'form_ulid'    => $this->whenLoaded('form', fn () => $this->form->ulid),
            'data'         => $this->data,
            'metadata'     => $this->metadata,
            'submitted_at' => $this->submitted_at->toISOString(),
        ];
    }
}
