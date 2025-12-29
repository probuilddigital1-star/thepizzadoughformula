/**
 * Pizza Style Presets
 * Default values and metadata for each pizza style
 *
 * @module calculator/presets
 */

/**
 * @typedef {Object} PizzaStylePreset
 * @property {string} name - Display name
 * @property {string} id - Unique identifier
 * @property {string} icon - Icon identifier for PizzaStyleIcon component
 * @property {string} description - Short description
 * @property {string} equipment - Recommended equipment
 * @property {Object} defaults - Default calculator values
 * @property {string} flourRecommendation - Recommended flour type
 * @property {string} bakeTemp - Recommended bake temperature
 * @property {string} bakeTime - Recommended bake time
 * @property {string[]} tips - Style-specific tips
 */

export const PIZZA_STYLES = {
  neapolitan: {
    id: 'neapolitan',
    name: 'Neapolitan',
    icon: 'neapolitan',
    description: 'Soft, pillowy, with charred leopard spots',
    equipment: 'Wood-fired or Ooni-style oven',
    defaults: {
      ballWeight: 250,
      hydration: 0.62,
      salt: 0.025,
      yeast: 0.003,
      oil: 0,
      sugar: 0
    },
    flourRecommendation: '00 Flour (Caputo Pizzeria, Antimo Caputo)',
    flourProtein: '11-12.5%',
    waterTemp: '55-60°F / 13-16°C (cold)',
    bakeTemp: '450-500°C / 850-900°F',
    bakeTime: '60-90 seconds',
    fermentType: 'cold',
    fermentInstructions: 'Bulk ferment 1-2 hours at room temp, then cold ferment 24-72 hours. Remove from fridge 2 hours before balling. Proof balls 2-4 hours before stretching.',
    tips: [
      'Use 00 flour for authentic texture',
      'High heat is essential for leopard spotting',
      'Cold ferment 24-72 hours for best flavor',
      'Stretch by hand, never use a rolling pin'
    ]
  },

  newYork: {
    id: 'newYork',
    name: 'New York',
    icon: 'newYork',
    description: 'Foldable slices with the perfect chew',
    equipment: 'Pizza steel or stone',
    defaults: {
      ballWeight: 280,
      hydration: 0.65,
      salt: 0.02,
      yeast: 0.004,
      oil: 0.03,
      sugar: 0.02
    },
    flourRecommendation: 'High-gluten bread flour (King Arthur, All Trumps)',
    flourProtein: '13-14%',
    waterTemp: '55-60°F / 13-16°C (cold)',
    bakeTemp: '260-290°C / 500-550°F',
    bakeTime: '8-12 minutes',
    fermentType: 'cold',
    fermentInstructions: 'Bulk ferment 1-2 hours at room temp, then cold ferment 24-48 hours. Remove from fridge 2 hours before balling. Proof balls 2-4 hours before stretching.',
    tips: [
      'Oil and sugar help with browning at lower temps',
      'Use high-gluten flour for that NY chew',
      'Preheat your steel/stone for at least 1 hour',
      'Par-bake for crispier results'
    ]
  },

  detroit: {
    id: 'detroit',
    name: 'Detroit',
    icon: 'detroit',
    description: 'Airy pan pizza with crispy frico edges',
    equipment: 'Detroit-style steel pan',
    defaults: {
      ballWeight: 400,
      hydration: 0.72,
      salt: 0.02,
      yeast: 0.005,
      oil: 0.04,
      sugar: 0.01
    },
    flourRecommendation: 'Bread flour or all-purpose',
    flourProtein: '11-13%',
    waterTemp: '75-80°F / 24-27°C (room temp)',
    bakeTemp: '230-260°C / 450-500°F',
    bakeTime: '12-15 minutes',
    fermentType: 'room',
    fermentInstructions: 'Use stretch-and-fold technique during 3-4 hour room temp rise. Oil pan generously, press dough to edges, let rest 30 min, press again. Ready when doubled.',
    tips: [
      'Generously oil the pan for crispy bottom',
      'Press dough to edges, let rest, press again',
      'Cheese goes all the way to the edges for frico',
      'Sauce goes on TOP of the cheese, in racing stripes'
    ]
  },

  thinCrispy: {
    id: 'thinCrispy',
    name: 'Thin & Crispy',
    icon: 'thinCrispy',
    description: 'Tavern-style cracker crust, party cut',
    equipment: 'Pizza screen or sheet pan',
    defaults: {
      ballWeight: 180,
      hydration: 0.55,
      salt: 0.02,
      yeast: 0.004,
      oil: 0.02,
      sugar: 0
    },
    flourRecommendation: 'All-purpose flour',
    flourProtein: '10-12%',
    waterTemp: '65-70°F / 18-21°C (cool)',
    bakeTemp: '230-260°C / 450-500°F',
    bakeTime: '8-10 minutes',
    fermentType: 'room',
    fermentInstructions: 'Mix dough and let rest 1-2 hours at room temperature. Roll out thin with a rolling pin. Dock with fork to prevent bubbles. Can also cold ferment overnight for more flavor.',
    tips: [
      'Low hydration = easier to roll thin',
      'Use a rolling pin for even thickness',
      'Dock the dough with a fork to prevent bubbles',
      'Cut into squares, not triangles (party style)'
    ]
  },

  poolishBiga: {
    id: 'poolishBiga',
    name: 'Poolish/Biga',
    icon: 'poolishBiga',
    description: 'Rich, complex flavor from pre-ferment',
    equipment: 'Any oven works',
    defaults: {
      ballWeight: 260,
      hydration: 0.65,
      salt: 0.025,
      yeast: 0.002,
      oil: 0,
      sugar: 0,
      usePreFerment: true,
      preFermentType: 'poolish',
      preFermentFlourPercent: 0.25
    },
    flourRecommendation: '00 or bread flour',
    flourProtein: '11-13%',
    waterTemp: '65-70°F / 18-21°C (cool)',
    bakeTemp: '260-300°C / 500-575°F',
    bakeTime: '5-8 minutes',
    fermentType: 'preferment',
    fermentInstructions: 'Day 1: Mix pre-ferment (flour + water + pinch of yeast), cover, ferment 12-16 hours at room temp until bubbly and domed. Day 2: Mix final dough with pre-ferment. Bulk ferment 2-3 hours. Ball and proof 2-4 hours before stretching.',
    tips: [
      'Poolish (liquid) = more open crumb, mild flavor',
      'Biga (stiff) = more complex flavor, tighter crumb',
      'Start pre-ferment 12-16 hours before final dough',
      'Pre-ferment should be bubbly and slightly domed when ready'
    ]
  },

  emergency: {
    id: 'emergency',
    name: 'Emergency (2hr)',
    icon: 'emergency',
    description: 'Ready in 2 hours. Pizza night rescued!',
    equipment: 'Any oven',
    defaults: {
      ballWeight: 250,
      hydration: 0.60,
      salt: 0.02,
      yeast: 0.01, // Higher yeast for quick rise
      oil: 0.02,
      sugar: 0.01
    },
    flourRecommendation: 'All-purpose or bread flour',
    flourProtein: '10-13%',
    waterTemp: '100-110°F / 38-43°C (warm)',
    bakeTemp: '230-260°C / 450-500°F',
    bakeTime: '8-12 minutes',
    showTimer: true,
    fermentType: 'quick',
    fermentInstructions: 'Use warm water to activate yeast quickly. Mix all ingredients until smooth. Cover and let rise at room temperature for 2 hours until doubled in size. Shape immediately and bake. No cold ferment needed for this quick dough.',
    tips: [
      'Use warm water (100-110°F) to speed up yeast',
      'Higher yeast = faster rise, but less complex flavor',
      'Let dough rest at least 2 hours before shaping',
      'Best for when you need pizza TODAY'
    ]
  },

  custom: {
    id: 'custom',
    name: 'Custom',
    icon: 'custom',
    description: 'Your recipe, your rules',
    equipment: 'Your choice',
    defaults: {
      ballWeight: 250,
      hydration: 0.65,
      salt: 0.02,
      yeast: 0.003,
      oil: 0,
      sugar: 0
    },
    flourRecommendation: 'Your choice',
    flourProtein: 'Varies by flour type',
    waterTemp: 'Varies by fermentation method',
    bakeTemp: 'Varies',
    bakeTime: 'Varies',
    fermentType: 'custom',
    fermentInstructions: 'Adjust fermentation based on your yeast amount: Low yeast (0.1-0.3%) = cold ferment 24-72 hours. Medium yeast (0.3-0.5%) = room temp 4-8 hours or cold 12-24 hours. High yeast (0.5-1%) = room temp 2-4 hours.',
    tips: [
      'Experiment with hydration: 55-75% covers most styles',
      'Salt typically 2-3% of flour weight',
      'Yeast: 0.1-0.5% for cold ferment, 0.5-2% for same-day',
      'Oil adds tenderness, sugar aids browning'
    ]
  }
};

/**
 * Get all style IDs
 * @returns {string[]} Array of style IDs
 */
export function getStyleIds() {
  return Object.keys(PIZZA_STYLES);
}

/**
 * Get a style by ID
 * @param {string} id - Style ID
 * @returns {PizzaStylePreset|undefined} Style preset or undefined
 */
export function getStyleById(id) {
  return PIZZA_STYLES[id];
}

/**
 * Get style defaults
 * @param {string} id - Style ID
 * @returns {Object} Default values for calculator
 */
export function getStyleDefaults(id) {
  const style = PIZZA_STYLES[id];
  return style ? { ...style.defaults } : { ...PIZZA_STYLES.custom.defaults };
}

/**
 * Get all styles as an array
 * @returns {PizzaStylePreset[]} Array of all style presets
 */
export function getAllStyles() {
  return Object.values(PIZZA_STYLES);
}

export default PIZZA_STYLES;
