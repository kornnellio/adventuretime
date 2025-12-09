"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { CouponFormData } from "@/lib/actions/coupon";

// Form schema using Zod for validation
const formSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code cannot exceed 20 characters")
    .toUpperCase()
    .regex(/^[A-Z0-9_-]+$/, "Only uppercase letters, numbers, underscores and hyphens are allowed"),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce
    .number()
    .min(0, "Value must be a positive number"),
  description: z.string().optional(),
  minPurchase: z.coerce.number().min(0).optional(),
  maxUses: z.coerce.number().min(0).int().optional(),
  appliesTo: z.enum(["all", "specific"]),
  applicableAdventures: z.array(z.string()).optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true),
});

type FormSchema = z.infer<typeof formSchema>;

interface CouponFormProps {
  initialData?: any;
  onSubmit: (data: CouponFormData) => Promise<{ success: boolean; error?: string }>;
  adventures: { value: string; label: string }[];
}

export default function CouponForm({
  initialData,
  onSubmit,
  adventures,
}: CouponFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
          endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
        }
      : {
          code: "",
          type: "percentage",
          value: 10,
          description: "",
          minPurchase: undefined,
          maxUses: undefined,
          appliesTo: "all",
          applicableAdventures: [],
          startDate: new Date(),
          endDate: undefined,
          isActive: true,
        },
  });

  const appliesTo = form.watch("appliesTo");
  const couponType = form.watch("type");

  const handleSubmit = async (data: FormSchema) => {
    try {
      setIsSubmitting(true);

      // Transform the form data to match the expected structure
      const formData: CouponFormData = {
        ...data,
        // If appliesTo is 'all', clear the applicable adventures array
        applicableAdventures: data.appliesTo === "all" ? [] : data.applicableAdventures || [],
      };

      const result = await onSubmit(formData);

      setIsSubmitting(false);

      if (result.success) {
        toast({
          title: "Success",
          description: initialData
            ? "Coupon updated successfully"
            : "Coupon created successfully",
        });
        router.push("/control-panel/coupons");
      } else {
        toast({
          title: "Error",
          description: result.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coupon Code */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coupon Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="SUMMER2023"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                  />
                </FormControl>
                <FormDescription>
                  A unique code for customers to apply at checkout
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Coupon Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a discount type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Type of discount to apply
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Discount Value */}
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Discount Value {couponType === "percentage" ? "(%)" : "($)"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={couponType === "percentage" ? "10" : "20"}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {couponType === "percentage"
                    ? "Percentage discount to apply (0-100)"
                    : "Fixed amount discount to apply"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Min Purchase */}
          <FormField
            control={form.control}
            name="minPurchase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Purchase ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="50"
                    {...field}
                    value={field.value === undefined ? "" : field.value}
                  />
                </FormControl>
                <FormDescription>
                  Minimum order amount required (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Max Uses */}
          <FormField
            control={form.control}
            name="maxUses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Uses</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="100"
                    {...field}
                    value={field.value === undefined ? "" : field.value}
                  />
                </FormControl>
                <FormDescription>
                  Maximum number of times this coupon can be used (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Start Date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the coupon becomes valid
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Date */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>No end date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the coupon expires (leave empty for no expiration)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Summer sale discount for all adventures"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Brief description of the coupon for internal reference
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Applies To */}
          <FormField
            control={form.control}
            name="appliesTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Applies To</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Adventures</SelectItem>
                    <SelectItem value="specific">Specific Adventures</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Scope of the coupon application
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Active Status */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Active Status</FormLabel>
                  <FormDescription>
                    Enable or disable this coupon
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Applicable Adventures (conditional) */}
        {appliesTo === "specific" && (
          <FormField
            control={form.control}
            name="applicableAdventures"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Adventures</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {adventures.map((adventure) => (
                      <div
                        key={adventure.value}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={adventure.value}
                          value={adventure.value}
                          checked={(field.value || []).includes(adventure.value)}
                          onChange={(e) => {
                            const values = new Set(field.value || []);
                            if (e.target.checked) {
                              values.add(adventure.value);
                            } else {
                              values.delete(adventure.value);
                            }
                            field.onChange(Array.from(values));
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label
                          htmlFor={adventure.value}
                          className="text-sm font-medium"
                        >
                          {adventure.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </FormControl>
                <FormDescription>
                  Select which adventures this coupon can be used for
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/control-panel/coupons")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialData ? "Update Coupon" : "Create Coupon"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 