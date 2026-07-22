# Atlas Ledger PRD

**Version:** 1.0\
**Status:** Draft\
**Product:** Atlas Ledger\
**Platform:** Atlas\
**Author:** Gustam Mahendra

------------------------------------------------------------------------

# 1. Overview

Atlas Ledger adalah aplikasi personal financial management yang membantu
pengguna mengelola seluruh kondisi finansial dalam satu tempat.

Berbeda dengan aplikasi expense tracker tradisional, Ledger menerapkan
**Zero-Based Budgeting** seperti YNAB, di mana setiap uang yang dimiliki
harus memiliki tujuan.

> **Give every rupiah a purpose.**

------------------------------------------------------------------------

# Product Vision

Membantu pengguna:

-   Mengelola seluruh keuangan dalam satu aplikasi.
-   Memberikan tugas untuk setiap rupiah.
-   Mengurangi pengeluaran impulsif.
-   Mencapai tujuan finansial.
-   Memahami kondisi finansial secara real-time.

------------------------------------------------------------------------

# Product Inspiration

## Primary

-   YNAB

## Secondary

-   Copilot Money
-   Monarch Money
-   Rocket Money

------------------------------------------------------------------------

# Core Philosophy

## Rule 1 --- Give Every Dollar a Job

Semua uang yang masuk harus dialokasikan ke kategori tertentu hingga
**Ready to Assign = 0**.

## Rule 2 --- Embrace Your True Expenses

Tagihan tahunan dibagi menjadi kontribusi bulanan.

## Rule 3 --- Roll With The Punches

Budget dapat dipindahkan antar kategori tanpa mengubah tujuan finansial.

## Rule 4 --- Age Your Money

Semakin lama uang mengendap, semakin sehat kondisi keuangan pengguna.

------------------------------------------------------------------------

# Goals

-   Expense Tracking
-   Income Tracking
-   Zero-Based Budgeting
-   Financial Goals
-   Subscription Tracking
-   Investment Tracking
-   Debt Tracking
-   Asset Tracking
-   Net Worth Dashboard
-   AI Assisted Finance

------------------------------------------------------------------------

# Non Goals

-   Banking
-   Payment Gateway
-   Crypto Exchange
-   ERP Accounting

------------------------------------------------------------------------

# Information Architecture

``` text
Ledger
├── Dashboard
├── Accounts
├── Transactions
├── Budget
├── Categories
├── Goals
├── Subscriptions
├── Assets
├── Debts
├── Investments
├── Reports
└── Settings
```

------------------------------------------------------------------------

# Dashboard

## KPI Cards

-   Net Worth
-   Cash Available
-   Income
-   Expenses
-   Savings Rate
-   Budget Remaining
-   Ready To Assign
-   Age of Money

## Charts

-   Cash Flow
-   Income vs Expense
-   Spending by Category
-   Monthly Trend
-   Budget Progress
-   Net Worth History

## Quick Actions

-   Add Transaction
-   Transfer Money
-   Assign Money
-   Create Goal

------------------------------------------------------------------------

# Accounts

Supported Account Types:

-   Checking
-   Savings
-   Cash
-   Credit Card
-   E-Wallet
-   Investment
-   Crypto
-   Loan

Fields:

-   Name
-   Institution
-   Balance
-   Currency
-   Icon
-   Color

------------------------------------------------------------------------

# Transactions

Supported Types:

-   Income
-   Expense
-   Transfer
-   Refund
-   Fee
-   Interest
-   Adjustment

Fields:

-   Amount
-   Date
-   Account
-   Category
-   Payee
-   Notes
-   Receipt
-   Tags
-   Location
-   Recurring

------------------------------------------------------------------------

# Categories

Examples:

-   Living
-   Food
-   Transportation
-   Shopping
-   Insurance
-   Entertainment
-   Savings
-   Investment
-   Emergency Fund
-   Taxes
-   Travel

------------------------------------------------------------------------

# Budget

Each category contains:

-   Assigned
-   Activity
-   Available

Example:

  Category      Assigned     Spent   Available
  ---------- ----------- --------- -----------
  Food         1,500,000   850,000     650,000

Rules:

-   Carry Over
-   Monthly Reset
-   Flexible Budget
-   Strict Budget
-   Overspending Alerts

------------------------------------------------------------------------

# Assign Money

Every income triggers a budget assignment flow.

Example:

Income: Rp10.000.000

Assigned to:

-   Rent
-   Food
-   Transportation
-   Emergency Fund
-   Investment
-   Vacation

Target:

**Ready To Assign = Rp0**

------------------------------------------------------------------------

# Goals

Goal Types:

-   Emergency Fund
-   Vacation
-   House
-   Car
-   Wedding
-   Retirement
-   Debt Payoff

Each Goal Stores:

-   Target Amount
-   Current Progress
-   Remaining
-   Monthly Contribution
-   ETA

------------------------------------------------------------------------

# Subscription Tracking

Examples:

-   Netflix
-   Spotify
-   OpenAI
-   GitHub
-   Cloudflare
-   Supabase
-   Vercel

Track:

-   Monthly Cost
-   Annual Cost
-   Renewal Date
-   Reminder
-   Payment Account

------------------------------------------------------------------------

# Assets

Examples:

-   House
-   Car
-   Motorcycle
-   Gold
-   Cash
-   Property

------------------------------------------------------------------------

# Investments

Support:

-   Stocks
-   ETF
-   Mutual Fund
-   Bonds
-   Crypto
-   Gold

Metrics:

-   Cost Basis
-   Current Value
-   Gain/Loss
-   Allocation

------------------------------------------------------------------------

# Debt Tracking

Support:

-   Credit Card
-   Mortgage
-   Student Loan
-   Personal Loan

Track:

-   Outstanding
-   Interest Rate
-   Due Date
-   Minimum Payment

------------------------------------------------------------------------

# Reports

-   Income Report
-   Expense Report
-   Budget Report
-   Cash Flow
-   Category Report
-   Net Worth
-   Subscription Report
-   Investment Report

------------------------------------------------------------------------

# Smart Features

## Gmail Sync

Pipeline:

Gmail API → Transaction Extraction → Merchant Detection → AI
Categorization → Duplicate Detection → Review → Ledger

## AI Categorization

Automatically predicts category based on merchant and history.

## Merchant Rules

Example:

Tokopedia → Shopping

Starbucks → Dining

## Recurring Detection

Automatically detects subscriptions and recurring payments.

## Duplicate Detection

Avoids duplicate imported transactions.

------------------------------------------------------------------------

# Security

-   Passkey
-   Biometric Authentication
-   PIN Lock
-   Encrypted Local Database
-   Cloud Sync
-   Audit Log

------------------------------------------------------------------------

# Offline First

-   Local Database
-   Background Sync
-   Conflict Resolution

------------------------------------------------------------------------

# KPIs

-   Ready To Assign completion
-   Monthly budgeting rate
-   Savings rate
-   Goal completion
-   Net worth growth
-   AI categorization accuracy (\>95%)
-   Gmail detection accuracy (\>90%)

------------------------------------------------------------------------

# Roadmap

## MVP

-   Accounts
-   Transactions
-   Budget
-   Categories
-   Dashboard
-   Goals
-   CSV Import

## Version 1.5

-   Gmail Sync
-   AI Categorization
-   Merchant Rules
-   Receipt OCR
-   Recurring Transactions

## Version 2

-   Investments
-   Assets
-   Debts
-   Net Worth
-   Financial Health Score
-   AI Financial Coach
-   Forecasting

------------------------------------------------------------------------

# Competitive Positioning

Atlas Ledger menggabungkan:

-   Filosofi Zero-Based Budgeting dari **YNAB**
-   Wealth Tracking ala **Monarch Money**
-   Modern UI ala **Copilot Money**
-   AI-powered automation
-   Gmail Transaction Sync
-   Integrasi penuh dengan ekosistem Atlas
