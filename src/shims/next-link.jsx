export default function Link({ href = '#', children, ...props }) {
  const url = typeof href === 'string' ? href : '#';
  return <a href={url} {...props}>{children}</a>;
}
