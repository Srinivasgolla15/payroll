import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  className?: string;
  circle?: boolean;
  height?: number | string;
  width?: number | string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  count = 1,
  className = '',
  circle = false,
  height,
  width,
  style: styleProp,
  ...props
}) => {
  const elements = Array.from({ length: count }, (_, i) => i);
  
  const baseStyle: React.CSSProperties = {
    backgroundColor: 'hsl(var(--muted))',
    backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)), hsl(var(--muted-foreground)/0.3), hsl(var(--muted)))',
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite linear',
    borderRadius: circle ? '50%' : '0.25rem',
    height: height || '1em',
    width: width || '100%',
    ...styleProp,
  };

  return (
    <>
      {elements.map((_, i) => (
        <div
          key={i}
          className={`skeleton ${className}`}
          style={baseStyle}
          {...props}
        />
      ))}
    </>
  );
};

// Pre-configured skeleton components
export const CardSkeleton: React.FC<{ className?: string; lines?: number }> = ({
  className = '',
  lines = 3,
}) => (
  <div className={`p-4 border rounded-lg ${className}`}>
    <Skeleton className="h-6 w-3/4 mb-4" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className="h-4 w-full mb-2 last:mb-0 last:w-5/6" />
    ))}
  </div>
);

export const TableSkeleton: React.FC<{
  className?: string;
  rows?: number;
  cols?: number;
}> = ({ className = '', rows = 5, cols = 5 }) => (
  <div className={`w-full overflow-hidden ${className}`}>
    <div className="grid grid-cols-12 gap-4 mb-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={`header-${i}`} className="h-6 col-span-2" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid grid-cols-12 gap-4 mb-3">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton
            key={`cell-${rowIndex}-${colIndex}`}
            className={`h-5 col-span-2 ${colIndex === cols - 1 ? 'col-span-1' : ''}`}
          />
        ))}
      </div>
    ))}
  </div>
);

// Add this to your global CSS:
// @keyframes shimmer {
//   0% { background-position: -200% 0; }
//   100% { background-position: 200% 0; }
// }
