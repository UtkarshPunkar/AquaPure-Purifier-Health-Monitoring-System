import { Request, Response } from 'express';
import { prisma } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

function isTechnicalHead(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    return (
      decoded.role === 'TECHNICAL_HEAD' ||
      decoded.email?.toLowerCase() === 'utkarshpunkar7@gmail.com'
    );
  } catch {
    return false;
  }
}

export async function getAllUsers(req: Request, res: Response) {
  try {
    if (!isTechnicalHead(req)) {
      return res.status(403).json({
        error: 'Access denied. Only the Technical Head (Utkarsh Punkar) can view system users and role permissions.',
      });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    if (!isTechnicalHead(req)) {
      return res.status(403).json({
        error: 'Access denied. Only the Technical Head (Utkarsh Punkar) can create new accounts directly.',
      });
    }

    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const org = await prisma.organization.findFirst();
    if (!org) {
      return res.status(500).json({ error: 'Organization not found' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = cleanEmail === 'utkarshpunkar7@gmail.com' ? 'TECHNICAL_HEAD' : role || 'VIEWER';

    const user = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        passwordHash,
        role: assignedRole,
        status: 'ACTIVE',
        organizationId: org.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const authHeader = req.headers.authorization;
    let authUser: any = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        authUser = jwt.verify(token, ENV.JWT_SECRET) as any;
      } catch {}
    }

    const isTechHeadUser = isTechnicalHead(req);
    const isSelf = authUser && authUser.userId === id;

    if (!isTechHeadUser && !isSelf) {
      return res.status(403).json({
        error: 'Access denied. You do not have permission to modify this user account.',
      });
    }

    const { name, email, role, status, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = String(name).trim();
    if (email && isTechHeadUser) dataToUpdate.email = String(email).trim().toLowerCase();
    
    // Role update (Only Technical Head can update roles)
    if (role && isTechHeadUser) {
      const validRoles = ['TECHNICAL_HEAD', 'ADMIN', 'MAINTENANCE_STAFF', 'VIEWER'];
      if (validRoles.includes(role)) {
        dataToUpdate.role = role;
      }
    }

    // Status update (Only Technical Head can activate/deactivate)
    if (status && isTechHeadUser) {
      dataToUpdate.status = status;
    }

    // Password update
    if (password && String(password).trim().length >= 4) {
      dataToUpdate.passwordHash = await bcrypt.hash(String(password).trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    if (!isTechnicalHead(req)) {
      return res.status(403).json({
        error: 'Access denied. Only the Technical Head (Utkarsh Punkar) can delete user accounts.',
      });
    }

    const id = String(req.params.id);
    
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.email === 'utkarshpunkar7@gmail.com' || targetUser.role === 'TECHNICAL_HEAD') {
      return res.status(403).json({ error: 'Root Technical Head account cannot be deleted.' });
    }

    await prisma.user.delete({ where: { id } });
    return res.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}
