# Database Schema Generator

A modern web application that leverages AI to generate and manage database schemas through natural language conversations. Built with Next.js, TypeScript, and MongoDB.

## Features

- 🤖 AI-powered schema generation through natural language conversations
- 💾 Real-time schema visualization and management
- 🔐 Secure authentication with Kinde
- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 📱 Responsive design for all devices
- 🔄 Real-time updates and conversation history
- 🔄 Bridge between NoSQL and SQL databases

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: Kinde
- **AI Integration**: OpenAI API
- **Deployment**: Vercel

## Architecture

### Schema Generation Approach

The application generates database schemas in SQL format for several key reasons:

1. **Universal Compatibility**: SQL is the standard language for database schema definition, making it compatible with most database management systems (MySQL, PostgreSQL, SQLite, etc.).

2. **Precision and Clarity**: SQL's CREATE TABLE syntax provides a clear, unambiguous way to define:

   - Table structures
   - Column types and constraints
   - Primary and foreign key relationships
   - Indexes and other database objects

3. **AI-Friendly Format**: SQL's structured syntax makes it easier for AI models to:

   - Generate consistent and valid schema definitions
   - Parse and validate the output
   - Understand and modify existing schemas

4. **Implementation Benefits**:

   - Direct execution capability in database systems
   - Easy conversion to other schema formats if needed
   - Well-documented and widely understood syntax
   - Rich ecosystem of tools for SQL parsing and manipulation

5. **NoSQL to SQL Bridge**:
   - Perfect for developers transitioning from NoSQL to SQL databases
   - Helps understand SQL schema design patterns through natural language
   - Automatically generates proper relationships and constraints
   - Visualizes SQL concepts in an intuitive way
   - Makes SQL database design accessible to NoSQL developers

### AI Integration

The application uses OpenAI's API to generate database schemas based on user requirements. The process involves:

1. User submits requirements in natural language
2. System processes the input through OpenAI's API
3. AI generates SQL schema definitions
4. System parses and visualizes the generated schema
5. Schema is stored in MongoDB for persistence

### Schema Generation Flow

1. User describes their database requirements
2. AI analyzes requirements and generates appropriate SQL
3. System parses SQL to create visual table representations
4. Generated schema is stored with conversation history
5. User can continue refining the schema through conversation

### Data Storage

- MongoDB stores:
  - User schemas
  - Conversation history
  - Project metadata
  - User preferences

## Getting Started

### Prerequisites

- Node.js 18.x or later
- MongoDB instance
- OpenAI API key
- Kinde account and credentials

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB
MONGODB_URI=your_mongodb_uri

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Kinde
KINDE_CLIENT_ID=your_kinde_client_id
KINDE_CLIENT_SECRET=your_kinde_client_secret
KINDE_ISSUER_URL=your_kinde_issuer_url
KINDE_SITE_URL=your_kinde_site_url
KINDE_POST_LOGIN_REDIRECT_URL=your_post_login_redirect_url
KINDE_POST_LOGOUT_REDIRECT_URL=your_post_logout_redirect_url
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/database-schema.git
cd database-schema
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
database-schema/
├── app/
│   ├── api/
│   │   ├── schema/
│   │   │   ├── chat/      # AI chat endpoint
│   │   │   ├── save/      # Schema save endpoint
│   │   │   └── [id]/      # Individual schema endpoints
│   ├── new-project/       # New project creation page
│   └── project/           # Project management pages
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configurations
└── public/               # Static assets
```

## API Endpoints

### POST /api/schema/chat

Handles AI conversation and schema generation.

### POST /api/schema/save

Saves new schemas to the database.

### GET /api/schema/[id]

Retrieves specific schema by ID.

### PUT /api/schema/[id]

Updates existing schema.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for providing the AI capabilities
- Kinde for authentication services
- MongoDB for database services
- Next.js team for the amazing framework
- shadcn/ui for the beautiful components
