
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCookieStorage } from './hooks/useCookieStorage.ts';
import { Ingredient, Sale, View, Note, Recipe } from './types.ts';
import { DashboardIcon, IngredientsIcon, NotesIcon, SalesIcon, MoonIcon, SunIcon, RecipeAssistantIcon, RecipeIcon } from './components/Icons.tsx';
import Dashboard from './components/Dashboard.tsx';
import Ingredients from './components/Ingredients.tsx';
import { Notes, RecipeAssistant } from './components/Recipe.tsx';
import Recipes from './components/Recipes.tsx';
import Sales from './components/Sales.tsx';
import { vibrate } from './utils/haptics.ts';

// --- URL State Management ---
interface AppState {
  ingredients: Ingredient[];
  recipes: Recipe[];
  sales: Sale[];
  notes: Note[];
}

// Unicode-safe Base64 encoding/decoding
function utoa(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}
function atou(b64: string): string {
  return decodeURIComponent(escape(atob(b64)));
}

const getInitialState = (): AppState => {
  try {
    const search = window.location.hash.split('?')[1];
    if (search) {
      const params = new URLSearchParams(search);
      const data = params.get('data');
      if (data) {
        const decodedJson = atou(data); // Use unicode-safe decoder
        const parsedState = JSON.parse(decodedJson);
        // Basic validation to ensure we have the expected structure
        if (
          'ingredients' in parsedState &&
          'recipes' in parsedState &&
          'sales' in parsedState &&
          'notes' in parsedState
        ) {
          return parsedState;
        }
      }
    }
  } catch (error) {
    console.error("Failed to parse state from URL hash:", error);
  }
  // Return default empty state if hash is invalid or not present
  return {
    ingredients: [],
    recipes: [],
    sales: [],
    notes: [],
  };
};


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
  const [currentHash, setCurrentHash] = useState(window.location.hash.split('?')[0]);
  
  const initialState = getInitialState();
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialState.ingredients);
  const [recipes, setRecipes] = useState<Recipe[]>(initialState.recipes);
  const [sales, setSales] = useState<Sale[]>(initialState.sales);
  const [notes, setNotes] = useState<Note[]>(initialState.notes);
  const [theme, setTheme] = useCookieStorage<'light' | 'dark'>('theme', 'light');
  
  // Easter egg state
  const [hearts, setHearts] = useState<{ id: number; style: React.CSSProperties; content: string }[]>([]);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);

  // This effect synchronizes the app state to the URL hash
  useEffect(() => {
    // We skip the first render to avoid an unnecessary URL update on load
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
    }
      
    const appState: AppState = { ingredients, recipes, sales, notes };
    const jsonState = JSON.stringify(appState);
    const base64State = utoa(jsonState); // Use unicode-safe encoder
    
    // Get the current view from the hash
    const currentView = currentHash.replace('#/', '') || 'dashboard';
    const newHash = `#/${currentView}?data=${base64State}`;
    
    // Use replaceState to avoid cluttering browser history
    history.replaceState(null, '', newHash);

  }, [ingredients, recipes, sales, notes, currentHash]);

  // This effect handles navigation (view changes)
  useEffect(() => {
    const handleHashChange = () => {
        const newHash = window.location.hash.split('?')[0] || '#/dashboard';
        setCurrentHash(newHash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const view: View = (currentHash.replace('#/', '') || 'dashboard') as View;

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
  
  const currentViewHref = `#/${view}`;

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
                <SideNavItem key={item.href} icon={item.icon} label={item.label} href={item.href} isActive={currentViewHref === item.href} />
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
            <BottomNavItem key={item.href} icon={item.icon} label={item.label} href={item.href} isActive={currentViewHref === item.href} />
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

const updateHash = (newHash: string) => {
    const currentHash = window.location.hash.split('?')[0];
    if (currentHash !== newHash) {
        // Preserve existing query parameters (like our data)
        const search = window.location.hash.split('?')[1];
        window.location.hash = search ? `${newHash}?${search}` : newHash;
    }
};


// SideNavItem Component for desktop sidebar
const SideNavItem: React.FC<NavItemProps> = ({ icon, label, href, isActive }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    vibrate();
    updateHash(href);
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
    updateHash(href);
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
