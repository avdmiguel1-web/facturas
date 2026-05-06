import React, { useEffect, useState } from "react";
import { Plus, Folder, Tag, Edit3, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "@/lib/api";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get("/categories/");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error(getApiErrorMessage(error, "Error al cargar categorías"));
    } finally {
      setLoading(false);
    }
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", description: "" });
    setShowCategoryModal(true);
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, description: category.description || "" });
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({ name: "", description: "" });
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();

    if (!categoryForm.name.trim()) {
      toast.error("El nombre es requerido.");
      return;
    }

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, categoryForm);
        toast.success("Categoría actualizada.");
      } else {
        await api.post("/categories/", categoryForm);
        toast.success("Categoría creada.");
      }
      closeCategoryModal();
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(getApiErrorMessage(error, "Error al guardar la categoría"));
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta categoría y sus subcategorías?")) {
      return;
    }

    try {
      await api.delete(`/categories/${categoryId}`);
      toast.success("Categoría eliminada.");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(getApiErrorMessage(error, "Error al eliminar la categoría"));
    }
  };

  const openCreateSubcategory = (category) => {
    setSelectedCategory(category);
    setEditingSubcategory(null);
    setSubcategoryForm({ name: "", description: "" });
    setShowSubcategoryModal(true);
  };

  const openEditSubcategory = (category, subcategory) => {
    setSelectedCategory(category);
    setEditingSubcategory(subcategory);
    setSubcategoryForm({ name: subcategory.name, description: subcategory.description || "" });
    setShowSubcategoryModal(true);
  };

  const closeSubcategoryModal = () => {
    setShowSubcategoryModal(false);
    setSelectedCategory(null);
    setEditingSubcategory(null);
    setSubcategoryForm({ name: "", description: "" });
  };

  const handleSubcategorySubmit = async (event) => {
    event.preventDefault();

    if (!subcategoryForm.name.trim()) {
      toast.error("El nombre es requerido.");
      return;
    }

    try {
      if (editingSubcategory) {
        await api.put(`/categories/subcategories/${editingSubcategory.id}`, subcategoryForm);
        toast.success("Subcategoría actualizada.");
      } else {
        await api.post(`/categories/${selectedCategory.id}/subcategories`, subcategoryForm);
        toast.success("Subcategoría creada.");
      }
      closeSubcategoryModal();
      fetchCategories();
    } catch (error) {
      console.error("Error saving subcategory:", error);
      toast.error(getApiErrorMessage(error, "Error al guardar la subcategoría"));
    }
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (!window.confirm("¿Estás seguro de eliminar esta subcategoría?")) {
      return;
    }

    try {
      await api.delete(`/categories/subcategories/${subcategoryId}`);
      toast.success("Subcategoría eliminada.");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast.error(getApiErrorMessage(error, "Error al eliminar la subcategoría"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-zinc-200 rounded-none p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#09090B] mb-2 tracking-tight">
            Gestión de Categorías
          </h2>
          <p className="text-zinc-600">
            Crea, edita y elimina categorías y subcategorías para clasificar los datos extraídos.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateCategory}
          data-testid="open-create-category"
          className="inline-flex items-center gap-2 bg-[#0033CC] text-white rounded-none px-6 py-2 font-medium hover:bg-[#002299] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-none p-6">
        {loading ? (
          <p className="text-zinc-500">Cargando categorías...</p>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
            <p className="text-zinc-500 mb-4">No hay categorías definidas aún.</p>
            <button
              onClick={openCreateCategory}
              className="text-[#0033CC] hover:underline font-medium"
            >
              Crear la primera categoría
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.id} className="border border-zinc-200 rounded-none p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0033CC] bg-opacity-10 rounded-none">
                      <Folder className="w-5 h-5 text-[#0033CC]" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-[#09090B]">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-zinc-600">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openCreateSubcategory(category)}
                      className="inline-flex items-center gap-2 border border-[#0033CC] text-[#0033CC] rounded-none px-4 py-2 text-sm hover:bg-[#0033CC] hover:text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Subcategoría
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-zinc-700 mb-3">Subcategorías</h4>
                  {category.subcategories && category.subcategories.length > 0 ? (
                    <div className="space-y-2">
                      {category.subcategories.map((subcategory) => (
                        <div
                          key={subcategory.id}
                          className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-none"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Tag className="w-4 h-4 text-[#0033CC]" />
                              <span className="font-medium text-zinc-900">{subcategory.name}</span>
                            </div>
                            {subcategory.description && (
                              <p className="text-sm text-zinc-600">{subcategory.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditSubcategory(category, subcategory)}
                              className="inline-flex items-center gap-2 border border-zinc-300 text-zinc-900 rounded-none px-4 py-2 text-sm hover:bg-zinc-100 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubcategory(subcategory.id)}
                              className="inline-flex items-center gap-2 border border-zinc-300 text-red-600 rounded-none px-4 py-2 text-sm hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">Aún no hay subcategorías en esta categoría.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-zinc-200 rounded-none p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-bold text-[#09090B]">
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </h3>
              <button onClick={closeCategoryModal} className="text-zinc-400 hover:text-zinc-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-[#0033CC] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Descripción</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-[#0033CC] focus:border-transparent"
                  rows={4}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="flex-1 bg-transparent border border-zinc-300 text-zinc-900 rounded-none px-6 py-2 font-medium hover:bg-zinc-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0033CC] text-white rounded-none px-6 py-2 font-medium hover:bg-[#002299] transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubcategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-zinc-200 rounded-none p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-bold text-[#09090B]">
                {editingSubcategory ? "Editar Subcategoría" : `Nueva Subcategoría para ${selectedCategory?.name}`}
              </h3>
              <button onClick={closeSubcategoryModal} className="text-zinc-400 hover:text-zinc-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubcategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={subcategoryForm.name}
                  onChange={(event) => setSubcategoryForm({ ...subcategoryForm, name: event.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-[#0033CC] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Descripción</label>
                <textarea
                  value={subcategoryForm.description}
                  onChange={(event) => setSubcategoryForm({ ...subcategoryForm, description: event.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-none focus:outline-none focus:ring-2 focus:ring-[#0033CC] focus:border-transparent"
                  rows={4}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeSubcategoryModal}
                  className="flex-1 bg-transparent border border-zinc-300 text-zinc-900 rounded-none px-6 py-2 font-medium hover:bg-zinc-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0033CC] text-white rounded-none px-6 py-2 font-medium hover:bg-[#002299] transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
