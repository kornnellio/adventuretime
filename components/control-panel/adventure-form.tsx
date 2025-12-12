'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Editor } from '@tinymce/tinymce-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, ImagePlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { IAdventure } from '@/lib/models/adventure';
import { createAdventure, updateAdventure } from '@/lib/actions/adventure';
import { AdventureThumbnail } from '@/components/control-panel/adventure-thumbnail';
import { ImageUpload } from '@/components/ui/image-upload';
import { isDevelopmentMode } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox"

// Determine if we're in development mode
const isDevelopment = isDevelopmentMode();

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters long",
  }),
  images: z.array(z.string()).min(isDevelopment ? 0 : 1, {
    message: "At least one image is required",
  }),
  dates: z.array(
    z.object({
      startDate: z.date(),
      endDate: z.date(),
    })
  ),
  price: z.number().min(0, {
    message: "Price must be a positive number",
  }),
  includedItems: z.array(z.string()),
  additionalInfo: z.array(z.string()),
  location: z.string().min(1, {
    message: "Location is required",
  }),
  meetingPoint: z.string().optional(),
  difficulty: z.enum(['easy', 'moderate', 'hard', 'extreme']),
  duration: z.object({
    value: z.number().min(1, {
      message: "Duration value must be at least 1",
    }),
    unit: z.enum(['hours', 'days']),
  }),
  shortDescription: z.string().min(1, {
    message: "Short description is required",
  }),
  longDescription: z.string().min(1, {
    message: "Long description is required",
  }),
  advancePaymentPercentage: z.number().min(0).max(100, {
    message: "Advance payment percentage must be between 0 and 100",
  }),
  bookingCutoffHour: z.number().min(0).max(23).nullable().optional(),
  availableKayakTypes: z.object({
    caiacSingle: z.boolean().default(true),
    caiacDublu: z.boolean().default(false),
    placaSUP: z.boolean().default(false),
  }).default({
    caiacSingle: true,
    caiacDublu: false,
    placaSUP: false,
  }),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.object({
    daysOfWeek: z.array(z.number().min(0).max(6)),
    year: z.number().min(new Date().getFullYear()).max(new Date().getFullYear() + 10),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AdventureFormProps {
  adventure?: Partial<IAdventure> & { _id?: string };
  isEditing?: boolean;
}

export default function AdventureForm({ adventure, isEditing = false }: AdventureFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [includedItemText, setIncludedItemText] = useState<string[]>(adventure?.includedItems || ['']);
  const [additionalInfoText, setAdditionalInfoText] = useState<string[]>(adventure?.additionalInfo || ['']);
  
  // Update state to use the new date structure
  const [datePairs, setDatePairs] = useState<{ startDate: Date; endDate: Date }[]>(() => {
    // If adventure already has the new dates structure
    if (adventure?.dates && Array.isArray(adventure.dates) && adventure.dates.length > 0 && 
        typeof adventure.dates[0] === 'object' && adventure.dates[0] !== null && 
        'startDate' in (adventure.dates[0] as any)) {
      return (adventure.dates as unknown as { startDate: string | Date; endDate: string | Date }[])
        .map(datePair => ({
          startDate: new Date(datePair.startDate),
          endDate: new Date(datePair.endDate)
        }));
    }
    
    // Handle legacy format with date/endDate + dates/endDates arrays
    const pairs: { startDate: Date; endDate: Date }[] = [];
    
    // Add main date pair if it exists
    if (adventure?.date) {
      const startDate = new Date(adventure.date);
      let endDate: Date;
      
      if (adventure.endDate) {
        endDate = new Date(adventure.endDate);
      } else {
        // Default to one day after start date
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      }
      
      pairs.push({ startDate, endDate });
    }
    
    // Add additional dates if they exist
    const legacyDates = adventure?.dates as Date[] | undefined;
    const legacyEndDates = (adventure as any)?.endDates as Date[] | undefined;
    
    if (legacyDates && Array.isArray(legacyDates)) {
      legacyDates.forEach((date: Date | string, index: number) => {
        if (!date) return;
        
        const startDate = new Date(date);
        let endDate: Date;
        
        if (legacyEndDates && legacyEndDates[index]) {
          endDate = new Date(legacyEndDates[index]);
        } else {
          // Default to one day after start date
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
        }
        
        pairs.push({ startDate, endDate });
      });
    }
    
    // If no dates were found, provide a default date pair
    if (pairs.length === 0) {
      const startDate = new Date();
      startDate.setHours(12, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      pairs.push({ startDate, endDate });
    }
    
    return pairs;
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorKey, setEditorKey] = useState<number>(Date.now());
  
  // Create separate refs for both TinyMCE editors
  const shortEditorRef = useRef<any>(null);
  const longEditorRef = useRef<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: adventure?.title || '',
      images: adventure?.images || [],
      dates: datePairs,
      price: adventure?.price ? Number(adventure.price) : 0,
      includedItems: adventure?.includedItems || [],
      additionalInfo: adventure?.additionalInfo || [],
      location: adventure?.location || '',
      meetingPoint: adventure?.meetingPoint || '',
      difficulty: adventure?.difficulty || 'moderate',
      duration: {
        value: adventure?.duration?.value ? Number(adventure.duration.value) : 1,
        unit: adventure?.duration?.unit || 'days',
      },
      shortDescription: adventure?.shortDescription || '',
      longDescription: adventure?.longDescription || '',
      advancePaymentPercentage: adventure?.advancePaymentPercentage ? Number(adventure.advancePaymentPercentage) : 30,
      bookingCutoffHour: adventure?.bookingCutoffHour !== undefined && adventure?.bookingCutoffHour !== null 
        ? Number(adventure.bookingCutoffHour) 
        : null,
      availableKayakTypes: adventure?.availableKayakTypes || {
        caiacSingle: true,
        caiacDublu: false,
        placaSUP: false,
      },
      isRecurring: adventure?.isRecurring || false,
      recurringPattern: adventure?.recurringPattern || {
        daysOfWeek: [],
        year: new Date().getFullYear(),
        startTime: '',
        endTime: '',
      },
    },
  });

  const handleBulletPointChange = (
    type: 'included' | 'additional',
    index: number,
    value: string
  ) => {
    if (type === 'included') {
      const newItems = [...includedItemText];
      newItems[index] = value;
      setIncludedItemText(newItems);
    } else {
      const newItems = [...additionalInfoText];
      newItems[index] = value;
      setAdditionalInfoText(newItems);
    }
  };

  const addBulletPoint = (type: 'included' | 'additional') => {
    if (type === 'included') {
      setIncludedItemText([...includedItemText, '']);
    } else {
      setAdditionalInfoText([...additionalInfoText, '']);
    }
  };

  const removeBulletPoint = (type: 'included' | 'additional', index: number) => {
    if (type === 'included') {
      setIncludedItemText(includedItemText.filter((_, i) => i !== index));
    } else {
      setAdditionalInfoText(additionalInfoText.filter((_, i) => i !== index));
    }
  };

  useEffect(() => {
    form.setValue(
      'includedItems',
      includedItemText.filter((item) => item.trim() !== '')
    );
    form.setValue(
      'additionalInfo',
      additionalInfoText.filter((item) => item.trim() !== '')
    );
    
    // Set the dates array with the current date pairs (only if not recurring)
    if (!form.watch('isRecurring')) {
      const formDates: Array<{startDate: Date; endDate: Date}> = [...datePairs];
      form.setValue('dates', formDates);
    }
  }, [includedItemText, additionalInfoText, datePairs, form]);

  // Effect to handle recurring pattern changes
  useEffect(() => {
    const isRecurring = form.watch('isRecurring');
    const recurringPattern = form.watch('recurringPattern');
    
    if (isRecurring && recurringPattern && recurringPattern.daysOfWeek && recurringPattern.daysOfWeek.length > 0) {
      // Generate and set recurring dates
      const duration = form.watch('duration');
      const generatedDates = generateRecurringDates(
        recurringPattern.daysOfWeek,
        recurringPattern.year,
        recurringPattern.startTime,
        recurringPattern.endTime,
        duration
      );
      form.setValue('dates', generatedDates);
    } else if (!isRecurring) {
      // If not recurring, use manual date pairs
      const formDates: Array<{startDate: Date; endDate: Date}> = [...datePairs];
      form.setValue('dates', formDates);
    }
  }, [
    form.watch('isRecurring'),
    form.watch('recurringPattern.daysOfWeek'),
    form.watch('recurringPattern.year'),
    form.watch('recurringPattern.startTime'),
    form.watch('recurringPattern.endTime'),
    form.watch('duration'),
    datePairs,
    form
  ]);

  // Helper function to format date for input fields
  const formatDate = (date: Date): string => {
    try {
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const addDate = () => {
    // Create new date pair with time set to noon to avoid timezone issues
    const startDate = new Date();
    startDate.setHours(12, 0, 0, 0);
    
    // Create end date (1 day after)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    
    setDatePairs([...datePairs, { startDate, endDate }]);
  };

  const removeDate = (index: number) => {
    setDatePairs(datePairs.filter((_, i) => i !== index));
  };

  const updateDate = (index: number, newDate: Date, isEndDate = false) => {
    try {
      // Ensure we're working with a valid date object
      if (isNaN(newDate.getTime())) {
        console.error('Invalid date input:', newDate);
        return;
      }
      
      // Set time to noon to avoid timezone issues
      newDate.setHours(12, 0, 0, 0);
      
      const updatedDatePairs = [...datePairs];
      
      if (isEndDate) {
        updatedDatePairs[index] = {
          ...updatedDatePairs[index],
          endDate: newDate
        };
      } else {
        updatedDatePairs[index] = {
          ...updatedDatePairs[index],
          startDate: newDate
        };
      }
      
      setDatePairs(updatedDatePairs);
    } catch (error) {
      console.error('Error updating date:', error);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Handle dates based on whether it's recurring or not
      let formattedDates;
      
      if (data.isRecurring && data.recurringPattern && data.recurringPattern.daysOfWeek.length > 0) {
        // Generate all dates for the year based on recurring pattern
        formattedDates = generateRecurringDates(
          data.recurringPattern.daysOfWeek,
          data.recurringPattern.year,
          data.recurringPattern.startTime,
          data.recurringPattern.endTime,
          data.duration
        );
      } else {
        // Use manual date pairs
        formattedDates = datePairs.map(pair => ({
          startDate: new Date(pair.startDate),
          endDate: new Date(pair.endDate)
        }));
      }

      // Parse numeric fields
      const price = parseFloat(String(data.price));
      data.price = isNaN(price) ? 0 : price;

      // Image handling
      let imagesToSubmit = data.images || [];
      // If in dev mode and no images, add a placeholder
      if (isDevelopmentMode() && (!imagesToSubmit || imagesToSubmit.length === 0)) {
        imagesToSubmit = ['/images/placeholder.jpg'];
      }

      const formData = {
        ...data,
        dates: formattedDates,
        images: imagesToSubmit,
        price,
        includedItems: includedItemText.filter(Boolean),
        additionalInfo: additionalInfoText.filter(Boolean),
        bookingCutoffHour: data.bookingCutoffHour === null || data.bookingCutoffHour === undefined 
          ? undefined 
          : Number(data.bookingCutoffHour),
        availableKayakTypes: data.availableKayakTypes,
        isRecurring: data.isRecurring,
        recurringPattern: data.isRecurring ? data.recurringPattern : undefined,
      };

      console.log('Submitting data:', { 
        isRecurring: formData.isRecurring, 
        recurringPattern: formData.recurringPattern,
        datesCount: formData.dates.length 
      });

      if (adventure) {
        // Update
        await updateAdventure(
          adventure._id?.toString() || '', 
          formData
        );
        toast({
          title: "Adventure updated!",
          description: "Your adventure has been updated successfully.",
        });
      } else {
        // Create
        await createAdventure(formData);
        toast({
          title: "Adventure created!",
          description: data.isRecurring 
            ? `Your recurring adventure has been created with ${formattedDates.length} dates for ${data.recurringPattern?.year}!`
            : "Your adventure has been created successfully.",
        });
      }
      
      router.push('/control-panel/adventures');
      router.refresh();
    } catch (error) {
      console.error('Error saving adventure:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while saving the adventure.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to generate recurring dates
  const generateRecurringDates = (
    daysOfWeek: number[],
    year: number,
    startTime?: string,
    endTime?: string,
    duration?: { value: number; unit: 'hours' | 'days' }
  ) => {
    const dates = [];
    const startDate = new Date(year, 0, 1); // January 1st of the selected year
    const endDate = new Date(year, 11, 31); // December 31st of the selected year

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      
      if (daysOfWeek.includes(dayOfWeek)) {
        const eventStartDate = new Date(d);
        const eventEndDate = new Date(d);

        // Set time if provided
        if (startTime) {
          const [hours, minutes] = startTime.split(':').map(Number);
          eventStartDate.setHours(hours, minutes, 0, 0);
        } else {
          eventStartDate.setHours(10, 0, 0, 0); // Default to 10:00 AM
        }

        if (endTime) {
          const [hours, minutes] = endTime.split(':').map(Number);
          eventEndDate.setHours(hours, minutes, 0, 0);
        } else if (duration) {
          // Calculate end time based on duration
          if (duration.unit === 'hours') {
            eventEndDate.setTime(eventStartDate.getTime() + duration.value * 60 * 60 * 1000);
          } else {
            eventEndDate.setDate(eventEndDate.getDate() + duration.value);
            eventEndDate.setHours(18, 0, 0, 0); // Default end time for multi-day events
          }
        } else {
          eventEndDate.setHours(18, 0, 0, 0); // Default to 6:00 PM
        }

        dates.push({
          startDate: eventStartDate,
          endDate: eventEndDate
        });
      }
    }

    return dates;
  };

  // Force re-render of editors if there are issues
  const resetEditor = () => {
    setEditorKey(Date.now());
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titlu</FormLabel>
                    <FormControl>
                      <Input placeholder="Aventură de drumeție montană" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagini</FormLabel>
                      <FormDescription>
                        Încarcă imagini pentru caruselul aventurii.
                      </FormDescription>
                      <FormControl>
                        <ImageUpload 
                          values={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                {form.watch('isRecurring') ? (
                  <div className="col-span-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Program Recurent Activat</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Datele aventurii vor fi generate automat pe baza programului recurent setat mai jos. 
                      Secțiunea de date manuale este dezactivată.
                    </p>
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="dates"
                    render={() => (
                      <FormItem>
                        <FormLabel>Date suplimentare (opțional)</FormLabel>
                        <div className="flex gap-3 mb-2 w-full flex-wrap">
                          {datePairs.length > 0 ? (
                            datePairs.map((datePair, index) => {
                              return (
                                <div
                                  key={index}
                                  className="relative flex items-center gap-2"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 mb-1">Început</span>
                                    <Input
                                      type="date"
                                      value={datePair.startDate instanceof Date && !isNaN(datePair.startDate.getTime()) 
                                        ? formatDate(datePair.startDate)
                                        : ''}
                                      onChange={(e) => {
                                        const dateValue = e.target.value;
                                        if (dateValue) {
                                          try {
                                            const newDate = new Date(dateValue);
                                            if (!isNaN(newDate.getTime())) {
                                              newDate.setHours(12, 0, 0, 0);
                                              updateDate(index, newDate);
                                            }
                                          } catch (error) {
                                            console.error("Error updating date:", error);
                                          }
                                        }
                                      }}
                                      className="pr-8 w-[180px]"
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 mb-1">Sfârșit</span>
                                    <Input
                                      type="date"
                                      value={datePair.endDate instanceof Date && !isNaN(datePair.endDate.getTime()) 
                                        ? formatDate(datePair.endDate)
                                        : ''}
                                      onChange={(e) => {
                                        const dateValue = e.target.value;
                                        if (dateValue) {
                                          try {
                                            const newDate = new Date(dateValue);
                                            if (!isNaN(newDate.getTime())) {
                                              newDate.setHours(12, 0, 0, 0);
                                              updateDate(index, newDate, true);
                                            }
                                          } catch (error) {
                                            console.error("Error updating end date:", error);
                                          }
                                        }
                                      }}
                                      className="pr-8 w-[180px]"
                                    />
                                  </div>
                                  <X
                                    onClick={() => removeDate(index)}
                                    className="absolute -right-6 top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer"
                                  />
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-gray-500">
                              Nu au fost adăugate date suplimentare
                            </p>
                          )}
                        </div>
                        <div>
                          <Button
                            type="button"
                            onClick={addDate}
                            variant="outline"
                            size="sm"
                            className="mt-4"
                          >
                            <Plus className="h-4 w-4 mr-2" /> Adaugă interval de date
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preț (RON)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value) || 0);
                          }}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="advancePaymentPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procentaj plată în avans (%)</FormLabel>
                      <FormDescription>
                        Procentajul din suma totală care trebuie plătit în avans pentru a rezerva această aventură.
                      </FormDescription>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value) || 0);
                          }}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Locație</FormLabel>
                      <FormControl>
                        <Input placeholder="Munții Bucegi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="meetingPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Punct de întâlnire</FormLabel>
                    <FormControl>
                      <Input placeholder="Cabana Babele" {...field} />
                    </FormControl>
                    <FormDescription>
                      Locul exact unde participanții se vor întâlni pentru aventură.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dificultate</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează dificultatea" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Ușor</SelectItem>
                          <SelectItem value="moderate">Moderat</SelectItem>
                          <SelectItem value="hard">Dificil</SelectItem>
                          <SelectItem value="extreme">Extrem</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Durată</FormLabel>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="duration.value"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value) || 1);
                              }}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration.unit"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Unitate" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hours">Ore</SelectItem>
                              <SelectItem value="days">Zile</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <FormLabel>Ce este inclus</FormLabel>
                  <FormDescription>
                    Adaugă detalii despre ce este inclus în această aventură.
                  </FormDescription>
                  <div className="space-y-2 mt-2">
                    {includedItemText.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) =>
                            handleBulletPointChange('included', index, e.target.value)
                          }
                          placeholder="ex: Ghid profesionist"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeBulletPoint('included', index)}
                          disabled={includedItemText.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => addBulletPoint('included')}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Adaugă element
                  </Button>
                </div>

                <div className="mt-6">
                  <FormLabel>Informații suplimentare</FormLabel>
                  <FormDescription>
                    Adaugă detalii suplimentare despre aventură.
                  </FormDescription>
                  <div className="space-y-2 mt-2">
                    {additionalInfoText.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={item}
                          onChange={(e) =>
                            handleBulletPointChange('additional', index, e.target.value)
                          }
                          placeholder="ex: Aduce pantofi confortabili de drumeție"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeBulletPoint('additional', index)}
                          disabled={additionalInfoText.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => addBulletPoint('additional')}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Adaugă element
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descriere Scurtă</FormLabel>
                  <FormDescription>
                    Furnizează o prezentare generală a aventurii (va fi afișată în cardurile de prezentare a aventurii).
                  </FormDescription>
                  <FormControl>
                    <Editor
                      key={`short-${editorKey}`}
                      onInit={(evt, editor) => {
                        shortEditorRef.current = editor;
                        // Focus the editor after initialization
                        setTimeout(() => {
                          editor.focus();
                        }, 100);
                      }}
                      initialValue={field.value}
                      tinymceScriptSrc="/tinymce/tinymce.min.js"
                      init={{
                        height: 200,
                        menubar: false,
                        plugins: [
                          'link', 'lists', 'autoresize', 'autolink', 'image', 'charmap',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'help', 'wordcount',
                          'emoticons'
                        ],
                        toolbar:
                          'undo redo | blocks | ' +
                          'bold italic forecolor | alignleft aligncenter ' +
                          'alignright alignjustify | bullist numlist outdent indent | ' +
                          'link | removeformat | help',
                        content_style: "body { font-family: Inter, sans-serif; font-size: 14px; direction: ltr; }",
                        branding: false,
                        base_url: '/tinymce',
                        directionality: 'ltr',
                        setup: (editor) => {
                          // Use a custom property to store selection state
                          const editorState: any = {
                            bookmark: null
                          };
                          
                          // Store selection before content change
                          editor.on('BeforeSetContent', () => {
                            if (editor.selection) {
                              editorState.bookmark = editor.selection.getBookmark(2, true);
                            }
                          });
                          
                          // Restore selection after content change
                          editor.on('SetContent', () => {
                            if (editor.selection && editorState.bookmark) {
                              editor.selection.moveToBookmark(editorState.bookmark);
                              editorState.bookmark = null;
                            }
                          });
                        },
                        forced_root_block: 'p',
                        forced_root_block_attrs: {
                          'class': 'mce-content-body'
                        },
                        entity_encoding: 'raw',
                        keep_styles: true,
                        cache_suffix: `?v=short-${editorKey}`,
                        newline_behavior: 'block',
                        text_patterns: [
                          { start: '*', end: '*', format: 'italic' },
                          { start: '**', end: '**', format: 'bold' },
                          { start: '#', format: 'h1' },
                          { start: '##', format: 'h2' },
                          { start: '###', format: 'h3' },
                          { start: '####', format: 'h4' },
                          { start: '#####', format: 'h5' },
                          { start: '######', format: 'h6' },
                          { start: '1. ', cmd: 'InsertOrderedList' },
                          { start: '* ', cmd: 'InsertUnorderedList' },
                          { start: '- ', cmd: 'InsertUnorderedList' }
                        ]
                      }}
                      onEditorChange={(content) => {
                        field.onChange(content);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="longDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descriere Detaliată</FormLabel>
                  <FormDescription>
                    Furnizează o descriere detaliată a aventurii (va fi afișată în pagina de detalii a aventurii).
                  </FormDescription>
                  <FormControl>
                    <Editor
                      key={`long-${editorKey}`}
                      onInit={(evt, editor) => {
                        longEditorRef.current = editor;
                        // Focus the editor after initialization
                        setTimeout(() => {
                          editor.focus();
                        }, 100);
                      }}
                      initialValue={field.value}
                      tinymceScriptSrc="/tinymce/tinymce.min.js"
                      init={{
                        height: 400,
                        menubar: false,
                        plugins: [
                          'link', 'lists', 'autoresize', 'autolink', 'image', 'charmap',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'help', 'wordcount',
                          'emoticons'
                        ],
                        toolbar:
                          'undo redo | blocks | ' +
                          'bold italic forecolor | alignleft aligncenter ' +
                          'alignright alignjustify | bullist numlist outdent indent | ' +
                          'link image media | removeformat | help',
                        content_style: "body { font-family: Inter, sans-serif; font-size: 14px; direction: ltr; }",
                        branding: false,
                        base_url: '/tinymce',
                        image_advtab: true,
                        file_picker_types: 'image',
                        automatic_uploads: true,
                        images_upload_url: '/api/upload',
                        images_reuse_filename: true,
                        directionality: 'ltr',
                        setup: (editor) => {
                          // Use a custom property to store selection state
                          const editorState: any = {
                            bookmark: null
                          };
                          
                          // Store selection before content change
                          editor.on('BeforeSetContent', () => {
                            if (editor.selection) {
                              editorState.bookmark = editor.selection.getBookmark(2, true);
                            }
                          });
                          
                          // Restore selection after content change
                          editor.on('SetContent', () => {
                            if (editor.selection && editorState.bookmark) {
                              editor.selection.moveToBookmark(editorState.bookmark);
                              editorState.bookmark = null;
                            }
                          });
                        },
                        forced_root_block: 'p',
                        forced_root_block_attrs: {
                          'class': 'mce-content-body'
                        },
                        entity_encoding: 'raw',
                        keep_styles: true,
                        cache_suffix: `?v=long-${editorKey}`,
                        newline_behavior: 'block',
                        text_patterns: [
                          { start: '*', end: '*', format: 'italic' },
                          { start: '**', end: '**', format: 'bold' },
                          { start: '#', format: 'h1' },
                          { start: '##', format: 'h2' },
                          { start: '###', format: 'h3' },
                          { start: '####', format: 'h4' },
                          { start: '#####', format: 'h5' },
                          { start: '######', format: 'h6' },
                          { start: '1. ', cmd: 'InsertOrderedList' },
                          { start: '* ', cmd: 'InsertUnorderedList' },
                          { start: '- ', cmd: 'InsertUnorderedList' }
                        ]
                      }}
                      onEditorChange={(content) => {
                        field.onChange(content);
                      }}
                      onPaste={(e, editor) => {
                        // Let TinyMCE handle the paste event normally
                        return true;
                      }}
                    />
                  </FormControl>
                  <div className="mt-2 flex justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={resetEditor}
                    >
                      Resetează Editor
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="mt-4">
          <FormField
            control={form.control}
            name="bookingCutoffHour"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ora Limită Rezervare (în aceeași zi)</FormLabel>
                <FormDescription>
                  Optional: Setează ora (0-23) până la care se pot face rezervări în ziua aventurii. Lasă gol dacă nu se aplică.
                </FormDescription>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    max="23" 
                    placeholder="Ex: 10 (pentru ora 10:00)"
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string to represent null, otherwise parse as number
                      field.onChange(value === '' ? null : parseInt(value, 10));
                    }}
                    // Handle null/undefined display
                    value={field.value === null || field.value === undefined ? '' : String(field.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Kayak Types Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Tipuri de ambarcațiuni disponibile</h3>
              <p className="text-sm text-muted-foreground">
                Selectează tipurile de ambarcațiuni disponibile pentru această aventură
              </p>
            </div>

            <FormField
              control={form.control}
              name="availableKayakTypes.caiacSingle"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Caiac Single <span className="text-muted-foreground text-sm">(preț standard)</span>
                    </FormLabel>
                    <FormDescription>
                      Caiac pentru o singură persoană
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availableKayakTypes.caiacDublu"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Caiac Dublu <span className="text-muted-foreground text-sm">(preț dublu)</span>
                    </FormLabel>
                    <FormDescription>
                      Caiac pentru două persoane (va costa de 2 ori prețul de bază)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availableKayakTypes.placaSUP"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Placă SUP <span className="text-muted-foreground text-sm">(preț standard)</span>
                    </FormLabel>
                    <FormDescription>
                      Placă de Stand-Up Paddle (SUP)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Recurring Schedule Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Program recurent</h3>
              <p className="text-sm text-muted-foreground">
                Setează aventura să se repete în anumite zile din săptămână pe tot parcursul unui an
              </p>
              {isEditing && adventure?.isRecurring && (
                <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Atenție:</strong> Această aventură are deja un program recurent activ. 
                    Modificarea setărilor recurente va regenera toate datele și va înlocui 
                    programul existent.
                  </p>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mb-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Activează programul recurent
                    </FormLabel>
                    <FormDescription>
                      Aventura se va repeta în zilele selectate pe tot parcursul anului ales
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch('isRecurring') && (
              <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
                <div>
                  <FormLabel className="text-base font-medium">Zilele săptămânii</FormLabel>
                  <FormDescription className="mb-3">
                    Selectează zilele în care aventura se va desfășura
                  </FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { value: 1, label: 'Luni' },
                      { value: 2, label: 'Marți' },
                      { value: 3, label: 'Miercuri' },
                      { value: 4, label: 'Joi' },
                      { value: 5, label: 'Vineri' },
                      { value: 6, label: 'Sâmbătă' },
                      { value: 0, label: 'Duminică' }
                    ].map((day) => (
                      <FormField
                        key={day.value}
                        control={form.control}
                        name="recurringPattern.daysOfWeek"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day.value) || false}
                                onCheckedChange={(checked) => {
                                  const currentDays = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentDays, day.value].sort());
                                  } else {
                                    field.onChange(currentDays.filter((d) => d !== day.value));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {day.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="recurringPattern.year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anul</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selectează anul" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 5 }, (_, i) => {
                              const year = new Date().getFullYear() + i;
                              return (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurringPattern.startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ora de început (opțional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field}
                            placeholder="10:00"
                          />
                        </FormControl>
                        <FormDescription>
                          Ora la care începe aventura
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurringPattern.endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ora de sfârșit (opțional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field}
                            placeholder="16:00"
                          />
                        </FormControl>
                        <FormDescription>
                          Ora la care se termină aventura
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch('recurringPattern.daysOfWeek')?.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Previzualizare:</strong> Aventura se va desfășura în fiecare{' '}
                      {form.watch('recurringPattern.daysOfWeek')?.map(day => {
                        const dayNames = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
                        return dayNames[day];
                      }).join(', ')}{' '}
                      din anul {form.watch('recurringPattern.year')}.
                      {form.watch('recurringPattern.startTime') && form.watch('recurringPattern.endTime') && (
                        <> Orele: {form.watch('recurringPattern.startTime')} - {form.watch('recurringPattern.endTime')}</>
                      )}
                      <br />
                      <strong>Total de {(() => {
                        const pattern = form.watch('recurringPattern');
                        const duration = form.watch('duration');
                        if (pattern && pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
                          const testDates = generateRecurringDates(
                            pattern.daysOfWeek,
                            pattern.year,
                            pattern.startTime,
                            pattern.endTime,
                            duration
                          );
                          return testDates.length;
                        }
                        return 0;
                      })()} evenimente</strong> vor fi generate pentru acest an.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/control-panel/adventures')}
          >
            Anulează
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Se salvează...' : isEditing ? 'Actualizează Aventura' : 'Creează Aventura'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 
