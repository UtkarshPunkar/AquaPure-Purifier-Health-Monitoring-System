import { Request, Response } from 'express';
import { prisma } from '../db';

export async function getSettings(req: Request, res: Response) {
  try {
    let settings = await prisma.systemSetting.findFirst();
    if (!settings) {
      const org = await prisma.organization.findFirst();
      settings = await prisma.systemSetting.create({
        data: {
          organizationId: org ? org.id : 'default-org',
          phMin: 6.5,
          phMax: 8.5,
          tdsMax: 300.0,
          turbidityMax: 5.0,
          tempMin: 10.0,
          tempMax: 35.0,
          filterWarning: 40.0,
          filterCritical: 20.0,
          emailAlerts: true,
          smsAlerts: false,
          pushAlerts: true,
          apiToken: 'aquapure_iot_live_sec_token_983742',
        },
      });
    }
    return res.json(settings);
  } catch (error) {
    console.error('getSettings error:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const {
      phMin,
      phMax,
      tdsMax,
      turbidityMax,
      tempMin,
      tempMax,
      filterWarning,
      filterCritical,
      emailAlerts,
      smsAlerts,
      pushAlerts,
      apiToken,
    } = req.body;

    let settings = await prisma.systemSetting.findFirst();
    if (!settings) {
      const org = await prisma.organization.findFirst();
      settings = await prisma.systemSetting.create({
        data: {
          organizationId: org ? org.id : 'default-org',
          phMin: Number(phMin) || 6.5,
          phMax: Number(phMax) || 8.5,
          tdsMax: Number(tdsMax) || 300.0,
          turbidityMax: Number(turbidityMax) || 5.0,
          tempMin: Number(tempMin) || 10.0,
          tempMax: Number(tempMax) || 35.0,
          filterWarning: Number(filterWarning) || 40.0,
          filterCritical: Number(filterCritical) || 20.0,
          emailAlerts: Boolean(emailAlerts),
          smsAlerts: Boolean(smsAlerts),
          pushAlerts: Boolean(pushAlerts),
          apiToken: apiToken || 'aquapure_iot_live_sec_token_983742',
        },
      });
    } else {
      settings = await prisma.systemSetting.update({
        where: { id: settings.id },
        data: {
          phMin: phMin !== undefined ? Number(phMin) : settings.phMin,
          phMax: phMax !== undefined ? Number(phMax) : settings.phMax,
          tdsMax: tdsMax !== undefined ? Number(tdsMax) : settings.tdsMax,
          turbidityMax: turbidityMax !== undefined ? Number(turbidityMax) : settings.turbidityMax,
          tempMin: tempMin !== undefined ? Number(tempMin) : settings.tempMin,
          tempMax: tempMax !== undefined ? Number(tempMax) : settings.tempMax,
          filterWarning: filterWarning !== undefined ? Number(filterWarning) : settings.filterWarning,
          filterCritical: filterCritical !== undefined ? Number(filterCritical) : settings.filterCritical,
          emailAlerts: emailAlerts !== undefined ? Boolean(emailAlerts) : settings.emailAlerts,
          smsAlerts: smsAlerts !== undefined ? Boolean(smsAlerts) : settings.smsAlerts,
          pushAlerts: pushAlerts !== undefined ? Boolean(pushAlerts) : settings.pushAlerts,
          apiToken: apiToken !== undefined ? String(apiToken) : settings.apiToken,
        },
      });
    }

    return res.json({
      message: 'System threshold and configuration settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('updateSettings error:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
}
