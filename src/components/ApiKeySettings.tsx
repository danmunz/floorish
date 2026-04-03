import { useState, useCallback, useEffect } from 'react';
import {
  getReplicateApiKey,
  saveReplicateApiKey,
  removeReplicateApiKey,
  loadReplicateApiKeyFromProfile,
  testReplicateConnection,
} from '../lib/styleEngine';
import { useAuth } from '../hooks/useAuth';

export function ApiKeySettings() {
  const { user, isGuest } = useAuth();
  const [key, setKey] = useState(getReplicateApiKey() ?? '');
  const [status, setStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [showKey, setShowKey] = useState(false);

  const hasKey = !!getReplicateApiKey();

  // Load key from profile on mount for authenticated users
  useEffect(() => {
    if (!user || isGuest) return;
    loadReplicateApiKeyFromProfile(user.id).then((loaded) => {
      if (loaded) setKey(loaded);
    });
  }, [user, isGuest]);

  const handleSave = useCallback(() => {
    const trimmed = key.trim();
    if (trimmed) {
      void saveReplicateApiKey(trimmed, user?.id);
      setStatus('idle');
    }
  }, [key, user]);

  const handleTest = useCallback(async () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    await saveReplicateApiKey(trimmed, user?.id);
    setStatus('testing');
    const ok = await testReplicateConnection();
    setStatus(ok ? 'connected' : 'failed');
  }, [key, user]);

  const handleClear = useCallback(() => {
    void removeReplicateApiKey(user?.id);
    setKey('');
    setStatus('idle');
  }, [user]);

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
        to enable AI room restyling. Your key is saved to your account and syncs across devices.
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
