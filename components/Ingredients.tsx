

import React, { useState, useRef } from 'react';
import { Ingredient } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, HistoryIcon } from './Icons';
import { CURRENCY_SYMBOL } from '../constants';
import Modal from './Modal';
import { vibrate } from '../utils/haptics';

interface IngredientsProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
}

const buttonBaseStyle = "px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50";
const primaryButton = `${buttonBaseStyle} bg-gradient-to-br from-primary to-indigo-500 hover:shadow-lg hover:shadow-primary/40 focus:ring-primary`;
const transparentButton = "px-4 py-2 rounded-xl bg-black/10 hover:bg-black/20";


const Ingredients: React.FC<IngredientsProps> = ({ ingredients, setIngredients }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  
  const [ingredientToUpdate, setIngredientToUpdate] = useState<Ingredient | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const [ingredientForHistory, setIngredientForHistory] = useState<Ingredient | null>(null);
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const touchStartRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (id: string, e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const swipeDistance = touchStartRef.current - touchEnd;
    
    if (swipeDistance > 75) { // Swipe left to open
      if(swipedItemId !== id) vibrate(30);
      setSwipedItemId(id);
    } else if (swipeDistance < -75) { // Swipe right to close
      if(swipedItemId) vibrate(30);
      setSwipedItemId(null);
    }
  };


  const getCurrentPrice = (ingredient: Ingredient) => {
    if (!ingredient.priceHistory || ingredient.priceHistory.length === 0) {
      return 0;
    }
    return ingredient.priceHistory[ingredient.priceHistory.length - 1].price;
  };

  const handleAddIngredient = () => {
    if (name && price && quantity && unit) {
      vibrate();
      const newIngredient: Ingredient = {
        id: new Date().toISOString(),
        name,
        priceHistory: [{ date: new Date().toISOString(), price: parseFloat(price) }],
        quantity: parseFloat(quantity),
        unit,
      };
      setIngredients([...ingredients, newIngredient]);
      resetForm();
      setIsAddModalOpen(false);
    }
  };

  const handleUpdatePrice = () => {
    if (!ingredientToUpdate || !newPrice) return;
    vibrate();
    setIngredients(ingredients.map(ing =>
        ing.id === ingredientToUpdate.id
            ? { ...ing, priceHistory: [...ing.priceHistory, { date: new Date().toISOString(), price: parseFloat(newPrice) }] }
            : ing
    ));
    setIngredientToUpdate(null);
    setNewPrice('');
  };
  
  const handleDeleteIngredient = (id: string) => {
    vibrate([100, 30, 50]); // Heavier vibration for delete
    setIngredients(ingredients.filter(ing => ing.id !== id));
  }

  const resetForm = () => {
    setName('');
    setPrice('');
    setQuantity('');
    setUnit('');
  };

  const formInputStyle = "w-full p-3 border border-border rounded-xl bg-white/10 placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Manage Ingredients</h2>
        <button
          onClick={() => { vibrate(); setIsAddModalOpen(true); }}
          className={`${primaryButton} interactive-press flex items-center`}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add
        </button>
      </div>

      <div className="liquid-glass rounded-2xl">
        <div className="hidden md:grid grid-cols-5 gap-4 font-bold p-4 border-b border-border">
            <div>Name</div>
            <div>Current Price</div>
            <div>Purchase Quantity</div>
            <div>Unit</div>
            <div>Actions</div>
        </div>
        <div>
        {ingredients.length > 0 ? (
          ingredients.map(ing => (
            <div 
              key={ing.id} 
              className="relative border-b border-border last:border-b-0 overflow-hidden"
              onClick={() => { if (swipedItemId === ing.id) setSwipedItemId(null); }}
            >
              <div className="absolute top-0 right-0 h-full flex items-center w-[120px]">
                <button
                  onClick={() => handleDeleteIngredient(ing.id)}
                  className="bg-red-500 text-white h-full w-full flex items-center justify-center font-semibold interactive-press"
                  aria-label={`Delete ${ing.name}`}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
              <div
                className={`relative transition-transform duration-300 ease-out bg-solid-background/50 dark:bg-solid-background/70`}
                style={{ transform: swipedItemId === ing.id ? 'translateX(-120px)' : 'translateX(0)' }}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(ing.id, e)}
              >
                <div className="p-4">
                  <div className="grid grid-cols-[1fr_auto] md:grid-cols-5 md:gap-4 md:items-center">
                      <div className="font-bold text-lg md:font-medium md:text-base">{ing.name}</div>
                      
                      <div className="hidden md:block">{CURRENCY_SYMBOL}{getCurrentPrice(ing).toFixed(2)}</div>
                      <div className="hidden md:block">{ing.quantity}</div>
                      <div className="hidden md:block">{ing.unit}</div>
                      
                      <div className="flex items-center space-x-3 md:col-start-5">
                          <button onClick={() => {vibrate(); setIngredientToUpdate(ing)}} className="interactive-press text-primary hover:text-primary-hover" title="Update Price">
                              <PencilIcon className="h-5 w-5" />
                          </button>
                          <button onClick={() => {vibrate(); setIngredientForHistory(ing)}} className="interactive-press text-secondary hover:text-green-400" title="View History">
                              <HistoryIcon className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDeleteIngredient(ing.id)} className="interactive-press text-red-500 hover:text-red-700 md:hidden" title="Delete Ingredient">
                              <TrashIcon className="h-5 w-5" />
                          </button>
                      </div>
                  </div>
                  <div className="md:hidden grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-border">
                      <div>
                          <span className="text-sm text-text-secondary block">Price</span>
                          {CURRENCY_SYMBOL}{getCurrentPrice(ing).toFixed(2)}
                      </div>
                      <div>
                          <span className="text-sm text-text-secondary block">Quantity</span>
                          {ing.quantity}
                      </div>
                      <div>
                          <span className="text-sm text-text-secondary block">Unit</span>
                          {ing.unit}
                      </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="p-4 text-text-secondary">No ingredients added yet. Click "Add" to start.</p>
        )}
        </div>
      </div>

      {/* Add Ingredient Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Ingredient">
        <div className="space-y-4">
          <input type="text" placeholder="Ingredient Name (e.g., Flour)" value={name} onChange={e => setName(e.target.value)} className={formInputStyle}/>
          <input type="number" placeholder="Initial Price" value={price} onChange={e => setPrice(e.target.value)} className={formInputStyle}/>
          <input type="number" placeholder="Purchase Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} className={formInputStyle}/>
          <input type="text" placeholder="Unit (e.g., kg, L, bag)" value={unit} onChange={e => setUnit(e.target.value)} className={formInputStyle}/>
          <div className="flex justify-end space-x-2 pt-2">
            <button onClick={() => setIsAddModalOpen(false)} className={`${transparentButton} interactive-press`}>Cancel</button>
            <button onClick={handleAddIngredient} className={`${primaryButton} interactive-press`}>Add</button>
          </div>
        </div>
      </Modal>

      {/* Update Price Modal */}
      <Modal isOpen={!!ingredientToUpdate} onClose={() => setIngredientToUpdate(null)} title={`Update Price for ${ingredientToUpdate?.name}`}>
        <div className="space-y-4">
            <p className="text-sm text-text-secondary">The current price is {CURRENCY_SYMBOL}{ingredientToUpdate ? getCurrentPrice(ingredientToUpdate).toFixed(2) : '0.00'}. Enter the new price below.</p>
            <input type="number" placeholder="New Price" value={newPrice} onChange={e => setNewPrice(e.target.value)} className={formInputStyle}/>
            <div className="flex justify-end space-x-2 pt-2">
                <button onClick={() => setIngredientToUpdate(null)} className={`${transparentButton} interactive-press`}>Cancel</button>
                <button onClick={handleUpdatePrice} className={`${primaryButton} interactive-press`}>Update</button>
            </div>
        </div>
      </Modal>

      {/* Price History Modal */}
       <Modal isOpen={!!ingredientForHistory} onClose={() => setIngredientForHistory(null)} title={`Price History for ${ingredientForHistory?.name}`}>
        <div className="space-y-2 max-h-80 overflow-y-auto">
            {ingredientForHistory?.priceHistory.slice().reverse().map(ph => (
                <div key={ph.date} className="flex justify-between p-3 bg-black/10 rounded-lg">
                    <span>{new Date(ph.date).toLocaleDateString()}</span>
                    <span className="font-semibold">{CURRENCY_SYMBOL}{ph.price.toFixed(2)}</span>
                </div>
            ))}
        </div>
      </Modal>
    </div>
  );
};

export default Ingredients;