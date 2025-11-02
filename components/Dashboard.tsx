
import React, { useState, useMemo, useRef } from 'react';
import { Ingredient, Sale, Recipe } from '../types';
import { CURRENCY_SYMBOL } from '../constants';
import { getBusinessTips } from '../services/geminiService';
import { SparkleIcon } from './Icons';
import { BarChart } from './Charts';
import { vibrate } from '../utils/haptics';

interface DashboardProps {
  totalRevenue: number;
  totalUnitsSold: number;
  ingredients: Ingredient[];
  recipes: Recipe[];
  sales: Sale[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
}

const buttonBaseStyle = "px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50";
const primaryButton = `${buttonBaseStyle} bg-gradient-to-br from-primary to-indigo-500 hover:shadow-lg hover:shadow-primary/40 focus:ring-primary`;
const secondaryButton = `${buttonBaseStyle} bg-gradient-to-br from-secondary to-green-400 hover:shadow-lg hover:shadow-secondary/30 focus:ring-secondary`;
const grayButton = `${buttonBaseStyle} bg-gradient-to-br from-gray-500 to-gray-600 hover:shadow-lg hover:shadow-gray-500/30 focus:ring-gray-400`;

const getCurrentPrice = (ingredient: Ingredient): number => {
    if (!ingredient.priceHistory || ingredient.priceHistory.length === 0) {
        return 0;
    }
    return ingredient.priceHistory[ingredient.priceHistory.length - 1].price;
};

const Dashboard: React.FC<DashboardProps> = ({
  totalRevenue,
  totalUnitsSold,
  ingredients,
  recipes,
  sales,
  setIngredients,
  setRecipes,
  setSales,
}) => {
  const [tips, setTips] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avgSalePrice = totalUnitsSold > 0 ? totalRevenue / totalUnitsSold : 0;

  const salesChartData = useMemo(() => {
    const dailySales: { [key: string]: number } = {};
    const sortedSales = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sortedSales.forEach(sale => {
      const date = new Date(sale.date).toLocaleDateString('en-CA');
      const revenue = sale.quantity * sale.pricePerUnit;
      dailySales[date] = (dailySales[date] || 0) + revenue;
    });
    return Object.entries(dailySales).slice(-7).map(([date, value]) => ({
      label: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      value,
    }));
  }, [sales]);

  const unitsSoldChartData = useMemo(() => {
    const dailyUnits: { [key: string]: number } = {};
    const sortedSales = [...sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sortedSales.forEach(sale => {
      const date = new Date(sale.date).toLocaleDateString('en-CA');
      dailyUnits[date] = (dailyUnits[date] || 0) + sale.quantity;
    });
    return Object.entries(dailyUnits).slice(-7).map(([date, value]) => ({
      label: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      value,
    }));
  }, [sales]);

  const profitMarginChartData = useMemo(() => {
    const ingredientPriceMap = new Map(ingredients.map(ing => [ing.id, getCurrentPrice(ing) / ing.quantity]));
    const recipeCostMap = new Map(recipes.map(recipe => {
        const cost = recipe.ingredients.reduce((acc, ri) => {
            const pricePerUnit = ingredientPriceMap.get(ri.ingredientId) || 0;
            return acc + (pricePerUnit * ri.quantity);
        }, 0);
        return [recipe.id, cost];
    }));

    const recipeStats = new Map<string, { totalRevenue: number, totalCost: number, name: string }>();

    sales.forEach(sale => {
        const recipe = recipes.find(r => r.id === sale.recipeId);
        if (!recipe) return;

        const costOfOneUnit = recipeCostMap.get(sale.recipeId) || 0;
        const saleRevenue = sale.quantity * sale.pricePerUnit;
        const saleCost = sale.quantity * costOfOneUnit;
        
        const stats = recipeStats.get(sale.recipeId) || { totalRevenue: 0, totalCost: 0, name: recipe.name };
        stats.totalRevenue += saleRevenue;
        stats.totalCost += saleCost;
        recipeStats.set(sale.recipeId, stats);
    });

    return Array.from(recipeStats.values()).map(data => {
        const profit = data.totalRevenue - data.totalCost;
        const margin = data.totalRevenue > 0 ? (profit / data.totalRevenue) * 100 : 0;
        return { label: data.name, value: margin };
    }).sort((a, b) => b.value - a.value);

  }, [sales, recipes, ingredients]);

  const handleGetTips = async () => {
    vibrate();
    setIsLoading(true);
    setTips('');
    const fetchedTips = await getBusinessTips(ingredients, sales, totalRevenue);
    setTips(fetchedTips);
    setIsLoading(false);
  };

  const handleExport = () => {
    vibrate();
    const dataToExport = { ingredients, recipes, sales };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bakers-pal-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    vibrate();
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File is not readable");
        const data = JSON.parse(text);
        
        if (data && 'ingredients' in data && 'sales' in data && 'recipes' in data) {
          setIngredients(data.ingredients);
          setRecipes(data.recipes);
          setSales(data.sales);
          alert('Data imported successfully!');
        } else {
          throw new Error('Invalid data format. File must contain "ingredients", "recipes", and "sales".');
        }
      } catch (error) {
        console.error("Failed to import data:", error);
        alert(`Failed to import data. Please use a valid backup file. Error: ${(error as Error).message}`);
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl md:text-3xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Revenue" value={`${CURRENCY_SYMBOL}${totalRevenue.toFixed(2)}`} />
        <StatCard title="Total Units Sold" value={totalUnitsSold.toString()} />
        <StatCard title="Avg. Sale Price" value={`${CURRENCY_SYMBOL}${avgSalePrice.toFixed(2)}`} />
      </div>

      <div>
          <h3 className="text-2xl font-bold mb-4">Business Analytics</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sales.length >= 2 ? (
                <>
                  <BarChart title="Recent Daily Revenue" data={salesChartData} yAxisPrefix={CURRENCY_SYMBOL} />
                  <BarChart title="Recent Units Sold" data={unitsSoldChartData} />
                </>
              ) : (
                <div className="liquid-glass p-6 rounded-2xl text-center text-text-secondary lg:col-span-2">
                    <p>Add more sales records to unlock insightful charts and track your business performance over time.</p>
                </div>
              )}
              {profitMarginChartData.length > 0 ? (
                <div className="lg:col-span-2">
                    <BarChart title="Profit Margin by Recipe" data={profitMarginChartData} yAxisSuffix="%" />
                </div>
              ) : (
                <div className="liquid-glass p-6 rounded-2xl text-center text-text-secondary lg:col-span-2">
                    <h3 className="text-lg font-bold mb-2">Profit Margins</h3>
                    <p>Create recipes and log sales to see which products are most profitable.</p>
                </div>
              )}
          </div>
      </div>

      <div className="liquid-glass p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <h3 className="text-xl md:text-2xl font-bold text-primary flex items-center">
                <SparkleIcon className="h-6 w-6 mr-2" />
                AI Business Advisor
            </h3>
            <button
            onClick={handleGetTips}
            disabled={isLoading}
            className={`${primaryButton} interactive-press disabled:bg-gray-400 disabled:shadow-none disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center`}
            >
            {isLoading ? 'Thinking...' : 'Get Business Tips'}
            </button>
        </div>
        
        {isLoading && <p className="text-text-secondary">Generating insights for your business...</p>}
        {tips && (
            <div className="prose dark:prose-invert mt-4 p-4 bg-white/10 dark:bg-white/5 rounded-xl max-w-none">
                 <pre className="whitespace-pre-wrap font-sans bg-transparent p-0">{tips}</pre>
            </div>
        )}
         {!tips && !isLoading && (
            <p className="text-text-secondary">Click the button to get personalized tips to boost your baking business!</p>
        )}
      </div>

      <div className="liquid-glass p-6 rounded-2xl">
        <h3 className="text-xl md:text-2xl font-bold mb-4">Data Management</h3>
        <p className="text-text-secondary mb-4">Save a backup of your data or import it on another device.</p>
        <div className="flex flex-col sm:flex-row gap-4">
            <button
                onClick={handleExport}
                className={`${secondaryButton} interactive-press flex-1`}
            >
                Export Data
            </button>
            <button
                onClick={handleImportClick}
                className={`${grayButton} interactive-press flex-1`}
            >
                Import Data
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="application/json"
            />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => (
  <div className="liquid-glass p-6 rounded-2xl">
    <h4 className="text-md font-semibold text-text-secondary mb-2">{title}</h4>
    <p className="text-2xl md:text-3xl font-bold text-text-primary">{value}</p>
  </div>
);

export default Dashboard;