require('dotenv').config();
const { sequelize, User } = require('./models');
const app = require('./app');
const logger = require('./utils/logger');
const PORT = process.env.PORT || 5000;

(async() => {
    try {
        await sequelize.authenticate();
        logger.info('✅ Database connected');

        // Only create missing tables — do NOT alter or drop existing ones
        await sequelize.sync();
        logger.info('⚙️  Database synced (no alter)');

        // ensure default admin exists
        const adminEmail = 'admin@gmail.com';
        let adminUser = await User.findOne({ where: { email: adminEmail } });
        if (!adminUser) {
            await User.create({
                name: 'Administrator',
                email: adminEmail,
                password: 'admin1',
                role: 'admin'
            });
            logger.info('🛡️  Default admin created (admin1)');
        }

        app.listen(PORT, () => {
            logger.info(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        logger.error('❌ Startup error:', err);
        process.exit(1);
    }
})();