# ⚡ ForgeTrack

**The intelligent session attendance and engagement tracker for The Forge AI-ML Engineering Bootcamp.**

ForgeTrack is a premium, AI-powered internal tool designed to solve the fragmentation of student attendance, session metadata, and class materials. It bridges the gap between disconnected Google Sheets, Drives, and WhatsApp messages into one unified, high-performance dashboard.

---

## ✨ Key Features

### 🏢 Mentor Dashboard
- **Real-time Overview**: Instantly see today's session status, overall attendance rates, and active student counts.
- **Engagement Analytics**: Track program health with visual metrics and progress tracking.

### 📥 AI-Powered Bulk Import
- **Intelligent Mapping**: Uses an AI agent to detect column mappings from messy, inconsistent CSV/Excel files.
- **Auto-Unpivoting**: Automatically converts pivoted date-header spreadsheets into standardized database records.
- **Data Validation**: Group-based validation that flags anomalies, duplicates, and formatting issues before import.

### 📝 Dynamic Attendance Marking
- **Session Management**: Create or select sessions on the fly.
- **One-Click Marking**: Rapid attendance logging with "Select All" capabilities and mobile-responsive layout.

### 📊 Student Portal (Role-Based)
- **Personal History**: Students can securely view their own attendance percentage and session-by-session breakdown.
- **Material Library**: Centralized access to slides, recordings, and resources across all months.
- **Heatmap Visualization**: Interactive attendance heatmap showing engagement trends.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite)
- **Database & Auth**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Styling**: Premium Design System with Vanilla CSS
- **Parsing**: SheetJS & PapaParse
- **Agentic Logic**: Intelligent deduplication and constraint management

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Supabase Project

### 2. Installation
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

### 3. Database Setup
Ensure your Supabase database has the correct schema. You can run the `backend/supabase/schema.sql` to initialize the tables.

> [!IMPORTANT]
> If you encounter "ON CONFLICT" errors during import, ensure you have run the unique constraint fix script:
> `backend/supabase/fix_constraints_and_duplicates.sql`

---

## ⚙️ Backend Logic (Supabase Functions)

ForgeTrack utilizes **Supabase Edge Functions** for robust, server-side processing that ensures data integrity and high performance. This architecture allows us to move complex logic away from the client and into a scalable serverless environment.

### Available Functions:
- **`process-attendance`**: 
  - **Purpose**: Handles high-volume attendance data synchronization.
  - **Trigger**: Called after bulk CSV/Excel imports to process records and calculate program health metrics.
  - **Location**: `backend/supabase/functions/process-attendance/`
  - **Tech**: Deno / TypeScript

---

## 🔒 Security & Roles
- **Mentors**: Full CRUD access to students, sessions, materials, and imports. Protected by Row Level Security (RLS) on all tables.
- **Students**: Read-only access to their own data via strictly enforced RLS policies based on `auth.uid()`.
- **Database Schema**: The full schema, including RLS policies, triggers, and constraints, is available in `backend/supabase/schema.sql`.

---

## 🌐 Deployment

The application is deployed on Vercel. 

**Vercel Project Dashboard**: [https://vercel.com/sameekshanaik19s-projects/forge-track/](https://vercel.com/sameekshanaik19s-projects/forge-track/)

**Public Live Demo**: `https://forge-track-sameekshanaik19s-projects.vercel.app`
*(Note: You MUST go to your Vercel Settings > Deployment Protection and turn **OFF** "Vercel Authentication" to allow the reviewer to see the app. Currently, it returns a 401 error.)*

---

## 🔑 Environment Variables

To run this project locally or deploy it, you need to set up the following environment variables in a `.env` or `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📄 License
Internal Tool for BOPPL Pvt. Ltd. / The Forge Bootcamp.


