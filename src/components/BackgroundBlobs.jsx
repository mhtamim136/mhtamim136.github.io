/**
 * Decorative background blobs — slow-floating organic gradient shapes.
 * Pinned behind all content with fixed positioning.
 * Uses CSS animations to keep them off the main thread.
 */
export function BackgroundBlobs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Top-right blob */}
      <div
        className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full opacity-[0.035] blur-[100px] sm:h-[600px] sm:w-[600px]"
        style={{
          background:
            'radial-gradient(circle, rgb(var(--accent)) 0%, transparent 70%)',
          animation: 'blob-float 22s ease-in-out infinite',
        }}
      />
      {/* Bottom-left blob */}
      <div
        className="absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full opacity-[0.03] blur-[100px] sm:h-[550px] sm:w-[550px]"
        style={{
          background:
            'radial-gradient(circle, var(--gradient-via) 0%, transparent 70%)',
          animation: 'blob-float 26s ease-in-out infinite reverse',
        }}
      />
      {/* Centre-right blob (only visible on larger screens) */}
      <div
        className="absolute right-1/4 top-1/2 hidden h-[400px] w-[400px] -translate-y-1/2 rounded-full opacity-[0.02] blur-[100px] lg:block"
        style={{
          background:
            'radial-gradient(circle, var(--gradient-to) 0%, transparent 70%)',
          animation: 'blob-float 30s ease-in-out infinite 5s',
        }}
      />
    </div>
  );
}
