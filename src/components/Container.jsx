export function Container({ as: Component = 'div', className = '', children, ...rest }) {
  return (
    <Component
      className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
