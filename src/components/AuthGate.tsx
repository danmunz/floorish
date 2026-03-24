import { useAuth } from '../hooks/useAuth';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isGuest, signInWithGoogle, continueAsGuest } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
      </div>
    );
  }

  if (user || isGuest) {
    return <>{children}</>;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <svg className="auth-logo" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 4L4 20h6v20h28V20h6L24 4z" fill="#264653" stroke="#264653" strokeWidth="2" strokeLinejoin="round"/>
          <line x1="10" y1="28" x2="38" y2="28" stroke="#FAFAFA" strokeWidth="1" opacity="0.3"/>
          <line x1="10" y1="34" x2="38" y2="34" stroke="#FAFAFA" strokeWidth="1" opacity="0.3"/>
          <line x1="18" y1="20" x2="18" y2="40" stroke="#FAFAFA" strokeWidth="1" opacity="0.3"/>
          <line x1="30" y1="20" x2="30" y2="40" stroke="#FAFAFA" strokeWidth="1" opacity="0.3"/>
          <path d="M24 14c3 2 5 6 4 10-2-1-5-3-6-6 1 3 1 6-1 9-2-3-3-7-1-10-3 2-6 2-8 0 3-1 6-1 9 0-2-2-3-5-1-8 2 2 4 4 4 5z" fill="#7A8B52" opacity="0.9"/>
          <circle cx="24" cy="16" r="2.5" fill="#E9C46A"/>
        </svg>
        <h1 className="auth-title">Welcome to Floorish</h1>
        <p className="auth-subtitle">
          Turn empty floor plans into perfectly planned sanctuaries.
        </p>

        <button className="auth-btn auth-btn-google" onClick={signInWithGoogle}>
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button className="auth-btn auth-btn-guest" onClick={continueAsGuest}>
          Continue as guest
        </button>

        <p className="auth-footnote">
          Guest projects are saved locally in your browser. Sign in to save to
          the cloud and access your projects anywhere.
        </p>
      </div>
    </div>
  );
}
