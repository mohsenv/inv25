import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Document } from '@/models/Document';
import { Product } from '@/models/Product';
import { Supplier } from '@/models/Supplier';
import { Customer } from '@/models/Customer';

export async function GET() {
  try {
    console.log('🔍 Testing database connection...');
    
    await dbConnect();
    
    // Ensure all models are registered
    Product;
    Supplier;
    Customer;
    Document;
    
    console.log('✅ Database connected successfully');
    
    const documentCount = await Document.countDocuments();
    console.log('📊 Document count:', documentCount);
    
    const documents = await Document.find()
      .populate('supplier')
      .populate('customer')
      .populate('items.product')
      .limit(5)
      .sort({ createdAt: -1 });
    
    console.log('📄 Sample documents:', documents.length);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      documentCount,
      sampleDocuments: documents.map(doc => ({
        id: doc._id.toString(),
        documentType: doc.documentType,
        documentNumber: doc.documentNumber,
        totalAmount: doc.totalAmount,
        itemsCount: doc.items.length,
        date: doc.date,
        isFinalized: doc.isFinalized
      }))
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Database connection failed'
    }, { status: 500 });
  }
}