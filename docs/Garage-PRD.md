# Garage PRD

Version: 1.0

## 1. Executive Summary

Garage is a personal vehicle management platform that helps owners
manage maintenance, ownership costs, documents, reminders, and analytics
for motorcycles and cars. The product focuses on preventing missed
maintenance while providing a complete ownership history.

## 2. Problem Statement

Vehicle owners commonly forget: - Service intervals - Spare part
replacement - Tax and insurance renewal - Historical maintenance - Total
ownership cost

## 3. Goals

### Business

-   Build the best personal vehicle manager.
-   Expand to motorcycles and cars.
-   Prepare for future premium AI features.

### User

-   Never miss maintenance.
-   Know upcoming replacement schedules.
-   Understand ownership cost.
-   Store vehicle records securely.

## 4. Success Metrics

  Metric                             Target
  ------------------------------- ---------
  Reminder delivery                   \>99%
  Monthly active users              Growing
  Maintenance completed on time       \>80%
  User retention                      \>60%

## 5. Personas

### Daily Rider

Owns one scooter and needs reminders.

### Enthusiast

Owns multiple vehicles and tracks modifications.

### Family

Manages several family vehicles.

## 6. Core Modules

-   Dashboard
-   Vehicles
-   Service History
-   Maintenance Planner
-   Parts Inventory
-   Fuel Tracker
-   Expense Tracker
-   Documents
-   Tax & Insurance
-   Notifications
-   Analytics
-   AI Assistant (future)

## 7. Functional Requirements

### Dashboard

-   Vehicle health score
-   Upcoming maintenance
-   Recent activities
-   Monthly expense summary
-   Odometer overview

### Vehicle Management

Fields: - Brand - Model - Variant - Year - Plate Number - VIN - Engine
Number - Chassis Number - Purchase Date - Purchase Price - Current
Odometer - Images

### Maintenance Schedule

Support: - Distance interval - Time interval - Combined interval -
Custom reminder offset

Default templates: \| Part \| Interval \| \|---\|---\| \| Engine Oil \|
3000 km / 3 months \| \| Gear Oil \| 6000 km \| \| Air Filter \| 10000
km \| \| Spark Plug \| 8000 km \| \| Brake Pad \| 10000 km \| \| CVT
Roller \| 12000 km \| \| CVT Belt \| 24000 km \| \| Battery \| 24 months
\|

### Service History

Each service stores: - Date - Odometer - Workshop - Mechanic - Services
performed - Parts replaced - Labor cost - Parts cost - Total cost -
Invoice - Photos - Notes

### Parts

Track: - Brand - SKU - Warranty - Installation date - Installed
mileage - Lifetime - Current status

### Fuel

Track: - Station - Fuel type - Price - Liters - Full tank - Odometer

Analytics: - Cost/km - Fuel economy - Monthly fuel cost

### Expenses

Categories: - Maintenance - Fuel - Parking - Toll - Insurance - Tax -
Accessories - Modifications - Washing - Emergency

### Documents

Encrypted storage: - Registration - Insurance - Purchase invoice -
Warranty - Photos

### Notifications

-   Upcoming service
-   Overdue service
-   Tax renewal
-   Insurance expiry
-   Warranty expiry

## 8. Non Functional Requirements

-   Responsive
-   Dark mode
-   Offline-first (future)
-   Secure encrypted documents
-   PostgreSQL
-   Daily backup
-   Audit log
-   Multi-device sync

## 9. User Stories

As a rider I want to receive reminders before my oil change so I never
miss scheduled maintenance.

As a vehicle owner I want to record every service so I can see complete
maintenance history.

As a user I want to upload invoices so I always have proof of
maintenance.

## 10. Database Design

### Vehicle

-   id
-   userId
-   brand
-   model
-   variant
-   year
-   plateNumber
-   vin
-   engineNumber
-   chassisNumber
-   purchasePrice
-   purchaseDate
-   odometer

### Maintenance

-   id
-   vehicleId
-   date
-   odometer
-   workshop
-   notes
-   totalCost

### MaintenanceItem

-   id
-   maintenanceId
-   type
-   cost

### Part

-   id
-   vehicleId
-   name
-   brand
-   installedAt
-   installedMileage
-   expectedLife

### FuelLog

-   id
-   vehicleId
-   liters
-   price
-   odometer

### Expense

-   id
-   vehicleId
-   category
-   amount
-   date

### Reminder

-   id
-   vehicleId
-   type
-   dueDate
-   dueMileage
-   status

## 11. API Endpoints

GET /vehicles POST /vehicles PATCH /vehicles/:id DELETE /vehicles/:id

GET /maintenance POST /maintenance

GET /fuel POST /fuel

GET /expenses POST /expenses

GET /documents POST /documents

## 12. AI Roadmap

### OCR

Extract maintenance invoices.

### Predictive Maintenance

Estimate future maintenance using mileage and history.

### Assistant

Examples: - When did I replace my battery? - How much did I spend on
fuel this year? - What maintenance is due next month?

## 13. Technology

Frontend: - Next.js - React - TypeScript - Tailwind CSS - shadcn/ui

Backend: - NestJS - Prisma - PostgreSQL

Storage: - Cloudflare R2

Authentication: - Better Auth

Notifications: - Email - Push

## 14. Milestones

### MVP

-   Vehicle
-   Maintenance
-   Reminder
-   Expenses
-   Fuel
-   Documents

### V1

-   Analytics
-   Health Score
-   Tax reminder

### V2

-   OCR
-   AI Assistant
-   Family Garage

### V3

-   OBD-II
-   Apple CarPlay
-   Android Auto
-   Predictive Maintenance

## 15. Vision

Garage becomes the single source of truth for vehicle ownership by
combining maintenance planning, financial tracking, document management,
analytics, and AI-powered insights into one platform.
