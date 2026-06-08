# EnoxAI Frontend

EnoxAI Frontend is a React + TypeScript web application that provides a real-time chat interface for interacting with the EnoxAI backend.

## Features

* Real-time AI chat experience
* React + TypeScript architecture
* Fast development workflow using Vite
* Session-based chat conversations
* Responsive user interface
* Integration with EnoxAI Backend APIs

## Prerequisites

Before running the project, ensure you have:

* Node.js (v18 or later recommended)
* npm

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd enoxai-frontend
```

Install dependencies:

```bash
npm install
```

## Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

## Environment Configuration

Create a `.env` file in the project root if required:

```env
VITE_API_URL=http://localhost:8000
```

Replace the URL with your EnoxAI backend endpoint.

## Backend Requirement

This frontend requires the EnoxAI Backend service to be running and accessible.

Ensure the backend API is started before using the chat application.

## Build for Production

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Technology Stack

* React
* TypeScript
* Vite
* HTML5
* CSS3
* EnoxAI Backend API

## Project Structure

```text
src/
├── components/
├── assets/
├── services/
├── hooks/
├── types/
├── App.tsx
└── main.tsx
```

## License

This project is intended for use with the EnoxAI platform.
