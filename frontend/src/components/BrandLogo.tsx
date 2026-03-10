type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  compact?: boolean;
  showText?: boolean;
  textClassName?: string;
};

function getIsDark() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export function BrandLogo({
  className = '',
  imageClassName = '',
  showText = false,
  textClassName = '',
}: BrandLogoProps) {
  const isDark = getIsDark();
  const src = isDark ? '/brand/yellowLogo.svg' : '/brand/blueLogo.svg';

  return (
    <div className={className}>
      <img
        src={src}
        alt="Silo"
        className={imageClassName}
      />
      {showText && (
        <span className={textClassName || 'text-xl font-bold text-foreground dark:text-primary'}>
          Silo
        </span>
      )}
    </div>
  );
}
