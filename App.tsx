
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Ingredient, Sale, View, Note, Recipe } from './types';
import { DashboardIcon, IngredientsIcon, NotesIcon, SalesIcon, MoonIcon, SunIcon, RecipeAssistantIcon, RecipeIcon } from './components/Icons';
import Dashboard from './components/Dashboard';
import Ingredients from './components/Ingredients';
import Notes, { RecipeAssistant } from './components/Recipe';
import Recipes from './components/Recipes';
import Sales from './components/Sales';
import { vibrate } from './utils/haptics';

// ThemeToggle Component
const ThemeToggle: React.FC<{ theme: 'light' | 'dark'; setTheme: (theme: 'light' | 'dark') => void }> = ({ theme, setTheme }) => {
  const toggleTheme = () => {
    vibrate();
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="interactive-press p-2 rounded-full text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
    </button>
  );
};


// Main App Component
const App: React.FC = () => {
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [ingredients, setIngredients] = useLocalStorage<Ingredient[]>('ingredients', []);
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('recipes', []);
  const [sales, setSales] = useLocalStorage<Sale[]>('sales', []);
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  
  // Easter egg state
  const [hearts, setHearts] = useState<{ id: number; style: React.CSSProperties; content: string }[]>([]);
  const tapCountRef = useRef(0);
  // Fix: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const view: View = (currentHash.replace('#/', '') || 'dashboard') as View;

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Effect to track mouse for liquid glass effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      document.documentElement.style.setProperty('--mouse-x', `${clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);


  // Effect to apply theme class and aurora background
  useEffect(() => {
    const root = window.document.documentElement;
    const aurora = window.document.getElementById('aurora');
    const lightBg = 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)';
    const darkBg = 'linear-gradient(-45deg, #0f2027, #203a43, #2c5364, #596a72)';

    if (theme === 'dark') {
      root.classList.add('dark');
      if (aurora) aurora.style.backgroundImage = darkBg;
    } else {
      root.classList.remove('dark');
      if (aurora) aurora.style.backgroundImage = lightBg;
    }
  }, [theme]);
  
  // One-time data migration for users with old data structure
  useEffect(() => {
    // Migration for price -> priceHistory
    const requiresPriceMigration = ingredients.some(ing => 'price' in ing && !('priceHistory' in ing));
    if (requiresPriceMigration) {
      const migratedIngredients = ingredients.map(ing => {
        if ('price' in ing && !('priceHistory' in ing)) {
          const newIng: any = { ...(ing as any) };
          newIng.priceHistory = [{ date: new Date().toISOString(), price: newIng.price }];
          delete newIng.price;
          return newIng as Ingredient;
        }
        return ing;
      });
      setIngredients(migratedIngredients);
    }
  }, [ingredients, setIngredients]);

  const { totalRevenue, totalUnitsSold } = useMemo(() => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.quantity * sale.pricePerUnit, 0);
    const totalUnitsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    return { totalRevenue, totalUnitsSold };
  }, [sales]);

  // --- Easter Egg Logic ---
  const triggerHeartShower = () => {
    vibrate([20, 40, 60]);
    const heartEmojis = ['❤️', '💖', '💕', '😍', '😘'];
    const newHearts = Array.from({ length: 30 }).map((_, i) => ({
      id: i + Date.now(),
      content: heartEmojis[Math.floor(Math.random() * heartEmojis.length)],
      // Fix: Added a type assertion to the style object to match React.CSSProperties.
      style: {
        left: `${Math.random() * 100}%`,
        animation: `fall-and-fade ${Math.random() * 2 + 3}s ${Math.random() * 2}s linear forwards`,
        fontSize: `${Math.random() * 1.5 + 1}rem`,
        position: 'absolute',
        top: '-50px',
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: 9999,
      } as React.CSSProperties
    }));
    setHearts(newHearts);

    setTimeout(() => setHearts([]), 6000); // Cleanup after animations
  };

  const handleTitleTap = () => {
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapCountRef.current += 1;
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 2000);

    if (tapCountRef.current >= 7) {
      triggerHeartShower();
      tapCountRef.current = 0;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    }
  };


  const renderView = () => {
    switch (view) {
      case 'ingredients':
        return <Ingredients ingredients={ingredients} setIngredients={setIngredients} />;
      case 'recipes':
        return <Recipes recipes={recipes} setRecipes={setRecipes} ingredients={ingredients} />;
      case 'notes':
        return <Notes notes={notes} setNotes={setNotes} />;
      case 'recipe-assistant':
        return <RecipeAssistant />;
      case 'sales':
        return <Sales sales={sales} setSales={setSales} recipes={recipes} />;
      case 'dashboard':
      default:
        return (
          <Dashboard
            totalRevenue={totalRevenue}
            totalUnitsSold={totalUnitsSold}
            ingredients={ingredients}
            recipes={recipes}
            sales={sales}
            setIngredients={setIngredients}
            setSales={setSales}
            setRecipes={setRecipes}
          />
        );
    }
  };
  
  const navItems = [
    { href: '#/dashboard', label: 'Dashboard', icon: <DashboardIcon className="h-6 w-6" /> },
    { href: '#/ingredients', label: 'Ingredients', icon: <IngredientsIcon className="h-6 w-6" /> },
    { href: '#/recipes', label: 'Recipes', icon: <RecipeIcon className="h-6 w-6" /> },
    { href: '#/sales', label: 'Sales', icon: <SalesIcon className="h-6 w-6" /> },
    { href: '#/notes', label: 'Notes', icon: <NotesIcon className="h-6 w-6" /> },
    { href: '#/recipe-assistant', label: 'AI Assistant', icon: <RecipeAssistantIcon className="h-6 w-6" /> },
  ];

  return (
    <div className="flex h-screen bg-transparent text-text-primary">
      {/* Heart Shower Container */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-[999]">
          {hearts.map(heart => (
              <div key={heart.id} style={heart.style}>
                  {heart.content}
              </div>
          ))}
      </div>

      {/* Sidebar for Desktop */}
      <nav className="hidden md:flex w-64 liquid-glass m-3 rounded-4xl p-4 flex-col">
        <div className="flex justify-between items-center mb-8 px-2">
          <h1 onClick={handleTitleTap} className="text-2xl font-bold text-primary cursor-pointer select-none">Bakers Pal</h1>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
        <ul>
            {navItems.map(item => (
                <SideNavItem key={item.href} icon={item.icon} label={item.label} href={item.href} isActive={'#/' + view === item.href} />
            ))}
        </ul>
        <div className="mt-auto p-4 bg-black/5 rounded-2xl text-center">
            <p className="text-sm text-text-secondary">Made with ❤️ for your business</p>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-3">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-4 liquid-glass p-2 rounded-2xl">
            <h1 onClick={handleTitleTap} className="text-2xl font-bold text-primary ml-2 cursor-pointer select-none">Bakers Pal</h1>
            <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
        {renderView()}
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 liquid-glass flex justify-around p-1 rounded-2xl z-10">
         {navItems.map(item => (
            <BottomNavItem key={item.href} icon={item.icon} label={item.label} href={item.href} isActive={'#/' + view === item.href} />
        ))}
      </nav>
    </div>
  );
};

// NavItemProps Interface
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

// SideNavItem Component for desktop sidebar
const SideNavItem: React.FC<NavItemProps> = ({ icon, label, href, isActive }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    vibrate();
    if (window.location.hash !== href) {
        window.location.hash = href;
    }
  };

  return (
    <li className="mb-2">
      <a
        href={href}
        onClick={handleClick}
        className={`interactive-press w-full flex items-center p-3 rounded-2xl transition-all duration-300 ${
          isActive
            ? 'bg-white/20 dark:bg-white/15 text-text-primary shadow-glow-primary'
            : 'text-text-secondary hover:bg-white/10 dark:hover:bg-black/10 hover:text-text-primary'
        }`}
      >
        {icon}
        <span className="ml-4 font-semibold">{label}</span>
      </a>
    </li>
  );
};

// BottomNavItem Component for mobile navigation bar
const BottomNavItem: React.FC<Omit<NavItemProps, 'onClick'>> = ({ icon, label, href, isActive }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    vibrate();
    if (window.location.hash !== href) {
        window.location.hash = href;
    }
  };

  return (
      <a
          href={href}
          onClick={handleClick}
          className={`interactive-press flex flex-col items-center justify-center w-full p-2 rounded-xl transition-all duration-200 ${
              isActive ? 'text-primary bg-white/20 dark:bg-white/15 shadow-glow-primary' : 'text-text-secondary hover:bg-white/10 dark:hover:bg-black/10'
          }`}
      >
          {icon}
          <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : ''}`}>{label}</span>
      </a>
  );
};


export default App;
