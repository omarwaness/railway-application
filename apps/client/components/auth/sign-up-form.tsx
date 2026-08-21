"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/lib/api/keys"
import { authClient } from "@/lib/auth-client"
import { REDIRECT_PARAM, redirectTarget } from "@/lib/redirects"
import { signUpSchema, type SignUpValues } from "@/lib/schemas/auth"
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

/**
 * `/onboarding`, carrying forward the redirect the user arrived with so the
 * page they were originally after is still where onboarding lets them out.
 */
function onboardingTarget() {
  const target = redirectTarget()

  if (target === "/") {
    return "/onboarding"
  }

  return `/onboarding?${REDIRECT_PARAM}=${encodeURIComponent(target)}`
}

function SignUpForm() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const signUp = useMutation({
    mutationFn: async (values: SignUpValues) => {
      const { data, error } = await authClient.signUp.email(values)

      // better-auth reports failures in the payload instead of rejecting, so
      // without this a taken email would come back as a successful signup.
      if (error) {
        throw new Error(error.message ?? "Could not create your account.")
      }

      return data
    },
    onSuccess: async () => {
      // Signing up signs the user in, so the session key is stale from here.
      await queryClient.invalidateQueries({ queryKey: queryKeys.session.all() })
      // Onboarding first: a brand-new account has no Railway token, so every
      // other route it could land on comes back empty. Whatever the proxy
      // turned them away from rides along, for onboarding to finish on.
      router.push(onboardingTarget())
      // Drops server output rendered while signed out, which would otherwise
      // be served from the router cache after the navigation.
      router.refresh()
    },
  })

  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    // Runs the whole schema on every keystroke, so an error the user is
    // actively fixing clears as soon as the value is valid.
    validators: { onChange: signUpSchema },
    // `mutate`, not `mutateAsync`: a rejection here would escape the form's
    // submit handler, and the failure is already on `signUp.error`.
    onSubmit: ({ value }) => signUp.mutate(value),
  })

  return (
    <div className="grid h-svh overflow-hidden lg:grid-cols-2">
      <div className="flex flex-col justify-center p-6 md:p-10">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold">Sign up to get started</h1>
            <p className="text-muted-foreground">
              Set up your account to start deploying containers.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
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
              <form.Field name="name">
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
                      <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="text"
                        autoComplete="name"
                        placeholder="Ada Lovelace"
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

              <form.Field name="email">
                {(field) => {
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
                        autoComplete="new-password"
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
                {signUp.error && (
                  <p role="alert" className="text-sm text-destructive">
                    {signUp.error.message}
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
                        !canSubmit || signUp.isPending || signUp.isSuccess
                      }
                    >
                      {signUp.isPending || signUp.isSuccess
                        ? "Creating account…"
                        : "Create account"}
                    </Button>
                  )}
                </form.Subscribe>
              </Field>
            </FieldGroup>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
      <AuthAside
        title="Your stack, mapped."
        description="Connect your Railway token and every project, service, and deployment lands on one screen."
      />
    </div>
  )
}

export { SignUpForm }
