"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/cart-context";
import { loadStripe } from "@stripe/stripe-js";
import { X } from "lucide-react";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProductWithVariants, SizeVariant } from "@/lib/types";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const formSchema = z
  .object({
    // Date personale
    fullName: z.string().min(2, "Numele trebuie sa aiba cel putin 2 caractere"),
    email: z.string().email("Email invalid"),
    phoneNumber: z
      .string()
      .min(10, "Numarul de telefon trebuie sa aiba cel putin 10 caractere"),

    // Informatii livrare
    address: z.string().min(5, "Adresa trebuie sa aiba cel putin 5 caractere"),
    city: z.string().min(2, "Orasul trebuie sa aiba cel putin 2 caractere"),
    county: z.string().min(2, "Judetul trebuie sa aiba cel putin 2 caractere"),
    postalCode: z
      .string()
      .min(5, "Codul postal trebuie sa aiba cel putin 5 caractere"),
    country: z.string().min(2, "Tara trebuie sa aiba cel putin 2 caractere"),
    notes: z.string().optional(),

    // Metoda plata
    paymentType: z.enum(["card", "ramburs"]),

    // Remember details
    rememberDetails: z.boolean().optional(),

    // For companies
    isCompany: z.boolean().default(false),
    companyName: z.string().optional(),
    cui: z.string().optional(),
    regCom: z.string().optional(),
    companyStreet: z.string().optional(),
    companyCity: z.string().optional(),
    companyCounty: z.string().optional(),

    subscribeToNewsletter: z.boolean().optional(),
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, {
        message: "Trebuie sa accepti termenii si conditiile pentru a continua",
      }),
  })
  .refine(
    (data) => {
      if (data.isCompany) {
        return !!(
          data.companyName &&
          data.cui &&
          data.regCom &&
          data.companyStreet &&
          data.companyCity &&
          data.companyCounty
        );
      }
      return true;
    },
    {
      message: "Pentru persoane juridice, toate campurile sunt obligatorii",
      path: ["companyName"],
    }
  );

type Discount = {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
};

export default function OrderDetailsForm({ userId }: { userId?: string }) {
  const router = useRouter();
  const { state, dispatch } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [isCompany, setIsCompany] = useState(false);

  const { appliedDiscounts = [] } = state;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      address: "",
      city: "",
      county: "",
      postalCode: "",
      country: "Romania",
      notes: "",
      paymentType: "card",
      rememberDetails: false,
      isCompany: false,
      companyName: "",
      cui: "",
      regCom: "",
      companyStreet: "",
      companyCity: "",
      companyCounty: "",
      subscribeToNewsletter: false,
      termsAccepted: false,
    },
  });

  useEffect(() => {
    // Load saved details if user is authenticated
    if (userId) {
      const savedDetails = localStorage.getItem(`userDetails_${userId}`);
      if (savedDetails) {
        const parsedDetails = JSON.parse(savedDetails);
        form.reset(parsedDetails);
      }
    }
  }, [userId, form]);

  async function handleApplyDiscount() {
    try {
      const response = await fetch(`/api/discount/apply?code=${discountCode}`);
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Eroare",
          description: data.error || "Nu am putut aplica codul de reducere",
          variant: "destructive",
        });
        return;
      }

      dispatch({
        type: "APPLY_DISCOUNT",
        payload: {
          code: data.code,
          type: data.type,
          value: data.value,
        },
      });

      setDiscountCode("");
      toast({
        title: "Succes",
        description: "Codul de reducere a fost aplicat cu succes",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Eroare",
        description:
          "Nu am putut aplica codul de reducere. Vă rugăm să încercați din nou.",
        variant: "destructive",
      });
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (userId && values.rememberDetails) {
        const { rememberDetails, paymentType, ...detailsToSave } = values;
        localStorage.setItem(
          `userDetails_${userId}`,
          JSON.stringify(detailsToSave)
        );
      }

      // Handle newsletter subscription
      if (values.subscribeToNewsletter) {
        try {
          await fetch('/api/newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: values.email }),
          });
          // Nu blocam procesul de checkout daca abonarea esueaza, doar inregistram in consola
        } catch (subError) {
          console.error("Failed to subscribe to newsletter:", subError);
        }
      }

      const orderDetailsResponse = await fetch("/api/order-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          userId: userId || null,
          appliedDiscounts,
        }),
      });

      if (!orderDetailsResponse.ok) {
        const errorData = await orderDetailsResponse.json();
        throw new Error(errorData.error || "Failed to save order details");
      }

      const savedDetails = await orderDetailsResponse.json();

      if (values.paymentType === "ramburs") {
        const createOrderResponse = await fetch("/api/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: state.items,
            userId: userId || null,
            detailsId: savedDetails.id,
            paymentType: "ramburs",
            appliedDiscounts,
          }),
        });

        if (!createOrderResponse.ok) {
          const errorData = await createOrderResponse.json();
          throw new Error(errorData.error || "Failed to create order");
        }

        const { orderId } = await createOrderResponse.json();
        router.push(`/checkout/success?order_id=${orderId}`);
      } else {
        const checkoutResponse = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: state.items,
            userId: userId || null,
            detailsId: savedDetails.id,
            paymentType: "card",
            appliedDiscounts,
          }),
        });

        if (!checkoutResponse.ok) {
          const errorData = await checkoutResponse.json();
          throw new Error(
            errorData.error || "Failed to create checkout session"
          );
        }

        const { sessionId } = await checkoutResponse.json();
        const stripe = await stripePromise;

        if (!stripe) {
          throw new Error("Failed to load Stripe");
        }

        const { error } = await stripe.redirectToCheckout({ sessionId });

        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error processing order:", error);
      toast({
        title: "Eroare",
        description:
          "Nu am putut procesa comanda. Vă rugăm să încercați din nou.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const subtotal = state.items.reduce(
    (acc, item) => acc + item.variant.price * item.quantity,
    0
  );
  const shipping = 15; // Fixed shipping cost

  // Calculate discounts and adjusted costs
  const percentageDiscount = appliedDiscounts
    .filter((d: Discount) => d.type === "percentage")
    .reduce(
      (acc: number, discount: Discount) =>
        acc + (subtotal * discount.value) / 100,
      0
    );

  const fixedDiscount = appliedDiscounts
    .filter((d: Discount) => d.type === "fixed")
    .reduce((acc: number, discount: Discount) => acc + discount.value, 0);

  const hasShippingDiscount = appliedDiscounts.some(
    (d: Discount) => d.type === "free_shipping"
  );

  const adjustedSubtotal = Math.max(
    0,
    subtotal - percentageDiscount - fixedDiscount
  );
  const adjustedShipping = hasShippingDiscount ? 0 : shipping;
  const total = adjustedSubtotal + adjustedShipping;

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
      {/* Form - Now on the left */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Date personale</h2>
              <FormField
                control={form.control}
                name="isCompany"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setIsCompany(checked as boolean);
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Sunt persoana juridica
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume si prenume*</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isCompany && (
                <>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nume firma*</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cui"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cod unic de inregistrare (CUI)*</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="regCom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Numar de inregistrare registrul comertului*
                        </FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyStreet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresa sediului social*</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orasul sediului social*</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyCounty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Judetul sediului social*</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresa email*</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} className="bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numar de telefon*</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Informații livrare</h2>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresă*</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oraș*</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="county"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Județ*</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cod poștal*</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Țară*</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note pentru livrare (opțional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="bg-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Metodă plată</h2>
              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="card" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Card bancar
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="ramburs" />
                          </FormControl>
                          <FormLabel className="font-normal">Ramburs</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {userId && (
              <FormField
                control={form.control}
                name="rememberDetails"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Salveaza datele pentru comenzi viitoare
                    </FormLabel>
                  </FormItem>
                )}
              />
            )}

            <Separator />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Sunt de acord cu{" "}
                        <a
                          href="/termeni-conditii"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Termenii și Condițiile
                        </a>
                        *
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subscribeToNewsletter"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Doresc să mă abonez la newsletter pentru a primi oferte și noutăți.
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#F57228] hover:bg-[#e05a1f] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se proceseaza...
                </>
              ) : (
                "Continua catre plata"
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Order Summary - Now on the right */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Sumar comandă</h2>
          <div className="space-y-4">
            {state.items.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedSize}`}
                className="flex items-start space-x-4"
              >
                <div className="relative w-20 h-20 flex-shrink-0">
                  <Image
                    src={item.product.images[0] || "/placeholder.svg"}
                    alt={item.product.name}
                    fill
                    className="object-cover rounded"
                  />
                  <span className="absolute -top-2 -right-2 bg-gray-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-grow">
                  <h3 className="font-medium">{item.product.name}</h3>
                  <p className="text-sm text-gray-600">
                    Size: {item.selectedSize}
                  </p>
                  <p className="text-sm font-medium">
                    {item.variant.price.toFixed(2)} RON x {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            <Label htmlFor="discountCode">Cod discount</Label>
            <div className="flex space-x-2">
              <Input
                id="discountCode"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Introdu codul"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyDiscount();
                  }
                }}
              />
              <Button
                onClick={handleApplyDiscount}
                className="bg-[#F57228] hover:bg-[#e05a1f] text-white"
              >
                Aplică
              </Button>
            </div>
            {appliedDiscounts.map((discount) => (
              <div
                key={discount.code}
                className="flex justify-between items-center"
              >
                <span>{discount.code}</span>
                <span>
                  {discount.type === "free_shipping"
                    ? "Transport gratuit"
                    : discount.type === "percentage"
                    ? `-${discount.value}%`
                    : `-${discount.value.toFixed(2)} RON`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    dispatch({
                      type: "REMOVE_DISCOUNT",
                      payload: { code: discount.code },
                    })
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <div className="text-right">
                <span
                  className={
                    percentageDiscount > 0 || fixedDiscount > 0
                      ? "line-through text-gray-500"
                      : ""
                  }
                >
                  ${subtotal.toFixed(2)}
                </span>
                {(percentageDiscount > 0 || fixedDiscount > 0) && (
                  <div className="text-green-600">
                    ${adjustedSubtotal.toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span>Transport</span>
              <div className="text-right">
                <span
                  className={
                    hasShippingDiscount ? "line-through text-gray-500" : ""
                  }
                >
                  ${shipping.toFixed(2)}
                </span>
                {hasShippingDiscount && (
                  <div className="text-green-600">$0.00</div>
                )}
              </div>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
