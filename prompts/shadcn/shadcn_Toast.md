
# Shadcn Toast Examples

## Overview

Toasts are succinct messages that are displayed temporarily, typically used for feedback to users after an action. Below are examples demonstrating how to implement various types of Toast components using Shadcn in your project.

---

## Add to Calendar Button Example

```jsx
"use client"

import { useToast } from "@/components/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ToastAction } from "@/components/ui/toast"

export function ToastDemo() {
  const { toast } = useToast()

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          title: "Scheduled: Catch up",
          description: "Friday, February 10, 2023 at 5:57 PM",
          action: (
            <ToastAction altText="Goto schedule to undo">Undo</ToastAction>
          ),
        })
      }}
    >
      Add to calendar
    </Button>
  )
}
```

---

## Installation

Run the following command to add the toast functionality to your project:

```bash
npx shadcn@latest add toast
```

---

## Add the Toaster Component

To use the toast functionality across your application, add the Toaster component to your `app/layout.tsx`:

```tsx
import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
```

---

## Usage

The `useToast` hook returns a `toast` function that you can use to display a toast notification. Here’s a simple example:

```tsx
import { useToast } from "@/components/hooks/use-toast"

export const ToastDemo = () => {
  const { toast } = useToast()

  return (
    <Button
      onClick={() => {
        toast({
          title: "Scheduled: Catch up",
          description: "Friday, February 10, 2023 at 5:57 PM",
        })
      }}
    >
      Show Toast
    </Button>
  )
}
```

To display multiple toasts at the same time, update the `TOAST_LIMIT` in `use-toast.tsx`.

---

## Examples

### Simple Toast

```jsx
"use client"

import { useToast } from "@/components/hooks/use-toast"
import { Button } from "@/components/ui/button"

export function ToastSimple() {
  const { toast } = useToast()

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          description: "Your message has been sent.",
        })
      }}
    >
      Show Toast
    </Button>
  )
}
```

### Toast with Title

```jsx
"use client"

import { useToast } from "@/components/hooks/use-toast"
import { Button } from "@/components/ui/button"

export function ToastWithTitle() {
  const { toast } = useToast()

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          title: "Uh oh! Something went wrong.",
          description: "There was a problem with your request.",
        })
      }}
    >
      Show Toast
    </Button>
  )
}
```

### Toast with Action

```jsx
"use client"

import { useToast } from "@/components/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ToastAction } from "@/components/ui/toast"

export function ToastWithAction() {
  const { toast } = useToast()

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          title: "Uh oh! Something went wrong.",
          description: "There was a problem with your request.",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        })
      }}
    >
      Show Toast
    </Button>
  )
}
```

### Destructive Toast

Use `toast({ variant: "destructive" })` to display a destructive toast:

```jsx
"use client"

import { useToast } from "@/components/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ToastAction } from "@/components/ui/toast"

export function ToastDestructive() {
  const { toast } = useToast()

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "There was a problem with your request.",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        })
      }}
    >
      Show Toast
    </Button>
  )
}
```

---

These examples demonstrate how to display various types of toasts using the Shadcn library.
