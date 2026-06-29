export class ChatbotService {
  private knowledgeBase: Map<string, string> = new Map();

  constructor() {
    this.knowledgeBase.set('hello', 'Hi there! How can I help you today?');
    this.knowledgeBase.set('hi', 'Hello! What can I do for you?');
    this.knowledgeBase.set('help', 'I can help with:\n- Account issues\n- Feature questions\n- Technical support\n- General inquiries');
    this.knowledgeBase.set('pricing', 'Our plans:\n- Free: Basic features\n- Pro: $9.99/month\n- Enterprise: Contact sales');
    this.knowledgeBase.set('contact', 'You can reach support at support@liveat.app or use /help command');
    this.knowledgeBase.set('bye', 'Goodbye! Have a great day!');
    this.knowledgeBase.set('thanks', "You're welcome! Let me know if you need anything else.");
  }

  async processMessage(message: string, userId: string): Promise<string> {
    const lower = message.toLowerCase();
    for (const [key, response] of this.knowledgeBase) {
      if (lower.includes(key)) return response;
    }
    return "I'm not sure about that. Let me connect you with a human agent.";
  }

  async getSmartReplies(message: string): Promise<string[]> {
    return [
      "Thanks for letting me know!",
      "I'll look into that for you.",
      "Is there anything else I can help with?"
    ];
  }

  async summarizeConversation(messages: any[]): Promise<string> {
    return `This conversation had ${messages.length} messages. Main topics: general inquiry, support request.`;
  }
}

export const chatbotService = new ChatbotService();