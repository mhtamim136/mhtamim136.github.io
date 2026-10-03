/** Opens external URLs safely. */
export function externalLinkProps(href) {
  return {
    href,
    target: '_blank',
    rel: 'noopener noreferrer',
  };
}
