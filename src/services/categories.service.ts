// Serviço de gerenciamento de categorias usando Supabase

import { Category } from '../types';
import { supabase } from '../lib/supabase';

class CategoriesService {

  // Converte do banco → aplicação
private mapFromDB(db: any): Category {
  return {
    id: db.id,
    nome: db.nome,
    visivel: db.visivel,
    parentId: db.parent_id ?? null,
    slug: db.slug,
    description: db.description,
    order: db.order ?? 0
  };
}


  // Converte da aplicação → banco
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

  // Buscar todas as categorias
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("order", { ascending: true });

    if (error) {
      console.error("Erro ao buscar categorias:", error.message);
      return [];
    }

    return Array.isArray(data) ? data.map((c) => this.mapFromDB(c)) : [];
  }

  // Buscar categoria por ID
  async getById(id: number): Promise<Category | undefined> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar categoria:", error.message);
      return undefined;
    }

    return data ? this.mapFromDB(data) : undefined;
  }

  // Categorias principais
  async getTopLevelCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .is("parent_id", null)
      .order("order", { ascending: true });

    if (error) {
      console.error("Erro ao buscar categorias de nível superior:", error.message);
      return [];
    }

    return Array.isArray(data) ? data.map((c) => this.mapFromDB(c)) : [];
  }

  // Buscar subcategorias
  async getSubcategories(parentId: number | null): Promise<Category[]> {
    const query = supabase
      .from("categories")
      .select("*")
      .order("order", { ascending: true });

    parentId === null
      ? query.is("parent_id", null)
      : query.eq("parent_id", parentId);

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar subcategorias:", error.message);
      return [];
    }

    return Array.isArray(data) ? data.map((c) => this.mapFromDB(c)) : [];
  }

  // Criar slug limpo
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .trim();
  }

  // Criar categoria
  async create(
    categoryData: Omit<Category, "id" | "slug" | "order"> & { parentId?: number | null }
  ): Promise<Category | null> {
    const slug = this.generateSlug(categoryData.nome);

    const siblings = await this.getSubcategories(categoryData.parentId ?? null);
    const order =
      siblings.length > 0
        ? Math.max(...siblings.map((s) => s.order)) + 1
        : 0;

    const newCategory = {
      nome: categoryData.nome,
      visivel: categoryData.visivel ?? true,
      parent_id: categoryData.parentId ?? null,
      slug,
      description: categoryData.description ?? null,
      order,
    };

    const { data, error } = await supabase
      .from("categories")
      .insert(newCategory)
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar categoria:", error.message);
      return null;
    }

    return this.mapFromDB(data);
  }

  // Atualizar categoria
  async update(
    id: number,
    categoryData: Partial<Omit<Category, "slug">>
  ): Promise<Category | null> {
    if (id === 1) {
      console.warn("Não é permitido editar a categoria padrão");
      return (await this.getById(id)) ?? null;
    }

    const updateData = this.mapToDB(categoryData);

    if (categoryData.nome) {
      updateData.slug = this.generateSlug(categoryData.nome);
    }

    const { data, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar categoria:", error.message);
      return null;
    }

    return this.mapFromDB(data);
  }

  // Excluir categoria
  async delete(id: number): Promise<boolean> {
    if (id === 1) {
      console.warn("Não é permitido excluir a categoria padrão");
      return false;
    }

    const categoryToDelete = await this.getById(id);
    if (!categoryToDelete) return false;

    const children = await this.getSubcategories(id);

    // Reatribuir filhos
    for (const child of children) {
      await this.update(child.id, { parentId: categoryToDelete.parentId });
    }

    // Reatribuir produtos para categoria padrão
    await supabase.from("products").update({ categoria_id: 1 }).eq("categoria_id", id);

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar categoria:", error.message);
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
          .from("categories")
          .update({ order: sibling.order - 1 })
          .eq("id", sibling.id);
      }
    }

    const newSiblings = await this.getSubcategories(newParentId);
    for (const sibling of newSiblings) {
      if (sibling.id !== categoryId && sibling.order >= newOrder) {
        await supabase
          .from("categories")
          .update({ order: sibling.order + 1 })
          .eq("id", sibling.id);
      }
    }

    await supabase
      .from("categories")
      .update({ order: newOrder, parent_id: newParentId })
      .eq("id", categoryId);
  }

  // Retorna a categoria e todos os descendentes
  async getDescendants(categoryId: number): Promise<Category[]> {
    const all = await this.getAll();
    const descendants: Category[] = [];
    const queue = [categoryId];

    while (queue.length) {
      const id = queue.shift()!;
      const category = all.find((c) => c.id === id);

      if (category) {
        descendants.push(category);
        all
          .filter((c) => c.parentId === id)
          .forEach((c) => queue.push(c.id));
      }
    }

    return descendants;
  }

  async initialize(): Promise<void> {
    // seeds futuros
  }
}

export const categoriesService = new CategoriesService();
