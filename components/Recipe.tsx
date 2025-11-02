
import React, { useState } from 'react';
import { Note } from '../types';
import { PlusIcon, TrashIcon, SparkleIcon } from './Icons';
import { vibrate } from '../utils/haptics';
import { getRecipeSuggestion } from '../services/geminiService';

interface NotesProps {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}

export const Notes: React.FC<NotesProps> = ({ notes, setNotes }) => {
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (newNote.trim()) {
      vibrate();
      const note: Note = {
        id: new Date().toISOString(),
        content: newNote.trim(),
        date: new Date().toISOString(),
      };
      setNotes([note, ...notes]);
      setNewNote('');
    }
  };

  const handleDeleteNote = (id: string) => {
    vibrate([100, 30, 50]);
    setNotes(notes.filter(note => note.id !== id));
  };

  const buttonBaseStyle = "px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50";
  const primaryButton = `${buttonBaseStyle} bg-gradient-to-br from-primary to-indigo-500 hover:shadow-lg hover:shadow-primary/40 focus:ring-primary`;

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Notes</h2>
      <div className="liquid-glass p-6 rounded-2xl mb-8">
        <h3 className="text-lg font-bold mb-4">Add a new note</h3>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Jot down your ideas, reminders, or custom recipes here..."
          className="w-full p-3 h-32 border border-border rounded-xl bg-white/10 placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
        <button
          onClick={handleAddNote}
          className={`mt-4 w-full md:w-auto ${primaryButton} interactive-press flex items-center justify-center`}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Save Note
        </button>
      </div>

      <div className="space-y-4">
        {notes.length > 0 ? (
          notes.map(note => (
            <div key={note.id} className="liquid-glass p-4 rounded-2xl">
              <div className="flex justify-between items-start">
                <p className="whitespace-pre-wrap text-text-primary pr-4">{note.content}</p>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="interactive-press text-red-500 hover:text-red-700 flex-shrink-0"
                  aria-label="Delete note"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-text-secondary mt-2 text-right">
                {new Date(note.date).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <div className="liquid-glass p-6 rounded-2xl text-center text-text-secondary">
            <p>You haven't added any notes yet. Use the form above to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};


// --- New RecipeAssistant Component ---
export const RecipeAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [recipe, setRecipe] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateRecipe = async () => {
    if (!prompt.trim()) return;
    vibrate();
    setIsLoading(true);
    setRecipe('');
    const result = await getRecipeSuggestion(prompt);
    setRecipe(result);
    setIsLoading(false);
  };
  
  const handleExampleClick = (examplePrompt: string) => {
    vibrate();
    setPrompt(examplePrompt);
  }

  const buttonBaseStyle = "px-5 py-2.5 rounded-xl font-semibold text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50";
  const primaryButton = `${buttonBaseStyle} bg-gradient-to-br from-primary to-indigo-500 hover:shadow-lg hover:shadow-primary/40 focus:ring-primary`;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold">AI Recipe Assistant</h2>
        <SparkleIcon className="h-8 w-8 text-primary" />
      </div>

      <div className="liquid-glass p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-4">What would you like to bake?</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'A simple recipe for chocolate chip cookies' or 'How to get a crispy crust on my bread?'"
          className="w-full p-3 h-24 border border-border rounded-xl bg-white/10 placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          disabled={isLoading}
        />
        <div className="text-xs text-text-secondary mt-2 mb-4">Try an example:
            <button onClick={() => handleExampleClick("Recipe for Nigerian meat pie")} className="ml-2 underline hover:text-primary">Nigerian meat pie</button>,
            <button onClick={() => handleExampleClick("How to make croissants fluffy?")} className="ml-1 underline hover:text-primary">fluffy croissants</button>,
            <button onClick={() => handleExampleClick("Gluten-free chocolate cake recipe")} className="ml-1 underline hover:text-primary">gluten-free cake</button>.
        </div>

        <button
          onClick={handleGenerateRecipe}
          disabled={isLoading || !prompt.trim()}
          className={`${primaryButton} interactive-press w-full md:w-auto disabled:bg-gray-400 disabled:shadow-none disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center`}
        >
          {isLoading ? 'Generating...' : 'Get Recipe / Advice'}
        </button>
      </div>

      {(isLoading || recipe) && (
        <div className="liquid-glass p-6 rounded-2xl">
          <h3 className="text-xl md:text-2xl font-bold mb-4">Assistant's Response</h3>
          {isLoading ? (
            <div className="flex items-center space-x-2 text-text-secondary">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span>Thinking... please wait.</span>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans bg-transparent p-0">{recipe}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
