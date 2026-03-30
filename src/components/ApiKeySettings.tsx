import { useState, useCallback } from 'react';
import {
  getReplicateApiKey,
  setReplicateApiKey,
  clearReplicateApiKey,
  testReplicateConnection,
} from '../lib/styleEngine';

export function ApiKeySettings() {
  const [key, setKey] = useState(getReplicateApiKey() ?? '');
  const [status, setStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [showKey, setShowKey] = useState(false);

  const hasKey = !!getReplicateApiKey();

  const handleSave = useCallback(() => {
    const trimmed = key.trim();
    if (trimmed) {
      setReplicateApiKey(trimmed);
      setStatus('idle');
    }
  }, [key]);

  const handleTest = useCallback(async () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    setReplicateApiKey(trimmed);
    setStatus('testing');
    const ok = await testReplicateConnection();
    setStatus(ok ? 'connected' : 'failed');
  }, [key]);

  const handleClear = useCallback(() => {
    clearReplicateApiKey();
    setKey('');
    setStatus('idle');
  }, []);

  return (
    <div className="api-key-settings">
      <div className="api-key-header">
        <h3 className="api-key-title">🎨 Style AI</h3>
        {hasKey && status !== 'failed' && (
          <span className="api-key-badge api-key-badge-active">Active</span>
        )}
        {status === 'failed' && (
          <span className="api-key-badge api-key-badge-error">Invalid Key</span>
        )}
      </div>

      <p className="api-key-description">
        Enter your{' '}
        <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer">
          Replicate API key
        </a>{' '}
        to enable AI room restyling. Your key is stored locally in your browser.
      </p>

      <div className="api-key-input-row">
        <input
          type={showKey ? 'text' : 'password'}
          className="api-key-input"
          placeholder="r8_..."
          value={key}
          onChange={e => setKey(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
          }}
        />
        <button
          className="api-key-toggle"
          onClick={() => setShowKey(!showKey)}
          title={showKey ? 'Hide key' : 'Show key'}
        >
          {showKey ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>

      <div className="api-key-actions">
        <button
          className="api-key-btn api-key-btn-test"
          onClick={handleTest}
          disabled={!key.trim() || status === 'testing'}
        >
          {status === 'testing' ? 'Testing…' : status === 'connected' ? '✓ Connected' : 'Test Connection'}
        </button>
        {hasKey && (
          <button className="api-key-btn api-key-btn-clear" onClick={handleClear}>
            Remove Key
          </button>
        )}
      </div>
    </div>
  );
}
