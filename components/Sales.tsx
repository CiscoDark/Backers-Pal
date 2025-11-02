
import React, { useState, useEffect, useMemo } from 'react';
import { Sale, Recipe } from '../types';
import { PlusIcon, TrashIcon, CheckCircleIcon } from './Icons';
import { CURRENCY_SYMBOL } from '../constants';
import Modal from './Modal';
import { vibrate } from '../utils/haptics';

interface SalesProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  recipes: Recipe[];
}

const DebtorsList: React.FC<{ sales: Sale[]; }> = ({ sales }) => {
    const debtors = useMemo(() => {
        const creditSales = sales.filter(s => s.paymentStatus === 'credit');
        if (creditSales.length === 0) return null;

        const debtorsMap = new Map<string, number>();
        creditSales.forEach(sale => {
            const customerName = sale.customer || 'Unknown Customer';
            const currentDebt = debtorsMap.get(customerName) || 0;
            const saleTotal = sale.quantity * sale.pricePerUnit;
            debtorsMap.set(customerName, currentDebt + saleTotal);
        });

        return Array.from(debtorsMap.entries()).map(([name, total]) => ({ name, total })).sort((a,b) => b.total - a.total);
    }, [sales]);

    if (!debtors) return null;

    return (
        <div className="liquid-glass p-6 rounded-2xl mb-8">
            <h3 className="text-xl font-bold text-amber-500 mb-4">Customers on Credit</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {debtors.map(debtor => (
                    <div key={debtor.name} className="flex justify-between items-center p-3 bg-black/10 rounded-lg">
                        <span className="font-semibold">{debtor.name}</span>
                        <span className="font-bold text-amber-500">{CURRENCY_SYMBOL}{debtor.total.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


const Sales: React.FC<SalesProps> = ({ sales, setSales, recipes }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipeId, setRecipeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [customer, setCustomer] = useState('');
  const [isCredit, setIsCredit] = useState(false);

  useEffect(() => {
      if (recipeId) {
          const selectedRecipe = recipes.find(r => r.id === recipeId);
          if (selectedRecipe) {
              setPricePerUnit(selectedRecipe.sellingPrice.toString());
          }
      } else {
        setPricePerUnit('');
      }
  }, [recipeId, recipes]);

  const buttonBaseStyle = "px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50";
  const primaryButton = `${buttonBaseStyle} bg-gradient-to-br from-primary to-indigo-500 hover:shadow-lg hover:shadow-primary/40 focus:ring-primary`;
  const transparentButton = "px-4 py-2 rounded-xl bg-black/10 hover:bg-black/20";
  
  const handleMarkAsPaid = (saleId: string) => {
    vibrate();
    setSales(sales.map(s => s.id === saleId ? { ...s, paymentStatus: 'paid' } : s));
  };
  
  const handleAddSale = () => {
    if (isCredit && !customer.trim()) {
        alert("Please enter a customer name for credit sales.");
        return;
    }

    if (quantity && pricePerUnit && recipeId) {
      vibrate();
      const newSale: Sale = {
        id: new Date().toISOString(),
        date: new Date().toISOString(),
        recipeId,
        quantity: parseInt(quantity),
        pricePerUnit: parseFloat(pricePerUnit),
        customer: customer.trim(),
        paymentStatus: isCredit ? 'credit' : 'paid',
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
    setIsCredit(false);
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

      <DebtorsList sales={sales} />

      <div className="liquid-glass rounded-2xl">
        <div className="hidden md:grid grid-cols-6 gap-4 font-bold p-4 border-b border-border">
            <div>Date</div>
            <div>Recipe Sold</div>
            <div className="text-center">Quantity</div>
            <div className="text-right">Price / Unit</div>
            <div className="text-right">Total</div>
            <div className="text-center">Actions</div>
        </div>
        <div>
        {sales.length > 0 ? (
          sales.map(sale => (
            <div key={sale.id} className="border-b border-border last:border-b-0">
                <div className="p-4">
                  <div className="grid grid-cols-[1fr_auto] md:grid-cols-6 md:gap-4 md:items-center">
                      <div className="md:col-span-1">
                          <div className="font-bold md:font-normal text-lg md:text-base">{new Date(sale.date).toLocaleDateString()}</div>
                          <div className="text-sm text-text-secondary md:hidden">{sale.customer || 'N/A'}</div>
                      </div>
                      
                      <div className="hidden md:block font-semibold">{recipeMap.get(sale.recipeId) || 'Unknown Recipe'}</div>
                      <div className="hidden md:block text-center">{sale.quantity}</div>
                      <div className="hidden md:block text-right">{CURRENCY_SYMBOL}{sale.pricePerUnit.toFixed(2)}</div>
                      <div className="hidden md:block font-medium text-right">{CURRENCY_SYMBOL}{(sale.quantity * sale.pricePerUnit).toFixed(2)}</div>
                      
                      <div className="flex items-center justify-end space-x-2 md:col-start-6 md:justify-center">
                          {sale.paymentStatus === 'credit' && (
                              <button onClick={() => handleMarkAsPaid(sale.id)} className="interactive-press text-green-500 hover:text-green-400 p-1 rounded-full" title="Mark as Paid">
                                  <CheckCircleIcon className="h-6 w-6" />
                              </button>
                          )}
                          <button onClick={() => handleDeleteSale(sale.id)} className="interactive-press text-red-500 hover:text-red-700 p-1 rounded-full">
                              <TrashIcon className="h-6 w-6" />
                          </button>
                      </div>
                  </div>

                  {sale.paymentStatus === 'credit' && (
                    <div className="hidden md:block mt-2 pt-2 border-t border-border text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full">ON CREDIT</span>
                        <span className="text-text-secondary">Customer: <strong>{sale.customer || 'N/A'}</strong></span>
                      </div>
                    </div>
                  )}

                  <div className="md:hidden grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-border">
                      <div className="col-span-3 font-bold text-lg flex items-center justify-between">
                          <span>{recipeMap.get(sale.recipeId) || 'Unknown Recipe'}</span>
                          {sale.paymentStatus === 'credit' && (
                              <span className="text-xs font-semibold bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full">CREDIT</span>
                          )}
                      </div>
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
          <div>
            <input type="number" placeholder="Price Per Unit" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} className={formInputStyle}/>
            <p className="text-xs text-text-secondary mt-1 px-1">Price is suggested from the recipe, but you can change it.</p>
          </div>
          <input type="text" placeholder="Customer Name (Required for Credit)" value={customer} onChange={e => setCustomer(e.target.value)} className={formInputStyle}/>
          
          <div className="flex items-center space-x-2 py-2">
            <input 
              type="checkbox" 
              id="credit-checkbox" 
              checked={isCredit} 
              onChange={(e) => setIsCredit(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary bg-transparent"
            />
            <label htmlFor="credit-checkbox" className="text-text-primary select-none">Sold on Credit?</label>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-border mt-2">
            <button onClick={() => setIsModalOpen(false)} className={`${transparentButton} interactive-press`}>Cancel</button>
            <button onClick={handleAddSale} className={`${primaryButton} interactive-press`} disabled={!recipeId || !quantity || !pricePerUnit}>Add</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Sales;