type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  compact?: boolean;
};

export function BrandLogo({ className = '', imageClassName = '', compact = false }: BrandLogoProps) {
  return (
    <div className={className}>
      <img
        src={compact ? '/brand/logo-variants.png' : '/brand/logo-full.png'}
        alt="Silo"
        className={imageClassName}
      />
    </div>
  );
}
