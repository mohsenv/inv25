"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { PersianDatePicker, PersianDateField } from "@/components/ui/persian-date-picker"
import { usePersianDateRange } from "@/hooks/usePersianDate"
import { 
  formatPersianDateString, 
  formatPersianDate,
  persianText,
  englishToPersian
} from "@/lib/persian"

// Schema for the demo form
const demoFormSchema = z.object({
  name: z.string().min(1, "نام الزامی است"),
  startDate: z.date().refine((date) => date !== undefined, {
    message: "تاریخ شروع الزامی است"
  }),
  endDate: z.date().refine((date) => date !== undefined, {
    message: "تاریخ پایان الزامی است"
  }),
  optionalDate: z.date().optional(),
})

type DemoFormData = z.infer<typeof demoFormSchema>

export default function PersianDateDemo() {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [formSubmitResult, setFormSubmitResult] = useState<string>("")

  // Form setup
  const form = useForm<DemoFormData>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      name: "",
      startDate: undefined,
      endDate: undefined,
      optionalDate: undefined,
    },
  })

  // Date range hook demonstration
  const fiscalYear = usePersianDateRange()

  const handleFormSubmit = (data: DemoFormData) => {
    // Show how dates are stored as Date objects but can be formatted for display
    const result = {
      name: data.name,
      startDate: data.startDate.toISOString(), // Stored as ISO string in database
      startDatePersian: formatPersianDateString(data.startDate), // Display format
      endDate: data.endDate.toISOString(),
      endDatePersian: formatPersianDateString(data.endDate),
      optionalDate: data.optionalDate?.toISOString() || null,
      optionalDatePersian: data.optionalDate ? formatPersianDateString(data.optionalDate) : null,
    }
    
    setFormSubmitResult(JSON.stringify(result, null, 2))
    console.log("Form submitted with data:", result)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto space-y-8 px-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            نمونه انتخابگر تاریخ شمسی
          </h1>
          <p className="mt-2 text-gray-600">
            تاریخ‌ها به صورت شمسی نمایش داده می‌شوند اما به صورت میلادی در دیتابیس ذخیره می‌شوند
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Standalone Date Picker Examples */}
          <Card>
            <CardHeader>
              <CardTitle>انتخابگر تاریخ مستقل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic date picker */}
              <div>
                <h3 className="font-medium mb-2">انتخابگر ساده</h3>
                <PersianDatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  placeholder="انتخاب تاریخ"
                />
                {selectedDate && (
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>تاریخ شمسی: {formatPersianDateString(selectedDate)}</p>
                    <p>تاریخ میلادی: {selectedDate.toDateString()}</p>
                    <p>ISO String: {selectedDate.toISOString()}</p>
                  </div>
                )}
              </div>

              {/* Date field with label */}
              <div>
                <h3 className="font-medium mb-2">فیلد تاریخ با برچسب</h3>
                <PersianDateField
                  label="تاریخ تولد"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  placeholder="انتخاب تاریخ تولد"
                  helperText="تاریخ را به صورت شمسی وارد کنید"
                />
              </div>

              {/* Date range example */}
              <div>
                <h3 className="font-medium mb-2">محدوده تاریخ (سال مالی)</h3>
                <div className="space-y-4">
                  <PersianDateField
                    label="شروع سال مالی"
                    value={fiscalYear.startDate.date}
                    onChange={fiscalYear.startDate.setValue}
                    placeholder="تاریخ شروع"
                    error={fiscalYear.startDate.error || fiscalYear.rangeError}
                  />
                  <PersianDateField
                    label="پایان سال مالی"
                    value={fiscalYear.endDate.date}
                    onChange={fiscalYear.endDate.setValue}
                    placeholder="تاریخ پایان"
                    error={fiscalYear.endDate.error}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => fiscalYear.setFiscalYear(0)}
                      size="sm"
                      variant="outline"
                    >
                      سال جاری
                    </Button>
                    <Button
                      onClick={() => fiscalYear.setFiscalYear(1)}
                      size="sm"
                      variant="outline"
                    >
                      سال آینده
                    </Button>
                  </div>
                  {(fiscalYear.startDate.date && fiscalYear.endDate.date) && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <p>شروع: {formatPersianDate(fiscalYear.startDate.date)}</p>
                      <p>پایان: {formatPersianDate(fiscalYear.endDate.date)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Integration Example */}
          <Card>
            <CardHeader>
              <CardTitle>نمونه فرم با تاریخ شمسی</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام پروژه *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="نام پروژه را وارد کنید"
                            className="text-right"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <PersianDateField
                          label="تاریخ شروع پروژه *"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="انتخاب تاریخ شروع"
                          required
                          error={form.formState.errors.startDate?.message}
                        />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <PersianDateField
                          label="تاریخ پایان پروژه *"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="انتخاب تاریخ پایان"
                          required
                          error={form.formState.errors.endDate?.message}
                        />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="optionalDate"
                    render={({ field }) => (
                      <FormItem>
                        <PersianDateField
                          label="تاریخ اختیاری"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="انتخاب تاریخ (اختیاری)"
                          helperText="این فیلد اختیاری است"
                        />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    ارسال فرم
                  </Button>
                </form>
              </Form>

              {/* Form submission result */}
              {formSubmitResult && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">نتیجه ارسال فرم:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
                    {formSubmitResult}
                  </pre>
                  <p className="text-sm text-gray-600 mt-2">
                    ✅ تاریخ‌ها به صورت Date object در فرم و ISO string در دیتابیس ذخیره می‌شوند
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>نحوه استفاده</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <h4>ویژگی‌های کلیدی:</h4>
              <ul className="space-y-2 text-sm">
                <li>✅ نمایش تاریخ‌ها به صورت شمسی برای کاربر</li>
                <li>✅ ذخیره تاریخ‌ها به صورت میلادی (Date object) در دیتابیس</li>
                <li>✅ ورودی دستی تاریخ با اعتبارسنجی</li>
                <li>✅ تقویم شمسی قابل کلیک</li>
                <li>✅ پشتیبانی از اعداد فارسی و انگلیسی</li>
                <li>✅ سازگاری کامل با React Hook Form</li>
                <li>✅ پشتیبانی از Zod validation</li>
                <li>✅ طراحی RTL و UI سازگار با Tailwind</li>
              </ul>

              <h4 className="mt-4">مثال کد:</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
{`import { PersianDateField } from "@/components/ui/persian-date-picker"

// در کامپوننت فرم
<PersianDateField
  label="تاریخ شروع"
  value={date}
  onChange={setDate}
  placeholder="انتخاب تاریخ"
  required
  error={errorMessage}
/>`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}