export default function Image({ src, alt = '', fill, priority, quality, sizes, style, ...props }) {
  const resolvedSrc = typeof src === 'string' ? src : src?.src || '';
  const imageStyle = fill ? { objectFit: props.objectFit || 'cover', ...style } : style;
  return <img src={resolvedSrc} alt={alt} style={imageStyle} {...props} />;
}
