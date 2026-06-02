import React from 'react';
import './Button.css';

/**
 * Reusable Button component with multiple variants, sizes, and states.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button label or contents
 * @param {Function} [props.onClick] - Click event handler
 * @param {string} [props.type="button"] - HTML button type ('button', 'submit', 'reset')
 * @param {string} [props.variant="primary"] - Visual style variant ('primary', 'secondary', 'danger', 'outline', 'text')
 * @param {string} [props.size="md"] - Button sizing ('sm', 'md', 'lg')
 * @param {boolean} [props.isLoading=false] - If true, displays spinner and disables interaction
 * @param {boolean} [props.disabled=false] - If true, disables interaction
 * @param {string} [props.className=""] - Optional extra CSS class names
 */
export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const isButtonDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      className={`app-btn app-btn--${variant} app-btn--${size} ${isLoading ? 'app-btn--loading' : ''} ${className}`}
      onClick={onClick}
      disabled={isButtonDisabled}
      {...props}
    >
      {isLoading && (
        <span className="app-btn__spinner" data-testid="btn-spinner"></span>
      )}
      <span className="app-btn__content">{children}</span>
    </button>
  );
};

export default Button;
