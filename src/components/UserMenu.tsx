import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export function UserMenu() {
  const { user, isGuest, signInWithGoogle, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (isGuest) {
    return (
      <button className="guest-sign-in-btn" onClick={signInWithGoogle}>
        Sign in
      </button>
    );
  }

  if (!user) return null;

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    'User';
  const avatar = user.user_metadata?.avatar_url;
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="user-menu" ref={menuRef}>
      <button className="user-avatar-btn" onClick={() => setOpen(!open)}>
        {avatar ? (
          <img className="user-avatar" src={avatar} alt="" />
        ) : (
          <span className="user-avatar-fallback">{initials}</span>
        )}
        <span>{name.split(' ')[0]}</span>
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-item" style={{ fontWeight: 600, cursor: 'default' }}>
            {name}
          </div>
          <div className="user-dropdown-divider" />
          <button className="user-dropdown-item" onClick={() => { signOut(); setOpen(false); }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
