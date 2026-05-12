# SMAS Mobility Fleet Report

A MyGeotab add-in that generates comprehensive fleet reports — vehicle summary, trip details, fuel consumption, collision events, and battery health — all in one downloadable Excel file.

Originally built as a Python notebook for SMAS Mobility Indonesia, now ported to a browser-based add-in that runs entirely inside MyGeotab.

---

## How It Works

```
MyGeotab API
  │
  ├─ Device + Group        → Vehicle list with customer assignment
  ├─ Trip                  → Trip details, distance, speed, idling
  ├─ FuelUsed              → Fuel consumption per vehicle
  ├─ FillUp                → Fill-up events (count + volume)
  ├─ ExceptionEvent        → Collisions, idling, speeding
  └─ StatusData            → Odometer, battery voltage
        │
        ▼
  Aggregation (browser-side JavaScript)
        │
        ├─ Vehicle Summary   → One row per vehicle
        └─ Trip Detail       → One row per trip
              │
              ▼
  ExcelJS (client-side)
        │
        ▼
  .xlsx download
```

The add-in runs entirely in the browser — no server required. All API calls, aggregation, and Excel generation happen client-side.

---

## Features

| Metric | Description |
|---|---|
| Odometer | End-of-period odometer reading (km) |
| Fill-ups | Count and total volume (L) |
| Fuel consumed | Total fuel used (L) from engine diagnostics |
| CO₂ emissions | Auto-calculated from fuel type (petrol: 2.31 kg/L, diesel: 2.68 kg/L) |
| Max speed | Highest speed recorded across all trips (km/h) |
| Collisions | Minor and major collision events (separate columns) |
| Idling | Event count and total duration |
| Speeding | Posted speed violation count |
| Battery voltage | Last reading (V), highlighted red if below threshold |

---

## Prerequisites

- A MyGeotab account with access to the target fleet
- Vehicles must have trip data and diagnostics enabled

---

## Project Structure

```
smas-mobility-fleet-report/
├── index.html                  # Add-in entry point
├── config.json                 # Add-in manifest
├── mockup.html                 # Standalone UI mockup (development)
├── images/
│   └── icon.svg                # Add-in menu icon
├── scripts/
│   └── main.js                 # Add-in logic (API calls, aggregation, Excel)
├── styles/
│   └── main.css                # MYG design system styling
└── smas_mobility_fleet_report.ipynb  # Original Python notebook (Colab)
```

---

## Setup: Register in MyGeotab

### Step 1: Copy the add-in manifest

```json
{
  "name": "smasMobilityFleetReport",
  "version": "1.0.0",
  "supportEmail": "farinnugraha@geotab.com",
  "items": [{
    "version": "1.0.0",
    "url": "https://farindn.github.io/smas-mobility-fleet-report/index.html",
    "path": "ActivityLink/",
    "menuName": { "en": "SMAS Mobility Fleet Report" },
    "icon": "https://farindn.github.io/smas-mobility-fleet-report/images/icon.svg"
  }],
  "isSigned": false
}
```

### Step 2: Register in MyGeotab

1. Go to **Administration → System → System Settings → Add-Ins**
2. Click **New Add-In**
3. Paste the manifest above
4. Click **OK** → **Save**

The add-in appears under **Activity → SMAS Mobility Fleet Report**.

---

## Usage

### Generating a fleet report

1. Open **SMAS Mobility Fleet Report** from the sidebar
2. Select the **Start Date** and **End Date** for the report period
3. *(Optional)* Filter by **Vehicle Group** to limit to a specific customer
4. *(Optional)* Adjust **Battery Low Threshold** (default: 11.5 V)
5. Click **Generate Report**
6. Review the preview:
   - **Summary tiles** — fleet-wide totals (vehicles, fuel, CO₂, collisions, etc.)
   - **Vehicle Summary table** — one row per vehicle with all metrics
   - **Trip Detail table** — expandable, one row per trip
7. Click **Download Excel** to save the report

### Using the Jupyter notebook

The original Python notebook is still available for ad-hoc runs:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/farindn/smas-mobility-fleet-report/blob/main/smas_mobility_fleet_report.ipynb)

1. Open the notebook in Google Colab using the badge above
2. Fill in your MyGeotab credentials
3. Set the date range and vehicle group
4. Run all cells — the Excel file downloads automatically

---

## Report Columns

### Sheet 1 — Vehicle Summary

| Column | Source |
|---|---|
| Customer | Group names containing `[...]` from device groups |
| Vehicle Name | `Device.name` |
| VIN | `Device.vehicleIdentificationNumber` |
| Serial No. | `Device.serialNumber` |
| Odometer (km) | `StatusData` — `DiagnosticOdometerAdjustmentId` |
| Fill-up Count | `FillUp` entity count |
| Fill-up Volume (L) | `FillUp.volume` sum |
| Fuel Consumed (L) | `FuelUsed.totalFuelUsed` |
| Max Speed (km/h) | `max(Trip.maximumSpeed)` |
| CO₂ Emission (kg) | Fuel Consumed × CO₂ factor (auto-detected per fuel type) |
| Minor Collisions | `ExceptionEvent` — `RuleEnhancedMinorCollisionId` |
| Major Collisions | `ExceptionEvent` — `RuleEnhancedMajorCollisionId` |
| Idle Event Count | `ExceptionEvent` — `RuleIdlingId` |
| Total Idling | Sum of `ExceptionEvent.duration` for idling events |
| Speeding Events | `ExceptionEvent` — `RulePostedSpeedingId` |
| Battery Voltage (V) | `StatusData` — `DiagnosticGoDeviceVoltageId` |

### Sheet 2 — Trip Detail

| Column | Source |
|---|---|
| Vehicle Name | `Device.name` |
| Customer | Group names containing `[...]` |
| VIN | `Device.vehicleIdentificationNumber` |
| Trip Start | `Trip.start` (local time) |
| Trip End | `Trip.stop` (local time) |
| Duration | Calculated from start/stop |
| Distance (km) | `Trip.distance` |
| Avg Speed (km/h) | `Trip.averageSpeed` |
| Max Speed (km/h) | `Trip.maximumSpeed` |
| Idling Duration | `Trip.stopDuration` |
| Odometer End (km) | `Trip.odometer` |

---

## GitHub Pages Deployment

The add-in is hosted on GitHub Pages at:

**https://farindn.github.io/smas-mobility-fleet-report/**

To deploy your own fork:

1. Fork this repository
2. Go to **Settings → Pages → Source** → select **Deploy from a branch** → `main`
3. Update the `url` and `icon` fields in `config.json` to your own Pages URL
4. Push to `main` — GitHub Pages deploys automatically

---

## Known Limitations

- **Asia/Jakarta timezone** — dates are converted assuming UTC+7. Other timezones require code modification.
- **25,000 record limit** — large fleets with many trips may hit API limits. The add-in fetches in date chunks to mitigate this.
- **Rate limiting** — API calls are batched with delays to avoid throttling. Report generation may take 1–2 minutes for large fleets.
- **Fill-up volume** — only available if fill-up detection is configured for the vehicles.
- **Fuel type detection** — based on `EngineType` diagnostic; defaults to petrol if unavailable.

---

## Credits

- Developed by Farin Nugraha, Solutions Engineering SEA, Geotab
- UI design follows the MyGeotab design system (MYG tokens)
- Excel generation powered by [ExcelJS](https://github.com/exceljs/exceljs)

---
