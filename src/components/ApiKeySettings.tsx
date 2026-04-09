import { useState, useCallback, useEffect } from 'react';
import {
  getReplicateApiKey,
  saveReplicateApiKey,
  removeReplicateApiKey,
  loadReplicateApiKeyFromProfile,
  testReplicateConnection,
} from '../lib/styleEngine';
import { useAuth } from '../hooks/useAuth';

interface ApiKeySettingsProps {
  onKeyChange?: (hasKey: boolean) => void;
}

export function ApiKeySettings({ onKeyChange }: ApiKeySettingsProps) {
  const { user, isGuest } = useAuth();
  const [key, setKey] = useState(getReplicateApiKey() ?? '');
  const [status, setStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [showKey, setShowKey] = useState(false);

  const hasKey = !!getReplicateApiKey();

  // Load key from profile on mount for authenticated users
  useEffect(() => {
    if (!user || isGuest) return;
    loadReplicateApiKeyFromProfile(user.id).then((loaded) => {
      if (loaded) {
        setKey(loaded);
        onKeyChange?.(true);
      }
    });
  }, [user, isGuest, onKeyChange]);

  const handleSave = useCallback(() => {
    const trimmed = key.trim();
    if (trimmed) {
      void saveReplicateApiKey(trimmed, user?.id);
      setStatus('idle');
      onKeyChange?.(true);
    }
  }, [key, user, onKeyChange]);

  const handleTest = useCallback(async () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    await saveReplicateApiKey(trimmed, user?.id);
    onKeyChange?.(true);
    setStatus('testing');
    const ok = await testReplicateConnection();
    setStatus(ok ? 'connected' : 'failed');
  }, [key, user, onKeyChange]);

  const handleClear = useCallback(() => {
    void removeReplicateApiKey(user?.id);
    setKey('');
    setStatus('idle');
    onKeyChange?.(false);
  }, [user, onKeyChange]);

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
        to enable AI room restyling. {user && !isGuest
          ? 'Your key is saved to your account and syncs across devices.'
          : 'Your key is saved locally in this browser.'}
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
