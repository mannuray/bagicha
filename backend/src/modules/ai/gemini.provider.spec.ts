import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { UpstreamError } from '../../common/errors';
import { Metrics } from '../../common/observability';
import { GeminiClientFactory, GeminiProvider } from './gemini.provider';

function build(
  env: Record<string, string | undefined>,
  responseText = '{"ok":true}',
) {
  const generateContent = jest.fn(() =>
    Promise.resolve({ response: { text: () => responseText } }),
  );
  const getGenerativeModel = jest.fn(() => ({ generateContent }));
  const factory: GeminiClientFactory = jest.fn(
    () => ({ getGenerativeModel }) as any,
  );
  const metrics = { aiCall: jest.fn() };
  const config = { get: (k: string) => env[k] } as unknown as ConfigService;
  const logger = { warn: jest.fn(), error: jest.fn() } as unknown as PinoLogger;
  const provider = new GeminiProvider(
    config,
    metrics as unknown as Metrics,
    factory,
    logger,
  );
  return { provider, factory, generateContent, getGenerativeModel, metrics };
}

describe('GeminiProvider', () => {
  it('fails with AI_NOT_CONFIGURED and never builds a client when the key is missing', async () => {
    const { provider, factory, metrics } = build({ GEMINI_MODEL: 'm' });
    await expect(
      provider.generateJson({ feature: 'diagnose', prompt: 'p' }),
    ).rejects.toMatchObject({ reason: 'AI_NOT_CONFIGURED' });
    expect(factory).not.toHaveBeenCalled();
    expect(metrics.aiCall).toHaveBeenCalledWith('diagnose', 'not_configured');
  });

  it('fails with AI_NOT_CONFIGURED when the model is missing', async () => {
    const { provider } = build({ GEMINI_API_KEY: 'k' });
    await expect(
      provider.generateJson({ feature: 'identify', prompt: 'p' }),
    ).rejects.toBeInstanceOf(UpstreamError);
  });

  it('does not build the client in the constructor', () => {
    const { factory } = build({ GEMINI_API_KEY: 'k', GEMINI_MODEL: 'm' });
    expect(factory).not.toHaveBeenCalled();
  });

  it('returns the parsed object from a prose-wrapped answer and records ok', async () => {
    const { provider, getGenerativeModel, metrics, generateContent } = build(
      { GEMINI_API_KEY: 'k', GEMINI_MODEL: 'gemini-test' },
      'Sure! {"primary_issue":"PEST"} done',
    );
    const result = await provider.generateJson({
      feature: 'diagnose',
      prompt: 'p',
      image: { data: 'abc', mimeType: 'image/jpeg' },
    });
    expect(result).toEqual({ primary_issue: 'PEST' });
    expect(getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-test' });
    expect(generateContent).toHaveBeenCalledWith([
      'p',
      { inlineData: { data: 'abc', mimeType: 'image/jpeg' } },
    ]);
    expect(metrics.aiCall).toHaveBeenCalledWith('diagnose', 'ok');
  });

  it('records invalid_response and throws AI_RESPONSE_INVALID on unusable output', async () => {
    const { provider, metrics } = build(
      { GEMINI_API_KEY: 'k', GEMINI_MODEL: 'm' },
      'I cannot help with that.',
    );
    await expect(
      provider.generateJson({ feature: 'ask_ai', prompt: 'p' }),
    ).rejects.toMatchObject({ reason: 'AI_RESPONSE_INVALID' });
    expect(metrics.aiCall).toHaveBeenCalledWith('ask_ai', 'invalid_response');
  });

  it('wraps provider failures as AI_PROVIDER_ERROR', async () => {
    const { provider, generateContent, metrics } = build({
      GEMINI_API_KEY: 'k',
      GEMINI_MODEL: 'm',
    });
    generateContent.mockImplementationOnce(() =>
      Promise.reject(new Error('quota exceeded')),
    );
    await expect(
      provider.generateJson({ feature: 'diagnose', prompt: 'p' }),
    ).rejects.toMatchObject({ reason: 'AI_PROVIDER_ERROR' });
    expect(metrics.aiCall).toHaveBeenCalledWith('diagnose', 'error');
  });
});
