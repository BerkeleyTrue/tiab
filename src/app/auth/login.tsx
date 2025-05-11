"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/trpc/react";

// Define form schema with zod
const formSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

// Infer the type from the schema
type FormValues = z.infer<typeof formSchema>;

export function SignUpForm() {
  const router = useRouter();
  const utils = api.useUtils();
  const { mutate, isPending } = api.auth.signUp.useMutation({
    onSuccess: () => {
      // Handle successful login
      router.push("/");
      void utils.auth.getUser.invalidate();
    },
    onError: (error) => {
      // Handle login error
      toast.error(error.message ?? "Failed to create account");
    },
  });

  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data))} className="w-full flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>
              Create a new account to get started
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" type="text" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating account..." : "Sign Up"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
