import 'dotenv/config'
import cron from 'node-cron'
import { runPipeline } from './pipeline/index.js'

// IST = UTC+5:30
// 3:00am IST = 9:30pm UTC previous day = cron '30 21 * * *'
// We run at 3am IST so briefs are ready by 6:30-7am when users wake up

const PIPELINE_CRON = '30 21 * * *'  // 3:00am IST

console.log('[cron] BriefCast scheduler started')
console.log(`[cron] Pipeline scheduled at 3:00am IST (${PIPELINE_CRON} UTC)`)
console.log('[cron] Waiting for next trigger...\n')

cron.schedule(PIPELINE_CRON, async () => {
  console.log('[cron] Trigger fired — starting nightly pipeline')
  await runPipeline()
}, {
  timezone: 'UTC'
})

// Dev shortcut — run immediately if RUN_NOW=true in env
// Usage: RUN_NOW=true node src/cron.js
if (process.env.RUN_NOW === 'true') {
  console.log('[cron] RUN_NOW=true detected — running pipeline immediately\n')
  runPipeline()
}
