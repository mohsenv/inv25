"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apolloClient } from "@/lib/apollo-client";
import { GET_COMPANY, CREATE_OR_UPDATE_COMPANY } from "@/graphql/mutations/company";
import { gql } from '@apollo/client';
import { isPersianLeapYear, jalaaliToGregorian, gregorianToJalaali, getPersianMonthDays, parsePersianDate, formatPersianDateString } from "@/lib/persian";

export default function DebugPage() {
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test: string, success: boolean, message: string, data?: any) => {
    setResults(prev => [...prev, { test, success, message, data, time: new Date().toLocaleTimeString() }]);
  };

  const testCurrentDateCalculations = () => {
    const currentDate = new Date();
    const currentPersianDate = gregorianToJalaali(currentDate);
    
    addResult(
      "Current Date Info",
      true,
      `Today's Persian date: ${currentPersianDate.jy}/${currentPersianDate.jm}/${currentPersianDate.jd}`,
      {
        gregorianDate: currentDate.toDateString(),
        persianYear: currentPersianDate.jy,
        persianMonth: currentPersianDate.jm,
        persianDay: currentPersianDate.jd,
        formattedPersian: formatPersianDateString(currentDate)
      }
    );
    
    // Test year 1403 fiscal year calculation
    const year1403Start = jalaaliToGregorian(1403, 1, 1); // 1 Farvardin 1403
    const year1403EndLeap = jalaaliToGregorian(1403, 12, 30); // 30 Esfand 1403 (leap year)
    const year1403EndRegular = jalaaliToGregorian(1403, 12, 29); // 29 Esfand 1403 (if not leap)
    
    addResult(
      "Year 1403 Fiscal Dates",
      true,
      `Start: ${formatPersianDateString(year1403Start)}, End: ${formatPersianDateString(year1403EndLeap)}`,
      {
        startDate: {
          persian: formatPersianDateString(year1403Start),
          gregorian: year1403Start.toDateString(),
          gregorianISO: year1403Start.toISOString()
        },
        endDateLeap: {
          persian: formatPersianDateString(year1403EndLeap),
          gregorian: year1403EndLeap.toDateString(),
          gregorianISO: year1403EndLeap.toISOString()
        },
        endDateRegular: {
          persian: formatPersianDateString(year1403EndRegular),
          gregorian: year1403EndRegular.toDateString(),
          gregorianISO: year1403EndRegular.toISOString()
        },
        isLeapYear: isPersianLeapYear(1403)
      }
    );
    
    // Test what the form would calculate for current year and next year
    [0, 1].forEach(yearOffset => {
      const currentPersianYear = currentPersianDate.jy + yearOffset;
      const startDate = jalaaliToGregorian(currentPersianYear, 1, 1);
      const lastDayOfEsfand = isPersianLeapYear(currentPersianYear) ? 30 : 29;
      const endDate = jalaaliToGregorian(currentPersianYear, 12, lastDayOfEsfand);
      
      addResult(
        `Fiscal Year ${currentPersianYear} (offset ${yearOffset})`,
        true,
        `${formatPersianDateString(startDate)} to ${formatPersianDateString(endDate)}`,
        {
          persianYear: currentPersianYear,
          isLeapYear: isPersianLeapYear(currentPersianYear),
          lastDayOfEsfand,
          startDate: {
            persian: formatPersianDateString(startDate),
            gregorian: startDate.toDateString(),
            gregorianISO: startDate.toISOString()
          },
          endDate: {
            persian: formatPersianDateString(endDate),
            gregorian: endDate.toDateString(),
            gregorianISO: endDate.toISOString()
          }
        }
      );
    });
  };

  const testLeapYears = () => {
    const testYears = [1402, 1403, 1404, 1405, 1406];
    
    testYears.forEach(year => {
      const isLeap = isPersianLeapYear(year);
      const daysInEsfand = getPersianMonthDays(year, 12);
      const lastDayOfYear = jalaaliToGregorian(year, 12, daysInEsfand);
      
      addResult(
        `Persian Year ${year}`,
        true,
        `${isLeap ? 'Leap Year' : 'Regular Year'} - Esfand has ${daysInEsfand} days`,
        {
          year,
          isLeapYear: isLeap,
          daysInEsfand,
          lastDayPersian: `${daysInEsfand}/12/${year}`,
          lastDayGregorian: lastDayOfYear.toDateString()
        }
      );
    });
    
    // Specific tests for year 1403 (user reported as leap year)
    const year1403Tests = [
      { date: '1403/12/29', shouldPass: true, desc: '29 Esfand 1403 (always valid)' },
      { date: '1403/12/30', shouldPass: true, desc: '30 Esfand 1403 (valid in leap year)' },
      { date: '1403/12/31', shouldPass: false, desc: '31 Esfand 1403 (never valid)' }
    ];
    
    year1403Tests.forEach(({ date, shouldPass, desc }) => {
      const parsed = parsePersianDate(date);
      const success = shouldPass ? parsed !== null : parsed === null;
      
      addResult(
        `Date Validation: ${date}`,
        success,
        `${desc} - ${success ? 'PASSED' : 'FAILED'}`,
        {
          inputDate: date,
          expectedResult: shouldPass ? 'Valid' : 'Invalid',
          actualResult: parsed ? 'Valid' : 'Invalid',
          parsedGregorian: parsed ? parsed.toDateString() : 'null'
        }
      );
    });
    
    // Test year 1402 (non-leap year)
    const year1402Tests = [
      { date: '1402/12/29', shouldPass: true, desc: '29 Esfand 1402 (last day of non-leap year)' },
      { date: '1402/12/30', shouldPass: false, desc: '30 Esfand 1402 (invalid in non-leap year)' }
    ];
    
    year1402Tests.forEach(({ date, shouldPass, desc }) => {
      const parsed = parsePersianDate(date);
      const success = shouldPass ? parsed !== null : parsed === null;
      
      addResult(
        `Date Validation: ${date}`,
        success,
        `${desc} - ${success ? 'PASSED' : 'FAILED'}`,
        {
          inputDate: date,
          expectedResult: shouldPass ? 'Valid' : 'Invalid',
          actualResult: parsed ? 'Valid' : 'Invalid',
          parsedGregorian: parsed ? parsed.toDateString() : 'null'
        }
      );
    });
  };

  const testDocumentCreation = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      addResult("Document Creation Test", true, "Starting document creation test...");
      
      // First, create a test product if it doesn't exist
      const CREATE_PRODUCT = gql`
        mutation CreateProduct($input: ProductInput!) {
          createProduct(input: $input) {
            id
            name
            code
            unit
          }
        }
      `;
      
      const GET_PRODUCTS = gql`
        query GetProducts {
          getProducts(isActive: true) {
            id
            name
            code
            unit
          }
        }
      `;
      
      // Get existing products
      let testProduct: any;
      try {
        const productsResult = await apolloClient.query({
          query: GET_PRODUCTS,
          fetchPolicy: 'no-cache'
        });
        
        if (productsResult.data && (productsResult.data as any).getProducts.length > 0) {
          testProduct = (productsResult.data as any).getProducts[0];
          addResult("Product Query", true, `Found existing product: ${testProduct.name}`, testProduct);
        } else {
          // Create a test product
          const productResult = await apolloClient.mutate({
            mutation: CREATE_PRODUCT,
            variables: {
              input: {
                name: "تست کالا",
                code: "TEST001",
                unit: "عدد",
                description: "کالای آزمایشی برای تست سیستم"
              }
            }
          });
          
          if (productResult.data && (productResult.data as any).createProduct) {
            testProduct = (productResult.data as any).createProduct;
            addResult("Product Creation", true, "Test product created successfully", testProduct);
          } else {
            throw new Error("Failed to create test product");
          }
        }
      } catch (productError: any) {
        addResult("Product Setup", false, `Product setup failed: ${productError.message}`, productError);
        return;
      }
      
      // Test document creation with proper data structure
      const CREATE_DOCUMENT = gql`
        mutation CreateDocument($input: DocumentInput!) {
          createDocument(input: $input) {
            id
            documentType
            documentNumber
            items {
              id
              product {
                id
                name
                code
              }
              quantity
              unitPrice
              totalPrice
            }
            totalAmount
            date
            isFinalized
          }
        }
      `;
      
      const testDocumentInput = {
        documentType: 'INITIAL_STOCK',
        documentNumber: `TEST-${Date.now()}`,
        items: [{
          productId: testProduct.id,
          quantity: 10,
          unitPrice: 15000,
          description: "آیتم تست"
        }],
        description: "سند تست برای بررسی عملکرد سیستم",
        date: new Date().getTime() // Send as timestamp
      };
      
      addResult("Document Input Prepared", true, "Document input data prepared", testDocumentInput);
      
      const documentResult = await apolloClient.mutate({
        mutation: CREATE_DOCUMENT,
        variables: { input: testDocumentInput }
      });
      
      if (documentResult.data && (documentResult.data as any).createDocument) {
        addResult("Document Creation", true, "Document created successfully!", (documentResult.data as any).createDocument);
      } else {
        addResult("Document Creation", false, "No data returned from document creation");
      }
      
    } catch (error: any) {
      addResult("Document Creation Error", false, `Document creation failed: ${error.message}`, {
        error: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testMongoConnection = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      // Test 1: GraphQL endpoint availability
      addResult("GraphQL Endpoint", true, "Testing GraphQL endpoint...");
      
      // Test 2: Query company data
      try {
        const queryResult = await apolloClient.query({
          query: GET_COMPANY,
          fetchPolicy: 'no-cache'
        });
        
        if (queryResult.data) {
          addResult("Company Query", true, "Successfully queried company data", queryResult.data);
        } else {
          addResult("Company Query", false, "No data returned from query");
        }
      } catch (queryError: any) {
        addResult("Company Query", false, `Query failed: ${queryError.message}`, queryError);
      }

      // Test 3: Create test company
      try {
        const testCompany = {
          name: "Test Company شرکت آزمایشی",
          nationalCode: "1234567890",
          address: "Test Address آدرس آزمایشی",
          phone: "021-12345678",
          email: "test@company.com",
          financialYearStart: new Date('2024-03-21').getTime(),
          financialYearEnd: new Date('2025-03-19').getTime(),
        };

        const mutationResult = await apolloClient.mutate({
          mutation: CREATE_OR_UPDATE_COMPANY,
          variables: { input: testCompany }
        });

        if (mutationResult.data && (mutationResult.data as any).createOrUpdateCompany) {
          addResult("Company Creation", true, "Successfully created company in database", mutationResult.data);
        } else {
          addResult("Company Creation", false, "Failed to create company");
        }
      } catch (mutationError: any) {
        addResult("Company Creation", false, `Mutation failed: ${mutationError.message}`, mutationError);
      }

    } catch (error: any) {
      addResult("General Error", false, `Unexpected error: ${error.message}`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const testDatabaseVerification = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      addResult("Database Verification", true, "Starting database verification...");
      
      // Check if documents exist in database
      const GET_DOCUMENTS = gql`
        query GetDocuments {
          getDocuments {
            id
            documentType
            documentNumber
            totalAmount
            date
            isFinalized
            createdAt
            items {
              id
              quantity
              unitPrice
              totalPrice
              product {
                id
                name
                code
              }
            }
          }
        }
      `;
      
      const documentsResult = await apolloClient.query({
        query: GET_DOCUMENTS,
        fetchPolicy: 'no-cache'
      });
      
      if (documentsResult.data && (documentsResult.data as any).getDocuments) {
        const documents = (documentsResult.data as any).getDocuments;
        addResult("Documents Query", true, `Found ${documents.length} documents in database`, {
          documentsCount: documents.length,
          documents: documents.map((doc: any) => ({
            id: doc.id,
            type: doc.documentType,
            number: doc.documentNumber,
            total: doc.totalAmount,
            itemsCount: doc.items.length,
            createdAt: doc.createdAt
          }))
        });
        
        // If no documents found, show warning
        if (documents.length === 0) {
          addResult("Document Count Warning", false, "No documents found in database - this might indicate saving issues");
        }
      } else {
        addResult("Documents Query", false, "Failed to retrieve documents from database");
      }
      
      // Also check inventory movements
      const GET_INVENTORY_MOVEMENTS = gql`
        query GetInventoryMovements {
          getInventoryMovements {
            id
            movementType
            quantity
            unitPrice
            totalPrice
            date
            product {
              id
              name
              code
            }
            document {
              id
              documentNumber
            }
          }
        }
      `;
      
      const movementsResult = await apolloClient.query({
        query: GET_INVENTORY_MOVEMENTS,
        fetchPolicy: 'no-cache'
      });
      
      if (movementsResult.data && (movementsResult.data as any).getInventoryMovements) {
        const movements = (movementsResult.data as any).getInventoryMovements;
        addResult("Inventory Movements Query", true, `Found ${movements.length} inventory movements in database`, {
          movementsCount: movements.length,
          movements: movements.slice(0, 5).map((mov: any) => ({
            id: mov.id,
            type: mov.movementType,
            quantity: mov.quantity,
            productName: mov.product?.name,
            documentNumber: mov.document?.documentNumber
          }))
        });
      } else {
        addResult("Inventory Movements Query", false, "Failed to retrieve inventory movements from database");
      }
      
    } catch (error: any) {
      addResult("Database Verification Error", false, `Database verification failed: ${error.message}`, {
        error: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testCustomerFields = async () => {
    setIsLoading(true);
    setResults([]);

    try {
      addResult("Customer Fields Test", true, "Starting customer fields verification...");
      
      // Test customer query to see if enum fields are working
      const GET_CUSTOMERS = gql`
        query GetCustomers {
          getCustomers {
            id
            name
            phone
            creditLimit
            currentBalance
            customerType
            status
            isActive
          }
        }
      `;
      
      const customersResult = await apolloClient.query({
        query: GET_CUSTOMERS,
        fetchPolicy: 'no-cache'
      });
      
      if (customersResult.data && (customersResult.data as any).getCustomers) {
        const customers = (customersResult.data as any).getCustomers;
        addResult("Customers Query", true, `Found ${customers.length} customers in database`, {
          customersCount: customers.length,
          customers: customers.map((customer: any) => ({
            id: customer.id,
            name: customer.name,
            phone: customer.phone || 'No phone',
            creditLimit: customer.creditLimit,
            currentBalance: customer.currentBalance,
            customerType: customer.customerType,
            status: customer.status
          }))
        });
        
        // Check for any customers with missing enum fields
        const customersWithoutType = customers.filter((c: any) => !c.customerType);
        const customersWithoutStatus = customers.filter((c: any) => !c.status);
        
        if (customersWithoutType.length > 0) {
          addResult("Customer Type Check", false, `Found ${customersWithoutType.length} customers without customerType`, {
            customersWithoutType: customersWithoutType.map((c: any) => ({ id: c.id, name: c.name }))
          });
        } else {
          addResult("Customer Type Check", true, "All customers have customerType field");
        }
        
        if (customersWithoutStatus.length > 0) {
          addResult("Customer Status Check", false, `Found ${customersWithoutStatus.length} customers without status`, {
            customersWithoutStatus: customersWithoutStatus.map((c: any) => ({ id: c.id, name: c.name }))
          });
        } else {
          addResult("Customer Status Check", true, "All customers have status field");
        }
        
      } else {
        addResult("Customers Query", false, "Failed to retrieve customers from database");
      }
      
    } catch (error: any) {
      addResult("Customer Fields Test Error", false, `Customer verification failed: ${error.message}`, {
        error: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>MongoDB & GraphQL Connection Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={testMongoConnection} 
                disabled={isLoading}
              >
                {isLoading ? "Testing..." : "Test Database Connection"}
              </Button>
              <Button 
                onClick={testDocumentCreation}
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? "Testing..." : "Test Document Creation"}
              </Button>
              <Button 
                onClick={testDatabaseVerification}
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? "Testing..." : "Verify Database Content"}
              </Button>
              <Button 
                onClick={testCustomerFields}
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? "Testing..." : "Test Customer Fields"}
              </Button>
              <Button 
                onClick={testLeapYears}
                variant="outline"
              >
                Test Leap Years
              </Button>
              <Button 
                onClick={testCurrentDateCalculations}
                variant="outline"
              >
                Test Current Date Calculations
              </Button>
              <Button 
                variant="outline" 
                onClick={clearResults}
              >
                Clear Results
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Connection Details:</h3>
              <div className="text-sm space-y-1">
                <p><strong>MongoDB URI:</strong> mongodb://localhost:27017/satinv1403</p>
                <p><strong>GraphQL Endpoint:</strong> /api/graphql</p>
                <p><strong>Database Name:</strong> satinv1403</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">{result.test}</span>
                      <span className="text-sm text-gray-500">({result.time})</span>
                    </div>
                    
                    <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.message}
                    </p>

                    {result.data && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600">
                          View Details
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div>
                  <strong>If MongoDB connection fails:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1 ml-4">
                    <li>Make sure MongoDB is running on localhost:27017</li>
                    <li>Check if the database name 'satinv1403' is correct</li>
                    <li>Verify your .env.local file has the correct MONGODB_URI</li>
                    <li>Try connecting with MongoDB Compass or mongosh to test connectivity</li>
                  </ol>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div>
                  <strong>If GraphQL fails:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1 ml-4">
                    <li>Check the browser's Network tab for GraphQL requests</li>
                    <li>Visit <code>/api/graphql</code> to see if GraphQL playground loads</li>
                    <li>Check server console for any error messages</li>
                  </ol>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div>
                  <strong>If Document Creation fails:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1 ml-4">
                    <li>Check that products exist in the database</li>
                    <li>Verify date format is correct (timestamp)</li>
                    <li>Ensure required fields are provided</li>
                    <li>Check ObjectId format for product/supplier/customer IDs</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}