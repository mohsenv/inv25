"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  formatPersianDateString,
  parsePersianDate,
  gregorianToJalaali,
  jalaaliToGregorian,
  persianMonths,
  englishToPersian,
  persianToEnglish,
  getPersianMonthDays,
  validatePersianDate
} from "@/lib/persian"

export interface PersianDatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  name?: string
  required?: boolean
}

export function PersianDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  disabled = false,
  className,
  name,
  required = false
}: PersianDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(value || new Date())

  // Update input value when value prop changes
  React.useEffect(() => {
    if (value) {
      setInputValue(formatPersianDateString(value))
      setSelectedDate(value)
      setCurrentMonth(value)
    } else {
      setInputValue("")
      setSelectedDate(undefined)
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Try to parse the date as user types
    const parsedDate = parsePersianDate(newValue)
    if (parsedDate) {
      setSelectedDate(parsedDate)
      setCurrentMonth(parsedDate)
      onChange?.(parsedDate)
    } else if (newValue === "") {
      setSelectedDate(undefined)
      onChange?.(undefined)
    }
  }

  const handleInputBlur = () => {
    // Validate and format the input on blur
    if (inputValue && !validatePersianDate(inputValue)) {
      // Reset to previous valid value or empty
      if (selectedDate) {
        setInputValue(formatPersianDateString(selectedDate))
      } else {
        setInputValue("")
      }
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setInputValue(formatPersianDateString(date))
      onChange?.(date)
      setOpen(false)
    }
  }

  // Custom calendar component for Persian dates
  const PersianCalendar = () => {
    const currentJalaali = gregorianToJalaali(currentMonth)
    const daysInMonth = getPersianMonthDays(currentJalaali.jy, currentJalaali.jm)
    const firstDayOfMonth = jalaaliToGregorian(currentJalaali.jy, currentJalaali.jm, 1)
    const startDayOfWeek = (firstDayOfMonth.getDay() + 1) % 7 // Adjust for Persian week (Saturday = 0)

    const navigateMonth = (direction: 'prev' | 'next') => {
      let newMonth = currentJalaali.jm + (direction === 'next' ? 1 : -1)
      let newYear = currentJalaali.jy

      if (newMonth > 12) {
        newMonth = 1
        newYear += 1
      } else if (newMonth < 1) {
        newMonth = 12
        newYear -= 1
      }

      setCurrentMonth(jalaaliToGregorian(newYear, newMonth, 1))
    }

    const renderCalendarDays = () => {
      const days = []
      
      // Empty cells for days before month starts
      for (let i = 0; i < startDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} className="p-2"></div>)
      }

      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateForDay = jalaaliToGregorian(currentJalaali.jy, currentJalaali.jm, day)
        const isSelected = selectedDate && 
          dateForDay.getTime() === selectedDate.getTime()
        const isToday = new Date().toDateString() === dateForDay.toDateString()

        days.push(
          <button
            key={day}
            onClick={() => handleDateSelect(dateForDay)}
            className={cn(
              "p-2 text-sm rounded-md hover:bg-gray-100 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              isSelected && "bg-blue-500 text-white hover:bg-blue-600",
              isToday && !isSelected && "bg-blue-100 text-blue-900"
            )}
          >
            {englishToPersian(day.toString())}
          </button>
        )
      }

      return days
    }

    return (
      <div className="p-3 space-y-3">
        {/* Header with month/year navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="font-medium text-sm">
            {persianMonths[currentJalaali.jm - 1]} {englishToPersian(currentJalaali.jy.toString())}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
          <div>ش</div>
          <div>ی</div>
          <div>د</div>
          <div>س</div>
          <div>چ</div>
          <div>پ</div>
          <div>ج</div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            name={name}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(
              "text-right pr-10 font-mono",
              className
            )}
            dir="rtl"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => !disabled && setOpen(true)}
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-0" align="start">
        <PersianCalendar />
      </PopoverContent>
    </Popover>
  )
}

// Form field wrapper component
export interface PersianDateFieldProps extends PersianDatePickerProps {
  label?: string
  error?: string
  helperText?: string
}

export function PersianDateField({
  label,
  error,
  helperText,
  className,
  ...props
}: PersianDateFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-right block">
          {label}
          {props.required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <PersianDatePicker {...props} />
      
      {error && (
        <p className="text-sm text-red-600 text-right">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 text-right">{helperText}</p>
      )}
    </div>
  )
}