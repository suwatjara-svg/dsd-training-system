import { prisma } from './prisma';

interface LogOptions {
  adminId?: string;
  applicationId?: string;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
  ipAddress?: string;
}

export async function logAudit(options: LogOptions) {
  try {
    console.log('[Audit Log]:', options.action, options.details || '');
    return true;
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}
