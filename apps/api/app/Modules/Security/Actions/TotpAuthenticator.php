<?php

namespace App\Modules\Security\Actions;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use InvalidArgumentException;

class TotpAuthenticator
{
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public function generateSecret(): string
    {
        return $this->base32Encode(random_bytes(20));
    }

    public function provisioningUri(User $user, string $secret): string
    {
        $issuer = config('security.two_factor.issuer');
        $label = rawurlencode($issuer.':'.$user->email);

        return sprintf(
            'otpauth://totp/%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30',
            $label,
            $secret,
            rawurlencode($issuer),
        );
    }

    public function verify(string $secret, string $code, ?int $timestamp = null): ?int
    {
        $normalizedCode = preg_replace('/\D/', '', $code);

        if (! is_string($normalizedCode) || strlen($normalizedCode) !== 6) {
            return null;
        }

        $counter = intdiv($timestamp ?? time(), 30);

        foreach ([-1, 0, 1] as $offset) {
            $step = $counter + $offset;

            if ($step >= 0 && hash_equals($this->codeForStep($secret, $step), $normalizedCode)) {
                return $step;
            }
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    public function generateRecoveryCodes(): array
    {
        return collect(range(1, config('security.two_factor.recovery_code_count')))
            ->map(function (): string {
                $raw = Str::upper(Str::random(12));

                return implode('-', str_split($raw, 4));
            })
            ->all();
    }

    /**
     * @param  array<int, string>  $codes
     * @return array<int, string>
     */
    public function hashRecoveryCodes(array $codes): array
    {
        return collect($codes)
            ->map(fn (string $code) => Hash::make($this->normalizeRecoveryCode($code)))
            ->all();
    }

    public function consumeRecoveryCode(User $user, string $candidate): bool
    {
        $normalized = $this->normalizeRecoveryCode($candidate);
        $codes = $user->two_factor_recovery_codes ?? [];
        $matchedIndex = collect($codes)->search(
            fn (string $hash) => Hash::check($normalized, $hash),
        );

        if ($matchedIndex === false) {
            return false;
        }

        unset($codes[$matchedIndex]);
        $user->forceFill([
            'two_factor_recovery_codes' => array_values($codes),
        ])->save();

        return true;
    }

    private function codeForStep(string $secret, int $counter): string
    {
        $key = $this->base32Decode($secret);
        $binaryCounter = pack(
            'N2',
            intdiv($counter, 4_294_967_296),
            $counter % 4_294_967_296,
        );
        $hash = hash_hmac('sha1', $binaryCounter, $key, true);
        $offset = ord($hash[19]) & 0x0F;
        $value = unpack('N', substr($hash, $offset, 4))[1] & 0x7FFFFFFF;

        return str_pad((string) ($value % 1_000_000), 6, '0', STR_PAD_LEFT);
    }

    private function base32Encode(string $value): string
    {
        $bits = '';

        foreach (unpack('C*', $value) as $byte) {
            $bits .= str_pad(decbin($byte), 8, '0', STR_PAD_LEFT);
        }

        $encoded = '';

        foreach (str_split($bits, 5) as $chunk) {
            $encoded .= self::ALPHABET[bindec(str_pad($chunk, 5, '0'))];
        }

        return $encoded;
    }

    private function base32Decode(string $value): string
    {
        $value = Str::upper(str_replace([' ', '='], '', $value));
        $bits = '';

        foreach (str_split($value) as $character) {
            $position = strpos(self::ALPHABET, $character);

            if ($position === false) {
                throw new InvalidArgumentException('The two-factor secret is not valid Base32.');
            }

            $bits .= str_pad(decbin($position), 5, '0', STR_PAD_LEFT);
        }

        $decoded = '';

        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) === 8) {
                $decoded .= chr(bindec($byte));
            }
        }

        return $decoded;
    }

    private function normalizeRecoveryCode(string $code): string
    {
        return Str::upper(preg_replace('/[^A-Z0-9]/i', '', $code) ?? '');
    }
}
