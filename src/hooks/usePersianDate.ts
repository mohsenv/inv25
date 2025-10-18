"use client"

import { useState, useCallback } from "react"
import { 
  formatPersianDateString, 
  parsePersianDate, 
  validatePersianDate,
  jalaaliToGregorian,
  gregorianToJalaali,
  isPersianLeapYear
} from "@/lib/persian"

/**
 * Hook for managing Persian date values in forms
 */
export function usePersianDate(initialValue?: Date) {
  const [date, setDate] = useState<Date | undefined>(initialValue)
  const [error, setError] = useState<string>("")

  const setValue = useCallback((newDate: Date | undefined) => {
    setDate(newDate)
    setError("")
  }, [])

  const setValueFromString = useCallback((dateString: string) => {
    if (!dateString.trim()) {
      setDate(undefined)
      setError("")
      return
    }

    const parsedDate = parsePersianDate(dateString)
    if (parsedDate) {
      setDate(parsedDate)
      setError("")
    } else {
      setError("تاریخ وارد شده صحیح نیست")
    }
  }, [])

  const getDisplayValue = useCallback(() => {
    return date ? formatPersianDateString(date) : ""
  }, [date])

  const validate = useCallback((required: boolean = false) => {
    if (required && !date) {
      setError("این فیلد الزامی است")
      return false
    }
    setError("")
    return true
  }, [date])

  return {
    date,
    setValue,
    setValueFromString,
    getDisplayValue,
    validate,
    error,
    hasError: !!error
  }
}

/**
 * Hook for managing Persian date ranges (start and end dates)
 */
export function usePersianDateRange(
  initialStart?: Date,
  initialEnd?: Date
) {
  const startDate = usePersianDate(initialStart)
  const endDate = usePersianDate(initialEnd)
  const [rangeError, setRangeError] = useState<string>("")

  const validateRange = useCallback(() => {
    if (startDate.date && endDate.date && startDate.date > endDate.date) {
      setRangeError("تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد")
      return false
    }
    setRangeError("")
    return true
  }, [startDate.date, endDate.date])

  const setFiscalYear = useCallback((yearOffset: number = 0) => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear() + yearOffset
    
    // Persian fiscal year: March 21 to March 19 next year
    const start = new Date(currentYear, 2, 21) // March 21
    const end = new Date(currentYear + 1, 2, 19) // March 19 next year
    
    startDate.setValue(start)
    endDate.setValue(end)
    setRangeError("")
  }, [startDate, endDate])

  return {
    startDate,
    endDate,
    rangeError,
    validateRange,
    setFiscalYear,
    hasRangeError: !!rangeError
  }
}

/**
 * Utility functions for common Persian date operations
 */
export const persianDateUtils = {
  /**
   * Get current Persian date components
   */
  getCurrentPersian() {
    const now = new Date()
    return gregorianToJalaali(now)
  },

  /**
   * Create a date for first day of Persian month
   */
  getFirstDayOfPersianMonth(year: number, month: number) {
    return jalaaliToGregorian(year, month, 1)
  },

  /**
   * Create a date for last day of Persian month
   */
  getLastDayOfPersianMonth(year: number, month: number) {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const firstDayNextMonth = jalaaliToGregorian(nextYear, nextMonth, 1)
    return new Date(firstDayNextMonth.getTime() - 24 * 60 * 60 * 1000) // Subtract one day
  },

  /**
   * Get Persian year boundaries (1 Farvardin to 29/30 Esfand)
   */
  getPersianYearBoundaries(persianYear: number) {
    const start = jalaaliToGregorian(persianYear, 1, 1) // 1 Farvardin
    // Use the actual last day of Esfand (29 or 30 depending on leap year)
    const lastDayOfEsfand = isPersianLeapYear(persianYear) ? 30 : 29;
    const end = jalaaliToGregorian(persianYear, 12, lastDayOfEsfand) // 29/30 Esfand
    return { start, end }
  },

  /**
   * Get all Persian months for a year
   */
  getPersianMonthsInYear(persianYear: number) {
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      return {
        month,
        name: [
          'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
          'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ][index],
        firstDay: jalaaliToGregorian(persianYear, month, 1),
        lastDay: this.getLastDayOfPersianMonth(persianYear, month)
      }
    })
  },

  /**
   * Check if a date falls within Persian fiscal year
   */
  isInPersianFiscalYear(date: Date, fiscalYearStart: Date) {
    const fiscalYearEnd = new Date(fiscalYearStart.getFullYear() + 1, fiscalYearStart.getMonth(), fiscalYearStart.getDate() - 1)
    return date >= fiscalYearStart && date <= fiscalYearEnd
  }
}