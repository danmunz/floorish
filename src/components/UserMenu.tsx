import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const BMC_SCRIPT_SRC = 'https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js';

function BuyMeCoffeeButton({ slug }: { slug: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = BMC_SCRIPT_SRC;
    script.setAttribute('data-name', 'bmc-button');
    script.setAttribute('data-slug', slug);
    script.setAttribute('data-color', '#264653');
    script.setAttribute('data-emoji', '☕');
    script.setAttribute('data-font', 'Inter');
    script.setAttribute('data-text', 'Buy me a coffee');
    script.setAttribute('data-outline-color', '#ffffff');
    script.setAttribute('data-font-color', '#ffffff');
    script.setAttribute('data-coffee-color', '#FFDD00');

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [slug]);

  return <div className="user-dropdown-bmc" ref={containerRef} />;
}

export function UserMenu() {
  const { user, isGuest, signInWithGoogle, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const configuredSlug = import.meta.env.VITE_BMC_SLUG?.trim();
  const bmcSlug = configuredSlug || 'danmunz';

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
          <BuyMeCoffeeButton slug={bmcSlug} />
          <button className="user-dropdown-item" onClick={() => { signOut(); setOpen(false); }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
