
import React, { useState, useRef, useEffect } from 'react';
import { Sale, Recipe } from '../types';
import { PlusIcon, TrashIcon } from './Icons';
import { CURRENCY_SYMBOL } from '../constants';
import Modal from './Modal';
import { vibrate } from '../utils/haptics';

interface SalesProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  recipes: Recipe[];
}

const Sales: React.FC<SalesProps> = ({ sales, setSales, recipes }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipeId, setRecipeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [customer, setCustomer] = useState('');
  
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const touchStartRef = useRef(0);

  useEffect(() => {
      // Pre-fill price when recipe changes
      if (recipeId) {
          const selectedRecipe = recipes.find(r => r.id === recipeId);
          if (selectedRecipe) {
              setPricePerUnit(selectedRecipe.sellingPrice.toString());
          }
      }
  }, [recipeId, recipes]);

  const buttonBaseStyle = "px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50";
  const primaryButton = `${buttonBaseStyle} bg-gradient-to-br from-primary to-indigo-500 hover:shadow-lg hover:shadow-primary/40 focus:ring-primary`;
  const transparentButton = "px-4 py-2 rounded-xl bg-black/10 hover:bg-black/20";
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (id: string, e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const swipeDistance = touchStartRef.current - touchEnd;
    
    if (swipeDistance > 75) {
      if(swipedItemId !== id) vibrate(30);
      setSwipedItemId(id);
    } else if (swipeDistance < -75) {
      if(swipedItemId) vibrate(30);
      setSwipedItemId(null);
    }
  };


  const handleAddSale = () => {
    if (quantity && pricePerUnit && recipeId) {
      vibrate();
      const newSale: Sale = {
        id: new Date().toISOString(),
        date: new Date().toISOString(),
        recipeId,
        quantity: parseInt(quantity),
        pricePerUnit: parseFloat(pricePerUnit),
        customer,
      };
      setSales([newSale, ...sales]);
      resetForm();
      setIsModalOpen(false);
    }
  };

  const handleDeleteSale = (id: string) => {
    vibrate([100, 30, 50]);
    setSales(sales.filter(sale => sale.id !== id));
  }

  const resetForm = () => {
    setRecipeId('');
    setQuantity('');
    setPricePerUnit('');
    setCustomer('');
  };

  const formInputStyle = "w-full p-3 border border-border rounded-xl bg-white/10 placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
  const recipeMap = new Map(recipes.map(r => [r.id, r.name]));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Track Sales</h2>
        <button
          onClick={() => { vibrate(); setIsModalOpen(true); }}
          className={`${primaryButton} interactive-press flex items-center`}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Sale
        </button>
      </div>

      <div className="liquid-glass rounded-2xl">
        <div className="hidden md:grid grid-cols-6 gap-4 font-bold p-4 border-b border-border">
            <div>Date</div>
            <div>Recipe Sold</div>
            <div>Quantity</div>
            <div>Price / Unit</div>
            <div>Total</div>
            <div>Actions</div>
        </div>
        <div>
        {sales.length > 0 ? (
          sales.map(sale => (
            <div 
              key={sale.id}
              className="relative border-b border-border last:border-b-0 overflow-hidden"
              onClick={() => { if (swipedItemId === sale.id) setSwipedItemId(null); }}
            >
               <div className="absolute top-0 right-0 h-full flex items-center w-[120px]">
                <button
                  onClick={() => handleDeleteSale(sale.id)}
                  className="bg-red-500 text-white h-full w-full flex items-center justify-center font-semibold interactive-press"
                  aria-label={`Delete sale from ${new Date(sale.date).toLocaleDateString()}`}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
              <div
                className={`relative transition-transform duration-300 ease-out bg-solid-background/50 dark:bg-solid-background/70`}
                style={{ transform: swipedItemId === sale.id ? 'translateX(-120px)' : 'translateX(0)' }}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(sale.id, e)}
              >
                <div className="p-4">
                  <div className="grid grid-cols-[1fr_auto] md:grid-cols-6 md:gap-4 md:items-center">
                      <div className="md:col-span-1">
                          <div className="font-bold md:font-normal text-lg md:text-base">{new Date(sale.date).toLocaleDateString()}</div>
                          <div className="text-sm text-text-secondary md:hidden">{sale.customer || 'N/A'}</div>
                      </div>
                      
                      <div className="hidden md:block font-semibold">{recipeMap.get(sale.recipeId) || 'Unknown Recipe'}</div>
                      <div className="hidden md:block">{sale.quantity}</div>
                      <div className="hidden md:block">{CURRENCY_SYMBOL}{sale.pricePerUnit.toFixed(2)}</div>
                      <div className="hidden md:block font-medium">{CURRENCY_SYMBOL}{(sale.quantity * sale.pricePerUnit).toFixed(2)}</div>
                      
                      <div className="flex items-center md:col-start-6">
                          <button onClick={() => handleDeleteSale(sale.id)} className="interactive-press text-red-500 hover:text-red-700 md:hidden">
                              <TrashIcon className="h-5 w-5" />
                          </button>
                      </div>
                  </div>
                  <div className="md:hidden grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-border">
                      <div className="col-span-3 font-bold text-lg">{recipeMap.get(sale.recipeId) || 'Unknown Recipe'}</div>
                      <div>
                          <span className="text-sm text-text-secondary block">Quantity</span> {sale.quantity}
                      </div>
                      <div>
                          <span className="text-sm text-text-secondary block">Price/Unit</span> {CURRENCY_SYMBOL}{sale.pricePerUnit.toFixed(2)}
                      </div>
                      <div>
                          <span className="text-sm text-text-secondary block">Total</span>
                          <span className="font-bold">{CURRENCY_SYMBOL}{(sale.quantity * sale.pricePerUnit).toFixed(2)}</span>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="p-4 text-text-secondary">No sales recorded yet. Click "Add Sale" to start tracking.</p>
        )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Sale">
        <div className="space-y-4">
          <select value={recipeId} onChange={e => setRecipeId(e.target.value)} className={`${formInputStyle} `}>
            <option value="">-- Select a Recipe --</option>
            {recipes.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input type="number" placeholder="Quantity Sold" value={quantity} onChange={e => setQuantity(e.target.value)} className={formInputStyle}/>
          <input type="number" placeholder="Price Per Unit" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} className={formInputStyle}/>
          <input type="text" placeholder="Customer Name (Optional)" value={customer} onChange={e => setCustomer(e.target.value)} className={formInputStyle}/>
          <div className="flex justify-end space-x-2 pt-2">
            <button onClick={() => setIsModalOpen(false)} className={`${transparentButton} interactive-press`}>Cancel</button>
            <button onClick={handleAddSale} className={`${primaryButton} interactive-press`} disabled={!recipeId}>Add</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Sales;