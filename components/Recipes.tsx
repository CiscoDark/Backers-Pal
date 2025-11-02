
import React, { useState, useMemo } from 'react';
import { Recipe, Ingredient, RecipeIngredient } from '../types.ts';
import { PlusIcon, TrashIcon, PencilIcon, CloseIcon } from './Icons.tsx';
import { CURRENCY_SYMBOL } from '../constants.ts';
import Modal from './Modal.tsx';
import { vibrate } from '../utils/haptics.ts';

interface RecipesProps {
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  ingredients: Ingredient[];
}

const buttonBaseStyle = "px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50";
const primaryButton = `${buttonBaseStyle} bg-gradient-to-br from-primary to-indigo-500 hover:shadow-lg hover:shadow-primary/40 focus:ring-primary`;
const transparentButton = "px-4 py-2 rounded-xl bg-black/10 hover:bg-black/20";

const Recipes: React.FC<RecipesProps> = ({ recipes, setRecipes, ingredients }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const handleOpenAddModal = () => {
    vibrate();
    setEditingRecipe(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (recipe: Recipe) => {
    vibrate();
    setEditingRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecipe(null);
  };
  
  const handleDeleteRecipe = (id: string) => {
    vibrate([100, 30, 50]);
    setRecipes(recipes.filter(r => r.id !== id));
  }

  const handleSaveRecipe = (recipe: Recipe) => {
    vibrate();
    if (editingRecipe) {
      setRecipes(recipes.map(r => r.id === recipe.id ? recipe : r));
    } else {
      setRecipes([...recipes, { ...recipe, id: new Date().toISOString() }]);
    }
    handleCloseModal();
  };
  
  const ingredientMap = useMemo(() => new Map(ingredients.map(i => [i.id, i])), [ingredients]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Manage Recipes</h2>
        <button
          onClick={handleOpenAddModal}
          className={`${primaryButton} interactive-press flex items-center`}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Recipe
        </button>
      </div>
      
      <div className="space-y-4">
        {recipes.length > 0 ? (
          recipes.map(recipe => (
            <div key={recipe.id} className="liquid-glass p-4 rounded-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-primary">{recipe.name}</h3>
                  <p className="font-semibold">{CURRENCY_SYMBOL}{recipe.sellingPrice.toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleOpenEditModal(recipe)} className="interactive-press text-primary hover:text-primary-hover p-2 rounded-full">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDeleteRecipe(recipe.id)} className="interactive-press text-red-500 hover:text-red-700 p-2 rounded-full">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <h4 className="font-semibold text-sm mb-2">Ingredients:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {recipe.ingredients.map((ri, index) => {
                    const ingredient = ingredientMap.get(ri.ingredientId);
                    return <li key={index}>{ri.quantity}{ingredient?.unit} of {ingredient?.name || 'Unknown Ingredient'}</li>
                  })}
                </ul>
              </div>
            </div>
          ))
        ) : (
          <div className="liquid-glass p-6 rounded-2xl text-center text-text-secondary">
            <p>No recipes added yet. Click "Add Recipe" to define the ingredients and price for your products.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <RecipeFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveRecipe}
          recipe={editingRecipe}
          ingredients={ingredients}
        />
      )}
    </div>
  );
};

// --- RecipeFormModal ---
interface RecipeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
  recipe: Recipe | null;
  ingredients: Ingredient[];
}

const RecipeFormModal: React.FC<RecipeFormModalProps> = ({ isOpen, onClose, onSave, recipe, ingredients }) => {
  const [name, setName] = useState(recipe?.name || '');
  const [sellingPrice, setSellingPrice] = useState(recipe?.sellingPrice.toString() || '');
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>(recipe?.ingredients || [{ ingredientId: '', quantity: 0 }]);
  
  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: string) => {
    const newIngredients = [...recipeIngredients];
    if (field === 'quantity') {
      newIngredients[index] = { ...newIngredients[index], [field]: parseFloat(value) || 0 };
    } else {
      newIngredients[index] = { ...newIngredients[index], [field]: value };
    }
    setRecipeIngredients(newIngredients);
  };
  
  const addIngredientField = () => {
    vibrate();
    setRecipeIngredients([...recipeIngredients, { ingredientId: '', quantity: 0 }]);
  };
  
  const removeIngredientField = (index: number) => {
    vibrate();
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const price = parseFloat(sellingPrice);
    if (name && !isNaN(price) && recipeIngredients.every(ri => ri.ingredientId && ri.quantity > 0)) {
      onSave({
        id: recipe?.id || '',
        name,
        sellingPrice: price,
        ingredients: recipeIngredients,
      });
    } else {
      alert("Please fill out all fields correctly.");
    }
  };

  const formInputStyle = "w-full p-3 border border-border rounded-xl bg-white/10 placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={recipe ? "Edit Recipe" : "Add New Recipe"}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <input type="text" placeholder="Recipe Name (e.g., Chocolate Chip Cookies)" value={name} onChange={e => setName(e.target.value)} className={formInputStyle}/>
        <input type="number" placeholder="Selling Price per Unit" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} className={formInputStyle}/>

        <h4 className="font-bold pt-2">Ingredients</h4>
        {recipeIngredients.map((ri, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={ri.ingredientId}
              onChange={e => handleIngredientChange(index, 'ingredientId', e.target.value)}
              className={`${formInputStyle} flex-1`}
            >
              <option value="">-- Select Ingredient --</option>
              {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
            </select>
            <input
              type="number"
              placeholder="Qty"
              value={ri.quantity || ''}
              onChange={e => handleIngredientChange(index, 'quantity', e.target.value)}
              className={`${formInputStyle} w-24`}
            />
            <button onClick={() => removeIngredientField(index)} className="text-red-500 p-2 rounded-full hover:bg-red-500/10">
                <TrashIcon className="h-5 w-5"/>
            </button>
          </div>
        ))}
        <button onClick={addIngredientField} className="text-primary font-semibold text-sm flex items-center">
            <PlusIcon className="h-4 w-4 mr-1"/> Add Ingredient
        </button>

      </div>
      <div className="flex justify-end space-x-2 pt-4 border-t border-border mt-4">
        <button onClick={onClose} className={`${transparentButton} interactive-press`}>Cancel</button>
        <button onClick={handleSave} className={`${primaryButton} interactive-press`}>Save Recipe</button>
      </div>
    </Modal>
  );
};


export default Recipes;
