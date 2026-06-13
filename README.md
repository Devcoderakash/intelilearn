# InteliLearn

An AI-powered educational platform designed to enhance student learning experiences through intelligent tutoring, performance analysis, and interactive learning tools.

## 🚀 Live Demo

Check out the live demo here: **[https://intelilearn-three.vercel.app/](https://intelilearn-three.vercel.app/)**

## 📋 Features

- **AI Tutor**: Interactive AI-powered tutoring system for personalized learning
- **Performance Analysis**: Track and analyze student performance over time
- **Mock Interview**: Prepare for interviews with AI-generated questions and feedback
- **PYQ Engine**: Practice with previous year questions
- **Video Analyzer**: Analyze educational videos and extract key insights
- **Timetable Scheduler**: Organize study schedule efficiently
- **Internship Engine**: Find and apply for internships
- **Thought Card System**: Organize and manage learning notes
- **Certificate Validator**: Verify educational certificates

## 🛠️ Tech Stack

- **Frontend**: Next.js, TypeScript, React, Tailwind CSS
- **UI Components**: Radix UI
- **AI/ML**: Google Genkit, Cohere API
- **Backend**: Firebase, Supabase
- **Form Management**: React Hook Form, Zod
- **State Management**: React Query
- **Authentication**: Firebase Auth

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Devcoderakash/intelilearn.git
   cd intelilearn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add:
   ```env
   COHERE_API_KEY=your_cohere_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

## 📚 Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Watch mode for Genkit AI development
- `npm run build` - Build the application for production
- `npm start` - Start production server
- `npm run lint` - Run linting
- `npm run typecheck` - Run TypeScript type checking

## 🔑 API Keys Required

### Cohere API
- Used for text embeddings and AI processing
- Get your key from: https://cohere.ai/

### Supabase
- Used for authentication and database
- Get your credentials from: https://supabase.com/

### Firebase
- Configuration is already included in the project
- For custom Firebase setup, modify `src/firebase/config.ts`

## 📁 Project Structure

```
src/
├── ai/                    # AI/Genkit flows and configurations
├── app/                   # Next.js app directory
├── components/            # React components
├── firebase/              # Firebase configuration and utilities
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and services
└── styles/                # Global styles
```

## 🎯 Key Features Explained

### AI Tutor
Provides personalized tutoring based on student queries and learning patterns.

### Performance Analysis
Analyzes student performance and provides insights for improvement.

### Mock Interview
Simulates interviews with AI-generated questions based on topics.

### PYQ Engine
Collection of previous year questions for examination preparation.

### Video Analyzer
Analyzes educational videos and extracts key information and insights.

## 🚀 Deployment

The application is deployed on Vercel. To deploy your own version:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for any bugs or feature requests.

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for better learning experiences**
