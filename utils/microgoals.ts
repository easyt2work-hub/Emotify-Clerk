export interface MicroGoal {
  id: string;
  title: string;
  description: string;
  points: number;
}

export function generateMicroGoals(state: { wsas_total: number; reqol10_total: number; triage_level: string }): MicroGoal[] {
  const { wsas_total, reqol10_total, triage_level } = state;
  const goals: MicroGoal[] = [];

  if (wsas_total > 20 || triage_level === 'severe' || triage_level === 'suicide_flag') {
    // Very small functional goals for severe impairment
    goals.push(
      { id: '1', title: "Hydrate", description: "Drink one glass of water.", points: 1 },
      { id: '2', title: "Breathe", description: "Take 3 deep breaths.", points: 1 },
      { id: '3', title: "Stretch", description: "Stand up and stretch for 30 seconds.", points: 1 }
    );
  } else if (wsas_total >= 11 && wsas_total <= 20) {
    // Routine goals for moderate impairment
    goals.push(
      { id: '1', title: "Short Walk", description: "Walk outside for 5 minutes.", points: 2 },
      { id: '2', title: "Study Block", description: "Focus on one task for 15 minutes.", points: 3 },
      { id: '3', title: "Check-in", description: "Text one friend to say hello.", points: 2 }
    );
  } else if (reqol10_total < 15) {
    // Pleasure-based goals for low well-being
    goals.push(
      { id: '1', title: "Listen to Music", description: "Play your favorite song.", points: 2 },
      { id: '2', title: "Comfort Cup", description: "Make a warm tea or coffee.", points: 2 },
      { id: '3', title: "Nature", description: "Look out the window for 2 minutes.", points: 1 }
    );
  } else {
    // General structured daily goals
    goals.push(
      { id: '1', title: "10-min Walk", description: "Take a brisk walk.", points: 3 },
      { id: '2', title: "Do JPMR", description: "Complete a relaxation session.", points: 5 },
      { id: '3', title: "Read", description: "Read a book for 20 minutes.", points: 4 }
    );
  }

  return goals;
}
