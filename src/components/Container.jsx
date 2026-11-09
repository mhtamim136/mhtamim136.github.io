/* Always a <div> — no call site ever passed `as`, so the
   polymorphic prop is gone. */
export function Container({ className = '', children, ...rest }) {
  return (
    <div
      className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
