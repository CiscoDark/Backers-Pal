
import { GoogleGenAI } from "@google/genai";
import { Ingredient, Sale } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might show a more user-friendly error.
  // For this environment, we assume the key is present.
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const getCurrentPrice = (ingredient: Ingredient): number => {
    if (!ingredient.priceHistory || ingredient.priceHistory.length === 0) {
        return 0;
    }
    // The last entry is the most recent price
    return ingredient.priceHistory[ingredient.priceHistory.length - 1].price;
};

export const getBusinessTips = async (
    ingredients: Ingredient[],
    sales: Sale[],
    totalRevenue: number
): Promise<string> => {
    if (!API_KEY) {
        return "API Key is not configured. Please set the API_KEY environment variable to use this feature.";
    }

    try {
        const ingredientsSummary = ingredients.map(ing =>
            `- ${ing.name}: ₦${getCurrentPrice(ing).toFixed(2)} per ${ing.quantity}${ing.unit}`
        ).join('\n');

        const recentSalesSummary = sales.slice(0, 10).map(sale =>
            `- Sold ${sale.quantity} units at ₦${sale.pricePerUnit.toFixed(2)} each`
        ).join('\n');

        const prompt = `
You are an expert business advisor for a small home-based food business in Nigeria.
My business is a small home-based baking business.
Please provide 3 actionable, creative, and simple tips to grow my business.

Here is my current business data:

**Business Performance:**
- My total revenue so far is ₦${totalRevenue.toFixed(2)}.
- Here are some of my recent sales:
${recentSalesSummary || 'No sales recorded yet.'}

**Product Information:**
- My ingredients list:
${ingredientsSummary || 'No ingredients listed yet.'}

**The Ask:**
Based on the data provided, give me 3 clear, actionable tips to improve my baking business.
Since cost data is not available, focus on areas like:
1.  **Sales & Marketing:** How can I sell more, find new customers, or encourage repeat business based on my sales patterns?
2.  **Product Offering:** Any ideas for new products or bundles based on my ingredients?
3.  **Customer Engagement:** How can I build a stronger brand?

Please format your response clearly using markdown, with bullet points for each tip. Be encouraging and straight to the point.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error fetching business tips:", error);
        return "Sorry, I couldn't fetch any business tips at the moment. Please check your connection or API key and try again.";
    }
};

export const getRecipeSuggestion = async (
    userPrompt: string
): Promise<string> => {
    if (!API_KEY) {
        return "API Key is not configured. Please set the API_KEY environment variable to use this feature.";
    }

    try {
        const prompt = `
You are an expert baking assistant for a small home-based bakery in Nigeria.
A user is asking for help with a recipe. Here is their request: "${userPrompt}".

Please provide a clear, concise, and easy-to-follow response.
If it's a recipe request, format it using markdown with these headings:
- ### Recipe Title
- **Ingredients:** (use a bulleted list)
- **Instructions:** (use a numbered list)
- **Tips:** (provide 1-2 helpful tips, especially considering a small business context, like bulk buying or local ingredient substitutions)

If it's a question about a baking technique, provide a clear explanation.
Be encouraging and professional.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error fetching recipe suggestion:", error);
        return "Sorry, I couldn't generate a recipe at the moment. Please check your connection or API key and try again.";
    }
};
