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

export async function logAudit({
  adminId,
  applicationId,
  action,
  fieldChanged,
  oldValue,
  newValue,
  details,
  ipAddress = '127.0.0.1',
}: LogOptions) {
  try {
    return await prisma.auditLog.create({
      data: {
        adminId,
        applicationId,
        action,
        fieldChanged,
        oldValue,
        newValue,
        details,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}
