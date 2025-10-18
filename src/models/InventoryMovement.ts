import mongoose, { Schema, Document } from 'mongoose';

enum MovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  INITIAL_STOCK = 'INITIAL_STOCK'
}

interface IInventoryMovement extends Document {
  product: mongoose.Types.ObjectId;
  movementType: MovementType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  averagePrice?: number;
  description?: string;
  document?: mongoose.Types.ObjectId;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryMovementSchema: Schema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'کالا الزامی است'],
      index: true
    },
    movementType: {
      type: String,
      required: [true, 'نوع حرکت الزامی است'],
      enum: {
        values: Object.values(MovementType),
        message: 'نوع حرکت معتبر نیست'
      },
      index: true
    },
    quantity: {
      type: Number,
      required: [true, 'تعداد الزامی است'],
      validate: {
        validator: function(this: IInventoryMovement, v: number) {
          // For outgoing movements, quantity should be negative
          if (this.movementType === MovementType.SALE || this.movementType === MovementType.ADJUSTMENT_OUT) {
            return v < 0;
          }
          // For incoming movements, quantity should be positive
          return v > 0;
        },
        message: 'تعداد برای نوع حرکت انتخابی صحیح نیست'
      }
    },
    unitPrice: {
      type: Number,
      required: [true, 'قیمت واحد الزامی است'],
      min: [0, 'قیمت واحد نمی‌تواند منفی باشد']
    },
    totalPrice: {
      type: Number,
      required: [true, 'مبلغ کل الزامی است']
    },
    averagePrice: {
      type: Number,
      min: [0, 'قیمت میانگین نمی‌تواند منفی باشد']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'توضیحات نباید بیش از ۵۰۰ کاراکتر باشد']
    },
    document: {
      type: Schema.Types.ObjectId,
      ref: 'Document'
    },
    date: {
      type: Date,
      required: [true, 'تاریخ حرکت الزامی است'],
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Pre-save middleware to calculate total price
InventoryMovementSchema.pre('save', function(this: IInventoryMovement, next) {
  this.totalPrice = Math.abs(this.quantity) * this.unitPrice;
  next();
});

// Compound indexes for better query performance
InventoryMovementSchema.index({ product: 1, date: -1 });
InventoryMovementSchema.index({ product: 1, movementType: 1 });
InventoryMovementSchema.index({ date: -1, movementType: 1 });
InventoryMovementSchema.index({ document: 1 });

// Method to calculate average price for a product
InventoryMovementSchema.statics.calculateAveragePrice = async function(productId: mongoose.Types.ObjectId, upToDate?: Date) {
  const matchStage: any = {
    product: productId,
    movementType: { $in: [MovementType.PURCHASE, MovementType.INITIAL_STOCK, MovementType.ADJUSTMENT_IN] }
  };
  
  if (upToDate) {
    matchStage.date = { $lte: upToDate };
  }

  const result = await this.aggregate([
    { $match: matchStage },
    { $sort: { date: 1 } },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: '$totalPrice' }
      }
    }
  ]);

  if (result.length > 0 && result[0].totalQuantity > 0) {
    return result[0].totalValue / result[0].totalQuantity;
  }
  
  return 0;
};

// Method to get current stock for a product
InventoryMovementSchema.statics.getCurrentStock = async function(productId: mongoose.Types.ObjectId, upToDate?: Date) {
  const matchStage: any = { product: productId };
  
  if (upToDate) {
    matchStage.date = { $lte: upToDate };
  }

  const result = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  return result.length > 0 ? result[0].totalQuantity : 0;
};

export const InventoryMovement = mongoose.models.InventoryMovement || 
  mongoose.model<IInventoryMovement>('InventoryMovement', InventoryMovementSchema);