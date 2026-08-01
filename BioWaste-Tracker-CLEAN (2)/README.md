# BioWaste Tracker - Biomedical Waste Management System

## 🚀 QUICK START - READ THIS FIRST!

### Step 1: Open Terminal in VS Code
Make sure you are in the main project folder (where you see this README.md file).

### Step 2: Install Dependencies
Run this command and wait for it to finish (may take 2-5 minutes):
```bash
npm install
```

### Step 3: Create Database Tables
This connects to your Neon database and creates all the tables:
```bash
npx drizzle-kit push
```
*Wait until you see "✓ Changes applied" or "No changes detected"*

### Step 4: Start the Website
```bash
npm run dev
```

### Step 5: Open in Browser
1. You will see a message: `✓ Ready in Xms`
2. Press `Ctrl` + `Click` on the link `http://localhost:3000` 
3. Or open your browser and go to: `http://localhost:3000`

### Step 6: Seed Demo Data (First Time Only!)
1. On the Dashboard, click the **"🌱 Seed Demo Data"** button
2. Wait for the success message
3. This creates demo clinics and login accounts

### Step 7: Login
Use these demo accounts (or register your own):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@biowaste.com` | `admin123` |
| Inspector | `inspector@biowaste.com` | `inspect123` |
| Facility Manager | `manager@biowaste.com` | `manage123` |
| Collector | `collector@biowaste.com` | `collect123` |

---

## 📁 What's Included

- **Dashboard** - Real-time waste tracking statistics
- **Waste Logs** - Register and track biomedical waste
- **Mobile Entry** - Mobile-friendly waste logging for clinic staff
- **QR Scanner** - Scan waste bag QR codes for pickup
- **Collection** - Record waste collection by transport staff
- **Facilities** - Manage hospitals, clinics, and labs
- **Inspections** - Schedule and track facility inspections
- **Spot Checks** - Random enforcement inspections
- **Violations** - Track compliance violations
- **Alerts** - Automatic notifications for issues
- **Reports** - Generate compliance reports (PDF export)

---

## 🔧 Troubleshooting

### Error: "Could not connect to database"
1. Check that `.env` file exists in the main folder
2. Make sure `DATABASE_URL` has your Neon connection string
3. Restart the server: `Ctrl+C` then `npm run dev`

### Error: "package.json not found"
You are in the wrong folder. Run `ls` to see files. If you see another folder, run `cd foldername` first.

### Error: "Module not found"
Run `npm install` again and wait for it to complete.

---

## 🌐 Deploy to Vercel (Permanent Link)

1. Upload this code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add these Environment Variables in Vercel Settings:
   - `DATABASE_URL` = (Your Neon connection string)
   - `AUTH_SECRET` = `any-random-secret-text`
   - `AUTH_TRUST_HOST` = `true`
4. Click Deploy!

---

## 📞 Support

If you need help, check the terminal for error messages. Most issues are related to:
- Missing `.env` file
- Wrong database connection string
- Not running `npm install` first

**Database:** Neon PostgreSQL (Cloud)
**Framework:** Next.js 16
**Authentication:** NextAuth.js (Credentials)
**ORM:** Drizzle ORM
