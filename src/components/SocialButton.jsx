import { externalLinkProps } from '../utils/links';

/** Hover-only emphasis; all social buttons share the same default surface */
const hoverPremium =
  'transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.06] hover:border-accent/35 hover:bg-accent/10 hover:text-accent hover:shadow-[0_0_18px_rgb(var(--accent)_/_0.32)]';

const layout =
  'group inline-flex items-center gap-2 rounded-xl border border-glass/10 bg-glass/[0.04] px-5 py-2.5 text-sm font-medium text-body shadow-glass backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-100';

const surface = `${layout} ${hoverPremium}`;

export function SocialButton({ href, icon: Icon, children, className = '', openInNewTab = true, ...rest }) {
  const linkProps =
    openInNewTab && typeof href === 'string' && !href.startsWith('mailto:')
      ? externalLinkProps(href)
      : { href };

  return (
    <a className={`${surface} ${className}`.trim()} {...linkProps} {...rest}>
      {Icon ? (
        <Icon
          className="h-4 w-4 shrink-0 text-muted transition-colors duration-300 ease-out group-hover:text-accent"
          aria-hidden
        />
      ) : null}
      {children}
    </a>
  );
}

/** Inline email row — aligned hover language with social buttons */
export const emailInlineLinkClassName =
  'mt-1 inline-flex items-center gap-2 rounded-lg px-1.5 py-0.5 -mx-1.5 text-base font-medium text-body transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.04] hover:text-accent hover:shadow-[0_0_16px_rgb(var(--accent)_/_0.28)]';
