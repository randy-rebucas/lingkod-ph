'use server';

import { getDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const CreateTutorialSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().min(1, 'Category is required'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedTime: z.number().min(1, 'Estimated time must be at least 1 minute'),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),
  prerequisites: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  authorNotes: z.string().optional(),
});

export type CreateTutorialInput = z.infer<typeof CreateTutorialSchema>;

// Create new tutorial
export async function createTutorial(tutorialData: CreateTutorialInput, authorId: string) {
  try {
    const validatedData = CreateTutorialSchema.parse(tutorialData);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const tutorialsRef = collection(getDb(), 'learningHubTutorials');
    const docRef = await addDoc(tutorialsRef, {
      ...validatedData,
      authorId,
      views: 0,
      likes: 0,
      completions: 0,
      averageRating: 0,
      totalRatings: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { 
      success: true, 
      message: 'Tutorial created successfully',
      data: { id: docRef.id }
    };
  } catch (error) {
    console.error('Error creating tutorial:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create tutorial' 
    };
  }
}

// Get tutorial categories
export async function getTutorialCategories() {
  try {
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    // For now, return static categories
    // In a real implementation, you'd fetch from a categories collection
    const categories = [
      'Web Development',
      'Mobile Development',
      'Data Science',
      'Machine Learning',
      'UI/UX Design',
      'Digital Marketing',
      'Business',
      'Productivity',
      'Career Development',
      'Finance',
      'Health & Wellness',
      'Creative Arts',
    ];

    return { success: true, data: categories };
  } catch (error) {
    console.error('Error getting tutorial categories:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get categories' 
    };
  }
}

// Get popular tags
export async function getPopularTutorialTags() {
  try {
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    // For now, return static popular tags
    // In a real implementation, you'd analyze existing tutorials to get popular tags
    const popularTags = [
      'React',
      'Vue.js',
      'Angular',
      'JavaScript',
      'TypeScript',
      'Python',
      'Java',
      'Node.js',
      'Express',
      'MongoDB',
      'PostgreSQL',
      'Docker',
      'Kubernetes',
      'AWS',
      'Google Cloud',
      'Azure',
      'Figma',
      'Adobe XD',
      'Sketch',
      'Photoshop',
      'Illustrator',
      'SEO',
      'Analytics',
      'Social Media',
      'Content Marketing',
      'Email Marketing',
      'Project Management',
      'Agile',
      'Scrum',
      'Leadership',
    ];

    return { success: true, data: popularTags };
  } catch (error) {
    console.error('Error getting popular tutorial tags:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get popular tags' 
    };
  }
}

// Save tutorial draft
export async function saveTutorialDraft(tutorialData: CreateTutorialInput, authorId: string) {
  try {
    const validatedData = CreateTutorialSchema.parse({
      ...tutorialData,
      status: 'draft',
    });
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const tutorialsRef = collection(getDb(), 'learningHubTutorials');
    const docRef = await addDoc(tutorialsRef, {
      ...validatedData,
      authorId,
      views: 0,
      likes: 0,
      completions: 0,
      averageRating: 0,
      totalRatings: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { 
      success: true, 
      message: 'Tutorial draft saved successfully',
      data: { id: docRef.id }
    };
  } catch (error) {
    console.error('Error saving tutorial draft:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save tutorial draft' 
    };
  }
}

// Validate tutorial content
export async function validateTutorialContent(content: string) {
  try {
    const issues = [];
    
    // Basic content validation
    if (content.length < 200) {
      issues.push('Tutorial content should be at least 200 characters long');
    }
    
    if (content.length > 100000) {
      issues.push('Tutorial content should not exceed 100,000 characters');
    }
    
    // Check for tutorial-specific requirements
    if (!content.includes('Step') && !content.includes('step')) {
      issues.push('Tutorial should include step-by-step instructions');
    }
    
    if (content.split(' ').length < 50) {
      issues.push('Tutorial should have at least 50 words');
    }
    
    // Check for code blocks (common in tutorials)
    const hasCodeBlocks = content.includes('```') || content.includes('<code>');
    if (!hasCodeBlocks) {
      issues.push('Consider adding code examples to make the tutorial more helpful');
    }
    
    return { 
      success: true, 
      data: { 
        isValid: issues.length === 0,
        issues,
        wordCount: content.split(' ').length,
        characterCount: content.length,
        hasCodeBlocks
      }
    };
  } catch (error) {
    console.error('Error validating tutorial content:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to validate tutorial content' 
    };
  }
}

// Get difficulty levels
export async function getDifficultyLevels() {
  try {
    const difficultyLevels = [
      {
        value: 'beginner',
        label: 'Beginner',
        description: 'No prior experience required',
        estimatedTime: '15-30 minutes',
      },
      {
        value: 'intermediate',
        label: 'Intermediate',
        description: 'Some experience with the topic recommended',
        estimatedTime: '30-60 minutes',
      },
      {
        value: 'advanced',
        label: 'Advanced',
        description: 'Strong knowledge of the topic required',
        estimatedTime: '60+ minutes',
      },
    ];

    return { success: true, data: difficultyLevels };
  } catch (error) {
    console.error('Error getting difficulty levels:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get difficulty levels' 
    };
  }
}
