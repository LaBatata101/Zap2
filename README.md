# Zap2 - Real-Time Chat Application

## How It Works

The project is architected as a decoupled frontend and backend application.

- **Backend**: A robust API built with **Django** and **Django REST Framework** handles user authentication, message storage, and business logic. Real-time functionality is powered by **Django Channels**, which uses WebSockets to instantly deliver new messages to connected clients. All data is stored in a **PostgreSQL** database, and **Redis** is used as a message broker for the channel layer.

- **Frontend**: A dynamic and responsive Single Page Application (SPA) built with React and TypeScript. It communicates with the backend via the REST API for initial data loading (like chat rooms and message history) and establishes a WebSocket connection for receiving real-time updates. The UI is built with Material-UI (MUI) for a clean and modern look, and it's fully responsive for both desktop and mobile use.

## Key Features

- **User Authentication**: Secure user registration and login system.

- **Chat Rooms**: Users can join public rooms or create their own.

- **Real-Time Messaging**: Messages appear instantly without needing to refresh the page, thanks to WebSockets.

- **Media Attachments**: Send images and videos. The app displays a grid preview for multiple files and includes a full-screen lightbox for viewing.

- **Message Replies**: Reply directly to specific messages for threaded conversations.

- **Unread Message Tracking**: Each room shows a count of unread messages. When a room is opened, the view automatically scrolls to the first unread message.

- **Rich UI/UX**:
    - Messages from the same user are grouped together for better readability.
    - An emoji picker is available for adding expressions to messages.
    - Drag-and-drop support for file attachments.
    - A "scroll to bottom" button appears when you scroll up through the message history.
    - Responsive design that adapts to mobile and desktop screens.

## Getting Started

To get the project up and running locally, you'll need to have Docker and Docker Compose installed.

### 1. Clone the Repository

```bash
git clone https://github.com/LaBatata101/Zap2 && cd Zap2
```

### 2. Setup Environment variables for the Backend

Create a `.env` file in the root of the project with the following contents.

```
POSTGRES_DB=dev_db
POSTGRES_USER=dev_user
POSTGRES_PASSWORD=123456
DB_NAME=dev_db
DB_USER=dev_user
DB_PASS=123456
DB_HOST=db
DB_PORT=5432
```

> **Note**: The `DB_HOST` is set to db, which is the service name of the PostgreSQL container in the `docker-compose.yml` file.

### 3. Build and Run the Containers

From the root directory of the project, run the following command:

```bash
docker-compose up --build -d
```

This command will build the Docker images for the frontend and backend services and start all the containers in detached mode (`-d`).

### 4. Apply Database Migrations

Once the containers are running, you need to apply the initial database migrations for the Django application.

```bash
docker-compose exec backend uv manage.py migrate
```

### 5. Access the Application

You're all set! The application is now running.

- **Frontend**: Open your browser and go to [http://localhost:5173]()
- **Backend API**: The API is accessible at [http://localhost:8000/api/]()
