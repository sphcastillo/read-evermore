import {Show, SignInButton, SignUpButton, UserButton} from '@clerk/nextjs'

export function AuthControl() {
  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="pill px-4 py-2 text-sm">Sign in</button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="pill is-active px-4 py-2 text-sm">Sign up</button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  )
}
