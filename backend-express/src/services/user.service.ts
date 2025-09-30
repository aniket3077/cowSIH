import { PrismaClient, User, UserRole } from '@prisma/client';
import { getFirestoreDb } from '../config/firebase.config';

const prisma = new PrismaClient();

export interface CreateUserData {
  firebaseUid: string;
  email: string;
  name?: string;
  role?: UserRole;
}

export interface UpdateUserData {
  name?: string;
  role?: UserRole;
  profileImage?: string;
  isActive?: boolean;
}

export class UserService {
  // Create a new user in both Prisma and Firestore
  static async createUser(userData: CreateUserData): Promise<User> {
    const user = await prisma.user.create({
      data: {
        firebaseUid: userData.firebaseUid,
        email: userData.email,
        name: userData.name,
        role: userData.role || UserRole.FARMER
      }
    });

    // Sync role to Firestore
    await this.syncUserRoleToFirestore(user.firebaseUid, user.role);

    return user;
  }

  // Get user by Firebase UID
  static async getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { firebaseUid },
      include: {
        predictions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  // Get user by ID
  static async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        predictions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  // Update user
  static async updateUser(id: string, updateData: UpdateUserData): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    // If role is updated, sync to Firestore
    if (updateData.role) {
      await this.syncUserRoleToFirestore(user.firebaseUid, updateData.role);
    }

    return user;
  }

  // Delete user (soft delete by setting isActive to false)
  static async deleteUser(id: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });
  }

  // Get all users (admin only)
  static async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { predictions: true }
          }
        }
      }),
      prisma.user.count()
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Sync user role to Firestore
  static async syncUserRoleToFirestore(firebaseUid: string, role: UserRole): Promise<void> {
    try {
      const firestore = getFirestoreDb();
      if (firestore) {
        await firestore.collection('users').doc(firebaseUid).set({
          role: role.toLowerCase(),
          updatedAt: new Date()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Failed to sync user role to Firestore:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Get user role from Firestore
  static async getUserRoleFromFirestore(firebaseUid: string): Promise<string | null> {
    try {
      const firestore = getFirestoreDb();
      if (firestore) {
        const doc = await firestore.collection('users').doc(firebaseUid).get();
        return doc.exists ? doc.data()?.role || null : null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user role from Firestore:', error);
      return null;
    }
  }

  // Check if user exists by Firebase UID
  static async userExists(firebaseUid: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true }
    });
    return !!user;
  }

  // Get user statistics (admin only)
  static async getUserStats() {
    const [totalUsers, activeUsers, roleStats, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      })
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      roleDistribution: roleStats.reduce((acc: Record<string, number>, stat: any) => {
        acc[stat.role.toLowerCase()] = stat._count.role;
        return acc;
      }, {} as Record<string, number>),
      recentUsers
    };
  }
}