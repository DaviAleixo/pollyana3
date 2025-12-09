// Serviço de gerenciamento de categorias
// Centraliza toda a lógica de CRUD de categorias usando Supabase

import { Category } from '../types';
import { supabase } from '../lib/supabase';

class CategoriesService {
  // Converte os dados do banco para o formato esperado pela aplicação
  private mapFromDB(dbCategory: any): Category {
    return {
      id: dbCategory.id,
      nome: dbCategory.nome,
      visivel: dbCategory.visivel,
      parentId: dbCategory.parent_id,
      slug: dbCategory.slug,
      description: dbCategory.description,
      order: dbCategory.order,
    };
  }

  // Converte os dados da aplicação para o formato do banco
  private mapToDB(category: Partial<Category>): any {
    const dbData: any = {};
    if (category.nome !== undefined) dbData.nome = category.nome;
    if (category.visivel !== undefined) dbData.visivel = category.visivel;
    if (category.parentId !== undefined) dbData.parent_id = category.parentId;
    if (category.slug !== undefined) dbData.slug = category.slug;
    if (category.description !== undefined) dbData.description = category.description;
    if (category.order !== undefined) dbData.order = category.order;
    return dbData;
  }

  // Obter todas as categorias, ordenadas e com estrutura plana
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }

    return data ? data.map(this.mapFromDB) : [];
  }

  // Obter categoria por ID
  async getById(id: number): Promise<Category | undefined> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar categoria:', error);
      return undefined;
    }

    return data ? this.mapFromDB(data) : undefined;
  }

  // Obter categorias de nível superior (sem pai)
  async getTopLevelCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('order', { ascending: true });

    if (error) {
      console.error('Erro ao buscar categorias de nível superior:', error);
      return [];
    }

    return data ? data.map(this.mapFromDB) : [];
  }

  // Obter subcategorias de uma categoria pai
  async getSubcategories(parentId: number | null): Promise<Category[]> {
    const query = supabase
      .from('categories')
      .select('*')
      .order('order', { ascending: true });

    if (parentId === null) {
      query.is('parent_id', null);
    } else {
      query.eq('parent_id', parentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar subcategorias:', error);
      return [];
    }

    return data ? data.map(this.mapFromDB) : [];
  }

  // Gerar slug a partir do nome
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  // Criar nova categoria
  async create(categoryData: Omit<Category, 'id' | 'slug' | 'order'> & { parentId?: number | null }): Promise<Category | null> {
    const slug = this.generateSlug(categoryData.nome);

    const siblings = await this.getSubcategories(categoryData.parentId || null);
    const order = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) + 1 : 0;

    const newCategory = {
      nome: categoryData.nome,
      visivel: categoryData.visivel,
      parent_id: categoryData.parentId === undefined ? null : categoryData.parentId,
      slug,
      description: categoryData.description,
      order,
    };

    const { data, error } = await supabase
      .from('categories')
      .insert(newCategory)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria:', error);
      return null;
    }

    return data ? this.mapFromDB(data) : null;
  }

  // Atualizar categoria existente
  async update(id: number, categoryData: Partial<Omit<Category, 'slug'>>): Promise<Category | null> {
    if (id === 1) {
      console.warn('Cannot edit default category');
      const category = await this.getById(id);
      return category || null;
    }

    const updateData = this.mapToDB(categoryData);

    if (categoryData.nome) {
      updateData.slug = this.generateSlug(categoryData.nome);
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar categoria:', error);
      return null;
    }

    return data ? this.mapFromDB(data) : null;
  }

  // Excluir categoria
  async delete(id: number): Promise<boolean> {
    if (id === 1) {
      console.warn('Cannot delete default category');
      return false;
    }

    const categoryToDelete = await this.getById(id);
    if (!categoryToDelete) return false;

    const children = await this.getSubcategories(id);
    for (const child of children) {
      await this.update(child.id, { parentId: categoryToDelete.parentId });
    }

    await supabase
      .from('products')
      .update({ categoria_id: 1 })
      .eq('categoria_id', id);

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar categoria:', error);
      return false;
    }

    return true;
  }

  // Reordenar categorias
  async reorder(categoryId: number, newOrder: number, newParentId: number | null): Promise<void> {
    const categoryToMove = await this.getById(categoryId);
    if (!categoryToMove) return;

    const oldSiblings = await this.getSubcategories(categoryToMove.parentId);
    for (const sibling of oldSiblings) {
      if (sibling.id !== categoryId && sibling.order > categoryToMove.order) {
        await supabase
          .from('categories')
          .update({ order: sibling.order - 1 })
          .eq('id', sibling.id);
      }
    }

    const newSiblings = await this.getSubcategories(newParentId);
    for (const sibling of newSiblings) {
      if (sibling.id !== categoryId && sibling.order >= newOrder) {
        await supabase
          .from('categories')
          .update({ order: sibling.order + 1 })
          .eq('id', sibling.id);
      }
    }

    await supabase
      .from('categories')
      .update({ order: newOrder, parent_id: newParentId })
      .eq('id', categoryId);
  }

  // Obter todos os descendentes de uma categoria (incluindo ela mesma)
  async getDescendants(categoryId: number): Promise<Category[]> {
    const allCategories = await this.getAll();
    const descendants: Category[] = [];
    const queue: number[] = [categoryId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (currentId) {
        const currentCategory = allCategories.find(c => c.id === currentId);
        if (currentCategory) {
          descendants.push(currentCategory);
          const children = allCategories.filter(c => c.parentId === currentId);
          children.forEach(child => queue.push(child.id));
        }
      }
    }
    return descendants;
  }

  // Inicializar categorias padrão se não existirem
  async initialize(): Promise<void> {
  }
}

export const categoriesService = new CategoriesService();