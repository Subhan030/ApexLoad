import { useCallback } from 'react';
import { useTestStore } from '../store/testStore';
import type { UseFormSetValue } from 'react-hook-form';

const API_BASE = 'http://localhost:3000';

export function useNLBuilder(setValue: UseFormSetValue<any>) {
    const { setNlParsing, setNlError } = useTestStore();

    const parseIntent = useCallback(async (prompt: string) => {
        if (!prompt.trim() || prompt.trim().length < 5) {
            setNlError('Please describe your test in at least 5 characters');
            return;
        }

        setNlParsing(true);
        setNlError(null);

        try {
            const res = await fetch(`${API_BASE}/ai/parse-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Parsing failed');
            }

            const { parsed } = await res.json();

            // Apply each parsed field to the form — only if Claude is confident
            if (parsed.confidence >= 0.5) {
                if (parsed.url) setValue('url', parsed.url, { shouldValidate: true });
                if (parsed.method) setValue('method', parsed.method);
                if (parsed.name) setValue('name', parsed.name);
                if (parsed.concurrency) setValue('concurrency', parsed.concurrency);
                if (parsed.totalRequests) setValue('totalRequests', parsed.totalRequests);
                if (parsed.rampUpSeconds !== undefined) setValue('rampUpSeconds', parsed.rampUpSeconds);
                if (parsed.timeoutMs) setValue('timeoutMs', parsed.timeoutMs);
                if (parsed.thinkTimeMs !== undefined) setValue('thinkTimeMs', parsed.thinkTimeMs);
                if (parsed.body) setValue('body', parsed.body);
                if (parsed.headers) setValue('headers', JSON.stringify(parsed.headers, null, 2));
            } else {
                setNlError(`Low confidence (${Math.round(parsed.confidence * 100)}%) — please be more specific about the URL and parameters`);
            }

            return parsed;
        } catch (err: any) {
            setNlError(err.message);
        } finally {
            setNlParsing(false);
        }
    }, [setValue, setNlParsing, setNlError]);

    return { parseIntent };
}
