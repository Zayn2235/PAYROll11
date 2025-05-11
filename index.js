// index.js (project root)
require('dotenv').config();
const app = require('./backend/app');
const { sequelize } = require('./backend/models');

const PORT = process.env.PORT || 3000;

(async() => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL connection established.');
        app.listen(PORT, () => {
            console.log(`🚀 Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Unable to connect to MySQL:', err);
        process.exit(1);
    }
})();