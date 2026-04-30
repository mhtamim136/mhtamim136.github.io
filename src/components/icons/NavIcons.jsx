const iconClass = 'h-5 w-5 shrink-0';

export function NavIcon({ name, className = '' }) {
  const c = `${iconClass} ${className}`;
  switch (name) {
    case 'home':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      );
    case 'user':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      );
    case 'stack':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 12 4.5l5.571 5.25M6.429 14.25 12 19.5l5.571-5.25" />
        </svg>
      );
    case 'grid':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 3.75A2.25 2.25 0 0 1 15.75 6v2.25A2.25 2.25 0 0 1 13.5 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6a2.25 2.25 0 0 1 2.25-2.25h2.25Zm6.75 0A2.25 2.25 0 0 1 22.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25h-2.25a2.25 2.25 0 0 1-2.25-2.25V6a2.25 2.25 0 0 1 2.25-2.25H19.5Z" />
        </svg>
      );
    case 'timeline':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case 'spark':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
      );
    case 'mail':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      );
    case 'arrow-up':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      );
    case 'document':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v9m3-3.75h4.125a1.125 1.125 0 0 0 1.125-1.125V12.75m-5.25 3H9.375c-.621 0-1.125.504-1.125 1.125v3.75m7.5-3H21.75a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-.75.75h-4.5m-9-6h.375c.621 0 1.125.504 1.125 1.125v9.75m-6-3h6.75" />
        </svg>
      );
    case 'github':
      return (
        <svg className={c} fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return null;
  }
}

/** Service / feature icons */
export function ServiceIcon({ name, className = '' }) {
  const c = `h-6 w-6 ${className}`;
  switch (name) {
    case 'layout':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75A2.25 2.25 0 0 1 15.75 18h2.25A2.25 2.25 0 0 1 20.25 15.75v-2.25A2.25 2.25 0 0 1 18 11.25h-2.25a2.25 2.25 0 0 1-2.25 2.25v2.25Z" />
        </svg>
      );
    case 'monitor':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12M3 6.75h18M4.5 6.75h15v9a1.5 1.5 0 0 1-1.5 1.5h-12a1.5 1.5 0 0 1-1.5-1.5v-9Z" />
        </svg>
      );
    case 'server':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3v5.25a3 3 0 0 1-3 3m-13.5 0h13.5v4.5a3 3 0 0 1-3 3h-7.5a3 3 0 0 1-3-3v-4.5Z" />
        </svg>
      );
    case 'compass':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.25-12.5L11 11l-2.5 4.25L13 13l2.5-4.25Z" />
        </svg>
      );
    default:
      return <NavIcon name="spark" className={className} />;
  }
}
