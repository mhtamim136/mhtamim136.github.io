import { Brain, Database } from 'lucide-react';

const iconClass = 'h-5 w-5 shrink-0';

export function NavIcon({ name, className = '' }) {
  const c = `${iconClass} ${className}`;
  switch (name) {
    case 'spark':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
          />
        </svg>
      );
    case 'arrow-up':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      );
    case 'document':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v9m3-3.75h4.125a1.125 1.125 0 0 0 1.125-1.125V12.75m-5.25 3H9.375c-.621 0-1.125.504-1.125 1.125v3.75m7.5-3H21.75a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-.75.75h-4.5m-9-6h.375c.621 0 1.125.504 1.125 1.125v9.75m-6-3h6.75"
          />
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75A2.25 2.25 0 0 1 15.75 18h2.25A2.25 2.25 0 0 1 20.25 15.75v-2.25A2.25 2.25 0 0 1 18 11.25h-2.25a2.25 2.25 0 0 1-2.25 2.25v2.25Z"
          />
        </svg>
      );
    case 'monitor':
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 20.25h12M3 6.75h18M4.5 6.75h15v9a1.5 1.5 0 0 1-1.5 1.5h-12a1.5 1.5 0 0 1-1.5-1.5v-9Z"
          />
        </svg>
      );
    /* 'database' and 'brain' used to fall through to the default
       spark icon, so Database & data handling and Problem solving
       showed the same shape. Distinct Lucide icons, drawn at the
       same 1.5 stroke weight as the hand-drawn ones. */
    case 'database':
      return <Database className={c} strokeWidth={1.5} />;
    case 'brain':
      return <Brain className={c} strokeWidth={1.5} />;
    default:
      return <NavIcon name="spark" className={className} />;
  }
}
