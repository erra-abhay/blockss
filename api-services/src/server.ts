import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './api-services/auth';
import tenantRoutes from './api-services/tenant';
import certificateRoutes from './api-services/certificates';
import verifyRoutes from './api-services/verify';
import studentRoutes from './api-services/students';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/students', studentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
