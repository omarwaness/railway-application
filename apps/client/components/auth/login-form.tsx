"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/api/keys"
import { authClient } from "@/lib/auth-client"
import { redirectTarget } from "@/lib/redirects"
import { signInSchema, type SignInValues } from "@/lib/schemas/auth"
import { AuthAside } from "@/components/auth/auth-aside"
import { LoginGithub } from "@/components/auth/login-github"
import { LoginGoogle } from "@/components/auth/login-google"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

function LoginForm() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const login = useMutation({
    mutationFn: async (values: SignInValues) => {
      const { data, error } = await authClient.signIn.email(values)

      // better-auth reports failures in the payload instead of rejecting, so
      // without this the mutation would resolve and report success on a wrong
      // password.
      if (error) {
        throw new Error(
          error.message ?? "Could not log in. Check your details."
        )
      }

      return data
    },
    onSuccess: async () => {
      // The response carries the user but not a full session, so refetch on
      // the shared key rather than seeding the cache with a different shape.
      await queryClient.invalidateQueries({ queryKey: queryKeys.session.all() })
      // Back to whatever the proxy turned them away from, or home.
      router.push(redirectTarget())
      // Drops server output rendered while signed out, which would otherwise
      // be served from the router cache after the navigation.
      router.refresh()
    },
  })

  const form = useForm({
    defaultValues: { email: "", password: "" },
    // Runs the whole schema on every keystroke, so an error the user is
    // actively fixing clears as soon as the value is valid.
    validators: { onChange: signInSchema },
    // `mutate`, not `mutateAsync`: a rejection here would escape the form's
    // submit handler, and the failure is already on `login.error`.
    onSubmit: ({ value }) => login.mutate(value),
  })

  return (
    <div className="grid h-svh overflow-hidden lg:grid-cols-2">
      <div className="flex flex-col justify-center p-6 md:p-10">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold">Welcome back</h1>
            <p className="text-muted-foreground">
              Log in to pick up where you left off.
            </p>
          </div>
          <div className="grid gap-3">
            <LoginGoogle />
            <LoginGithub />
          </div>
          <form
            // `noValidate` hands validation to the schema — otherwise the
            // browser's own bubbles fire first and submit never reaches us.
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              form.handleSubmit()
            }}
          >
            <FieldGroup className="gap-4">
              <form.Field name="email">
                {(field) => {
                  // Held back until the field has been left once, so errors
                  // don't appear while the first character is being typed.
                  const invalid =
                    field.state.meta.isBlurred && !field.state.meta.isValid

                  return (
                    <Field
                      className="gap-2"
                      data-invalid={invalid || undefined}
                    >
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        autoComplete="email"
                        placeholder="ada@example.com"
                        required
                        className="h-10 p-4"
                        aria-invalid={invalid || undefined}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                      {invalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              <form.Field name="password">
                {(field) => {
                  const invalid =
                    field.state.meta.isBlurred && !field.state.meta.isValid

                  return (
                    <Field
                      className="gap-2"
                      data-invalid={invalid || undefined}
                    >
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        autoComplete="current-password"
                        placeholder="Password"
                        required
                        className="h-10 p-4"
                        aria-invalid={invalid || undefined}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                      {invalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              <Field className="mt-2">
                {login.error && (
                  <p role="alert" className="text-sm text-destructive">
                    {login.error.message}
                  </p>
                )}
                <form.Subscribe selector={(state) => state.canSubmit}>
                  {(canSubmit) => (
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      // Stays disabled through `isSuccess` too — the redirect
                      // is still in flight at that point and the form is
                      // otherwise submittable again.
                      disabled={
                        !canSubmit || login.isPending || login.isSuccess
                      }
                    >
                      {login.isPending || login.isSuccess
                        ? "Logging in…"
                        : "Login"}
                    </Button>
                  )}
                </form.Subscribe>
              </Field>
            </FieldGroup>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <AuthAside
        title="Your stack, watched."
        description="One screen for everything you have running in production."
      />
    </div>
  )
}

export { LoginForm }
