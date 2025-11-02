
export interface PriceHistory {
  date: string;
  price: number;
}

export interface Ingredient {
  id: string;
  name: string;
  priceHistory: PriceHistory[];
  unit: string; // e.g., kg, L, piece
  quantity: number; // e.g., 1 for 1kg, 500 for 500ml
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number; // The amount of the ingredient used in the recipe, in the ingredient's base unit
}

export interface Recipe {
  id:string;
  name: string;
  ingredients: RecipeIngredient[];
  sellingPrice: number;
}

export interface Sale {
  id: string;
  date: string;
  recipeId: string; // Link to the recipe that was sold
  quantity: number; // How many units were sold
  pricePerUnit: number;
  customer?: string;
  paymentStatus: 'paid' | 'credit';
}

export interface Note {
  id: string;
  content: string;
  date: string;
}

export type View = 'dashboard' | 'ingredients' | 'recipes' | 'notes' | 'sales' | 'recipe-assistant';