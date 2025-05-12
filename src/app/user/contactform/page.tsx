'use client';

import { useState, useEffect,Suspense } from "react";

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import {
  SidebarInset, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";  
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { AppSidebar } from "@/components/app-sidebar";

interface companies {
  id: string;
  company_name?: string;
  companyName?: string;
}

const contactPersonsSchema = z.object({
  firstName: z.string().nonempty({ message: "Required" }),
  middleName: z.string().nonempty({ message: "Required" }),
  lastName: z.string().nonempty({ message: "Required" }),
  contactNo: z.string().regex(/^\d*$/, { message: "Contact number must be numeric" }).nonempty({ message: "Required" }),
  email: z.string().email({ message: "Required" }),
  designation: z.string().nonempty({ message: "Required" }),
  company: z.string().nonempty({ message: "Please select a company" }), // Displayed name
  companyId: z.string().nonempty({ message: "Missing company ID" }),    // Actual ID for backend
});

export default function ContactFormWrapper() {
    return (
        <Suspense fallback={<ContactFormLoading />}>
            <ContactForm />
        </Suspense>
    );
}

function ContactFormLoading() {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            <span className="ml-4">Loading contact form...</span>
        </div>
    );
}


 function ContactForm() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<companies[]>([]);

  const form = useForm<z.infer<typeof contactPersonsSchema>>({
    resolver: zodResolver(contactPersonsSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      contactNo: "",
      email: "",
      designation: "",
      company: "",
      companyId: "",
    },
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get("/api/companies");
        if (res.status === 200) {
          setCompanies(res.data);
        }
      } catch (err) {
        console.error("Error fetching companies:", err);
        toast({
          title: "Error",
          description: "An error occurred while fetching companies. Please try again later.",
          variant: "destructive",
        });
      }
    };

    fetchCompanies();
  }, []);

  const onSubmit = async (values: z.infer<typeof contactPersonsSchema>) => {
    setIsSubmitting(true);

    try {
      const payload = {
        ...values,
        company: values.companyId, // Send ID to backend
      };

      const res = await axios.post("/api/contactPersons", payload);
      if (res.status === 201) {
        toast({ title: "Success", description: "Contact created successfully" });
        form.reset();
      } else {
        throw new Error("Create failed");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/user/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/user/contactrecord">Contact Record</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
          <Card className="max-w-6xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                "Create Contact"
              </CardTitle>
              <CardDescription className="text-center">
                "Fill out the form below to create a new contact"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading contact...</div>}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="First Name" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Middle Name" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Last Name" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Contact Number"
                              {...field}
                              disabled={isSubmitting}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/\D/g, '');
                                field.onChange(numericValue);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Email" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="designation"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Designation" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Type to search..."
                              {...field}
                              disabled={isSubmitting}
                              autoComplete="off"
                            />
                            {field.value && (
                              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-md max-h-40 overflow-auto">
                                {companies
                                  .filter((company) => {
                                    const name = company.company_name || company.companyName || "";
                                    return name.toLowerCase().includes(field.value.toLowerCase());
                                  })
                                  .map((company) => {
                                    const name = company.company_name || company.companyName || "";
                                    return (
                                      <div
                                        key={company.id}
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                        onClick={() => {
                                          form.setValue("company", name);
                                          form.setValue("companyId", company.id);
                                        }}
                                      >
                                        {name}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem style={{ display: 'none' }}>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <CardFooter className="px-0">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin mr-2" />
                          "Creating..."
                        </>
                      ) : "Create"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
