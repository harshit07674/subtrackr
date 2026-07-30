import app from "./backend/app.js"
import config from "./backend/config/config.js";
import connectToDB from "./backend/config/database.js"
import { startReminderCron } from "./backend/jobs/reminderCron.js";
import { startCurrencyCron } from "./backend/jobs/currencyFetch.js";

connectToDB();

// Start cron jobs after DB is connected
startReminderCron();
startCurrencyCron();


app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`)
})



