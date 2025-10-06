import { PrismaClient } from '@prisma/client';
import { 
  Article, 
  Tutorial, 
  Topic, 
  Resource, 
  Category, 
  Author,
  UserRole,
  Difficulty,
  Status,
  ResourceType
} from '../schema/learning-hub';

const prisma = new PrismaClient();

// Article model
export class ArticleModel {
  static async create(data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.article.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  static async findById(id: string) {
    return await prisma.article.findUnique({
      where: { id },
      include: {
        author: true,
        category: true
      }
    });
  }

  static async findBySlug(slug: string) {
    return await prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        category: true
      }
    });
  }

  static async findMany(filters: {
    role?: UserRole;
    category?: string;
    difficulty?: Difficulty;
    status?: Status;
    featured?: boolean;
    popular?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const { role, category, difficulty, status, featured, popular, limit = 20, offset = 0 } = filters;
    
    return await prisma.article.findMany({
      where: {
        ...(role && { role }),
        ...(category && { category: { name: category } }),
        ...(difficulty && { difficulty }),
        ...(status && { status }),
        ...(featured !== undefined && { featured }),
        ...(popular !== undefined && { popular })
      },
      include: {
        author: true,
        category: true
      },
      orderBy: [
        { featured: 'desc' },
        { popular: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });
  }

  static async search(query: string, filters: {
    role?: UserRole;
    category?: string;
    difficulty?: Difficulty;
    limit?: number;
    offset?: number;
  } = {}) {
    const { role, category, difficulty, limit = 20, offset = 0 } = filters;
    
    return await prisma.article.findMany({
      where: {
        status: 'published',
        ...(role && { role }),
        ...(category && { category: { name: category } }),
        ...(difficulty && { difficulty }),
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } }
        ]
      },
      include: {
        author: true,
        category: true
      },
      orderBy: [
        { featured: 'desc' },
        { popular: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });
  }

  static async update(id: string, data: Partial<Article>) {
    return await prisma.article.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  static async delete(id: string) {
    return await prisma.article.delete({
      where: { id }
    });
  }

  static async incrementViewCount(id: string) {
    return await prisma.article.update({
      where: { id },
      data: {
        viewCount: { increment: 1 }
      }
    });
  }
}

// Tutorial model
export class TutorialModel {
  static async create(data: Omit<Tutorial, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.tutorial.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  static async findById(id: string) {
    return await prisma.tutorial.findUnique({
      where: { id },
      include: {
        author: true,
        category: true
      }
    });
  }

  static async findBySlug(slug: string) {
    return await prisma.tutorial.findUnique({
      where: { slug },
      include: {
        author: true,
        category: true
      }
    });
  }

  static async findMany(filters: {
    role?: UserRole;
    category?: string;
    difficulty?: Difficulty;
    status?: Status;
    featured?: boolean;
    popular?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const { role, category, difficulty, status, featured, popular, limit = 20, offset = 0 } = filters;
    
    return await prisma.tutorial.findMany({
      where: {
        ...(role && { role }),
        ...(category && { category: { name: category } }),
        ...(difficulty && { difficulty }),
        ...(status && { status }),
        ...(featured !== undefined && { featured }),
        ...(popular !== undefined && { popular })
      },
      include: {
        author: true,
        category: true
      },
      orderBy: [
        { featured: 'desc' },
        { popular: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });
  }

  static async update(id: string, data: Partial<Tutorial>) {
    return await prisma.tutorial.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  static async delete(id: string) {
    return await prisma.tutorial.delete({
      where: { id }
    });
  }
}

// Topic model
export class TopicModel {
  static async create(data: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.topic.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  static async findById(id: string) {
    return await prisma.topic.findUnique({
      where: { id },
      include: {
        author: true,
        category: true
      }
    });
  }

  static async findBySlug(slug: string) {
    return await prisma.topic.findUnique({
      where: { slug },
      include: {
        author: true,
        category: true
      }
    });
  }

  static async findMany(filters: {
    role?: UserRole;
    category?: string;
    difficulty?: Difficulty;
    status?: Status;
    featured?: boolean;
    popular?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const { role, category, difficulty, status, featured, popular, limit = 20, offset = 0 } = filters;
    
    return await prisma.topic.findMany({
      where: {
        ...(role && { role }),
        ...(category && { category: { name: category } }),
        ...(difficulty && { difficulty }),
        ...(status && { status }),
        ...(featured !== undefined && { featured }),
        ...(popular !== undefined && { popular })
      },
      include: {
        author: true,
        category: true
      },
      orderBy: [
        { featured: 'desc' },
        { popular: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });
  }

  static async update(id: string, data: Partial<Topic>) {
    return await prisma.topic.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  static async delete(id: string) {
    return await prisma.topic.delete({
      where: { id }
    });
  }
}

// Resource model
export class ResourceModel {
  static async create(data: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.resource.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  static async findById(id: string) {
    return await prisma.resource.findUnique({
      where: { id },
      include: {
        author: true,
        category: true
      }
    });
  }

  static async findMany(filters: {
    role?: UserRole;
    category?: string;
    type?: ResourceType;
    status?: Status;
    featured?: boolean;
    popular?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const { role, category, type, status, featured, popular, limit = 20, offset = 0 } = filters;
    
    return await prisma.resource.findMany({
      where: {
        ...(role && { role }),
        ...(category && { category: { name: category } }),
        ...(type && { type }),
        ...(status && { status }),
        ...(featured !== undefined && { featured }),
        ...(popular !== undefined && { popular })
      },
      include: {
        author: true,
        category: true
      },
      orderBy: [
        { featured: 'desc' },
        { popular: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });
  }

  static async update(id: string, data: Partial<Resource>) {
    return await prisma.resource.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  static async delete(id: string) {
    return await prisma.resource.delete({
      where: { id }
    });
  }

  static async incrementDownloadCount(id: string) {
    return await prisma.resource.update({
      where: { id },
      data: {
        downloadCount: { increment: 1 }
      }
    });
  }
}

// Category model
export class CategoryModel {
  static async create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.category.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  static async findById(id: string) {
    return await prisma.category.findUnique({
      where: { id }
    });
  }

  static async findBySlug(slug: string) {
    return await prisma.category.findUnique({
      where: { slug }
    });
  }

  static async findMany(filters: {
    status?: Status;
    parentId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status, parentId, limit = 50, offset = 0 } = filters;
    
    return await prisma.category.findMany({
      where: {
        ...(status && { status }),
        ...(parentId && { parentId })
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      take: limit,
      skip: offset
    });
  }

  static async update(id: string, data: Partial<Category>) {
    return await prisma.category.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  static async delete(id: string) {
    return await prisma.category.delete({
      where: { id }
    });
  }
}

// Author model
export class AuthorModel {
  static async create(data: Omit<Author, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.author.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  static async findById(id: string) {
    return await prisma.author.findUnique({
      where: { id }
    });
  }

  static async findByEmail(email: string) {
    return await prisma.author.findUnique({
      where: { email }
    });
  }

  static async findMany(filters: {
    status?: Status;
    role?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status, role, limit = 50, offset = 0 } = filters;
    
    return await prisma.author.findMany({
      where: {
        ...(status && { status }),
        ...(role && { role })
      },
      orderBy: [
        { name: 'asc' }
      ],
      take: limit,
      skip: offset
    });
  }

  static async update(id: string, data: Partial<Author>) {
    return await prisma.author.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  static async delete(id: string) {
    return await prisma.author.delete({
      where: { id }
    });
  }
}
