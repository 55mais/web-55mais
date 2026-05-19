export { registerUser } from './actions/register-user';
export type { RegisterUserResult } from './actions/register-user';
export { loginUser } from './actions/login-user';
export type { LoginResult } from './actions/login-user';
export { requestPasswordReset } from './actions/request-password-reset';
export type { RequestPasswordResetResult } from './actions/request-password-reset';
export { updatePassword } from './actions/update-password';
export type { UpdatePasswordResult } from './actions/update-password';
export { listActiveCountries } from './actions/list-active-countries';
export type { ActiveCountry } from './actions/list-active-countries';

export { AuthCard } from './components/auth-card';
export { PasswordInput } from './components/password-input';
export { GoogleButton } from './components/google-button';
export { LoginForm } from './components/login-form';
export { RegisterForm } from './components/register-form';

export { computeRegisterPrefill } from './lib/register-prefill';
export type {
  RegisterPrefill,
  SelectedCityLike,
  CountryOption,
} from './lib/register-prefill';
export { safeNext } from './lib/safe-next';
export { buildAuthCallbackUrl } from './lib/build-auth-callback-url';
export type { AuthCallbackType } from './lib/build-auth-callback-url';

export {
  loginSchema,
  registerSchema,
  forgotSchema,
  resetSchema,
  emailField,
  passwordSchema,
  phoneSchema,
} from './schemas';
export type {
  LoginInput,
  RegisterInput,
  ForgotInput,
  ResetInput,
} from './schemas';
