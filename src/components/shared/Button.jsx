import './Button.scss'

function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return <button className={`btn btn--${variant} btn--${size} ${className}`} {...props} />
}

export default Button
