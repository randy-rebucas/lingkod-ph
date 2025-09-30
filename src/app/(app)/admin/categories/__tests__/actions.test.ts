import { handleUpdateCategory, handleAddCategory, handleDeleteCategory } from '../actions';

describe('Admin Categories Actions', () => {
  const mockActor = { id: 'admin-id', name: 'Admin' };

  describe('handleUpdateCategory', () => {
    it('updates category successfully', async () => {
      const result = await handleUpdateCategory('category-123', 'Updated Category', mockActor);
      expect(result.error).toBeNull();
      expect(result.message).toBe('Category updated to "Updated Category".');
    });

    it('handles update errors', async () => {
      const result = await handleUpdateCategory('invalid-id', 'Test', mockActor);
      expect(result.error).toBeDefined();
    });
  });

  describe('handleAddCategory', () => {
    it('adds category successfully', async () => {
      const result = await handleAddCategory('New Category', mockActor);
      expect(result.error).toBeNull();
      expect(result.message).toBe('Category "New Category" added successfully.');
    });

    it('validates category name', async () => {
      const result = await handleAddCategory('', mockActor);
      expect(result.error).toBe('Category name is required.');
    });
  });

  describe('handleDeleteCategory', () => {
    it('deletes category successfully', async () => {
      const result = await handleDeleteCategory('category-123', mockActor);
      expect(result.error).toBeNull();
      expect(result.message).toBe('Category has been deleted successfully.');
    });

    it('handles delete errors', async () => {
      const result = await handleDeleteCategory('invalid-id', mockActor);
      expect(result.error).toBeDefined();
    });
  });
});
