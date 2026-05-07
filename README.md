# SMAS Mobility Fleet Report

A Google Colab notebook that pulls combined fleet data from the MyGeotab API and generates a styled two-sheet Excel report.

## Open in Colab

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/farindn/smas-mobility-fleet-report/blob/main/smas_mobility_fleet_report.ipynb)

## Report Columns

**Sheet 1 — Vehicle Summary**

| Column | Source |
|--------|--------|
| Customer | Group names containing `[...]` from device groups |
| Vehicle Name | `Device.name` |
| VIN | `Device.vehicleIdentificationNumber` |
| Serial No. | `Device.serialNumber` |
| Odometer (km) | `StatusData` — `DiagnosticOdometerAdjustmentId` |
| Fill-up Count | `FillUp` entity count |
| Fill-up Volume (L) | `FillUp.volume` sum |
| Fuel Consumed (L) | `FuelUsed.totalFuelUsed` |
| Max Speed (km/h) | `max(Trip.maximumSpeed)` |
| Avg Speed (km/h) | Weighted average of `Trip.averageSpeed` |
| CO2 Emission (kg) | Fuel Consumed × CO2 factor (auto-detected per fuel type) |
| Minor Collision | `ExceptionEvent` — `RuleEnhancedMinorCollisionId` |
| Major Collision | `ExceptionEvent` — `RuleEnhancedMajorCollisionId` |
| Idle Event Count | `ExceptionEvent` — `RuleIdlingId` |
| Total Idling | Sum of `ExceptionEvent.duration` for idling events |
| Speeding Events | `ExceptionEvent` — `RulePostedSpeedingId` |
| Battery Voltage (V) | `StatusData` — `DiagnosticGoDeviceVoltageId` (red if < 11.5 V) |

**Sheet 2 — Trip Detail** (one row per trip)

## Usage

1. Open the notebook in Google Colab using the badge above
2. Fill in your MyGeotab credentials in Cell 2
3. Set the date range and vehicle group in Cell 3
4. Run all cells top to bottom
5. The Excel file downloads automatically when Cell 11 completes
