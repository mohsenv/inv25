import mongoose, { Schema, Document } from 'mongoose';

interface IProduct extends Document {
  name: string;
  code: string;
  description?: string;
  unit: string;
  category?: string;
  minimumStock?: number;
  maximumStock?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'نام کالا الزامی است'],
      trim: true,
      maxlength: [200, 'نام کالا نباید بیش از ۲۰۰ کاراکتر باشد']
    },
    code: {
      type: String,
      required: [true, 'کد کالا الزامی است'],
      trim: true,
      maxlength: [50, 'کد کالا نباید بیش از ۵۰ کاراکتر باشد']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'توضیحات نباید بیش از ۱۰۰۰ کاراکتر باشد']
    },
    unit: {
      type: String,
      required: [true, 'واحد کالا الزامی است'],
      trim: true,
      maxlength: [50, 'واحد نباید بیش از ۵۰ کاراکتر باشد'],
      enum: {
        values: [
          'عدد', 'کیلوگرم', 'گرم', 'تن', 'لیتر', 'میلی‌لیتر', 'متر', 'سانتی‌متر', 
          'متر مربع', 'متر مکعب', 'جعبه', 'بسته', 'کارتن', 'دستگاه', 'جفت', 
          'ست', 'رول', 'ورق', 'شاخه', 'بطری', 'قوطی', 'بشکه', 'کیسه'
        ],
        message: 'واحد انتخاب شده معتبر نیست'
      }
    },
    category: {
      type: String,
      trim: true,
      maxlength: [100, 'دسته‌بندی نباید بیش از ۱۰۰ کاراکتر باشد']
    },
    minimumStock: {
      type: Number,
      min: [0, 'حداقل موجودی نمی‌تواند منفی باشد'],
      default: 0
    },
    maximumStock: {
      type: Number,
      min: [0, 'حداکثر موجودی نمی‌تواند منفی باشد'],
      validate: {
        validator: function(this: IProduct, v: number) {
          return !this.minimumStock || !v || v >= this.minimumStock;
        },
        message: 'حداکثر موجودی باید بیشتر از حداقل موجودی باشد'
      }
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

// Indexes for better query performance
ProductSchema.index({ name: 'text', code: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);