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

## 🔒 Security & Roles
- **Mentors**: Full CRUD access to students, sessions, materials, and imports.
- **Students**: Read-only access to their own data via Row Level Security (RLS).

---

## 📄 License
Internal Tool for BOPPL Pvt. Ltd. / The Forge Bootcamp.
