import mongoose, { Schema, Document } from 'mongoose';

interface ICompany extends Document {
  name: string;
  nationalCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  financialYearStart: Date;
  financialYearEnd: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'نام شرکت الزامی است'],
      trim: true,
      maxlength: [200, 'نام شرکت نباید بیش از ۲۰۰ کاراکتر باشد']
    },
    nationalCode: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          // Persian national code validation
          return /^[0-9]{10,11}$/.test(v);
        },
        message: 'کد ملی یا شناسه ملی صحیح نیست'
      }
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'آدرس نباید بیش از ۵۰۰ کاراکتر باشد']
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          return /^[0-9+\-\s()]+$/.test(v);
        },
        message: 'شماره تلفن صحیح نیست'
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'ایمیل صحیح نیست'
      }
    },
    financialYearStart: {
      type: Date,
      required: [true, 'تاریخ شروع سال مالی الزامی است']
    },
    financialYearEnd: {
      type: Date,
      required: [true, 'تاریخ پایان سال مالی الزامی است']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure only one active company at a time
CompanySchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);