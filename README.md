# MCP Web Manager

A comprehensive web-based management system for Model Context Protocol (MCP) servers. This tool provides a modern UI for managing, monitoring, and configuring MCP servers with real-time updates and easy deployment.

## Features

### 🚀 Core Features
- **Dashboard Overview**: Visual display of all MCP servers with status indicators
- **Server Management**: Add, edit, delete, and organize servers in folders
- **Real-time Monitoring**: Live status updates and logs via WebSocket
- **Configuration Editor**: JSON/YAML editor with syntax highlighting
- **Template System**: Pre-built templates for popular MCP servers
- **Multi-Client Support**: Generate configs for Claude Desktop, Cursor, VS Code, etc.

### 🛠 Technical Features
- **Full-Stack TypeScript**: Type-safe development with React/Next.js frontend and Node.js/Express backend
- **Real-time Updates**: WebSocket integration for live server monitoring
- **SQLite Database**: Lightweight, embedded database for configuration storage
- **Docker Support**: Containerized deployment for easy setup
- **Health Monitoring**: Automatic health checks and error reporting
- **Backup/Restore**: Configuration backup and restoration capabilities

### 📱 User Interface
- **Modern Design**: Clean, responsive interface with dark/light mode support
- **Drag & Drop**: Intuitive folder organization with drag-and-drop
- **Search & Filter**: Powerful search and filtering capabilities
- **Mobile Friendly**: Responsive design works on all devices
- **Code Editor**: Monaco editor for advanced configuration editing

## Quick Start

### Option 1: NPX (Recommended)
```bash
npx mcp-web-manager
```

### Option 2: Docker
```bash
docker run -p 3001:3001 -v $(pwd)/data:/app/data mcp-web-manager
```

### Option 3: Docker Compose
```bash
curl -O https://raw.githubusercontent.com/your-repo/mcp-web-manager/main/docker-compose.yml
docker-compose up -d
```

## Installation

### Prerequisites
- Node.js 18+ (if running locally)
- Docker (if using containerized deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/mcp-web-manager.git
   cd mcp-web-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Production Deployment

#### Docker Deployment
```bash
# Build and run with Docker
npm run docker:build
npm run docker:run

# Or use Docker Compose
docker-compose up -d
```

#### Manual Deployment
```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Usage

### Adding Your First Server

1. **Click "Add Server"** in the dashboard
2. **Choose from templates** or create a custom server
3. **Configure settings** like environment variables and arguments
4. **Save and start** the server

### Popular MCP Server Templates

The system includes pre-built templates for:

- **Filesystem**: Access and manipulate files and directories
- **PostgreSQL**: Connect to and query PostgreSQL databases
- **Brave Search**: Search the web using Brave Search API
- **SQLite**: Work with SQLite databases
- **Git**: Git repository operations
- **Time**: Time and date utilities

### Folder Organization

1. **Create folders** to organize your servers
2. **Drag and drop** servers between folders
3. **Enable/disable** entire folders at once
4. **Use color coding** for easy identification

### Configuration Management

#### Export Configurations
```bash
# Export for Claude Desktop
curl http://localhost:3001/api/v1/config/export?client=claude-desktop

# Export for Cursor
curl http://localhost:3001/api/v1/config/export?client=cursor
```

#### Import Existing Configs
1. Go to **Settings** → **Import/Export**
2. Select your existing configuration file
3. Choose which servers to import
4. Click **Import**

### Health Monitoring

The system automatically monitors server health:
- **Green**: Server is running and responding
- **Yellow**: Server is starting or has warnings
- **Red**: Server has errors or is not responding
- **Gray**: Server is stopped

### Logs and Debugging

1. **Click on any server** to view details
2. **Switch to "Logs" tab** to see real-time output
3. **Use the filter** to focus on specific log levels
4. **Download logs** for offline analysis

## API Documentation

### REST API Endpoints

#### Servers
- `GET /api/v1/servers` - List all servers
- `POST /api/v1/servers` - Create a new server
- `GET /api/v1/servers/:id` - Get server details
- `PUT /api/v1/servers/:id` - Update server
- `DELETE /api/v1/servers/:id` - Delete server
- `POST /api/v1/servers/:id/start` - Start server
- `POST /api/v1/servers/:id/stop` - Stop server
- `POST /api/v1/servers/:id/restart` - Restart server

#### Templates
- `GET /api/v1/templates` - List available templates
- `POST /api/v1/servers/from-template` - Create server from template

#### Configuration
- `GET /api/v1/config/export` - Export configuration
- `POST /api/v1/config/import` - Import configuration

### WebSocket Events

#### Client → Server
- `join_server` - Join server room for updates
- `leave_server` - Leave server room

#### Server → Client
- `server_status` - Server status update
- `server_log` - New log entry
- `health_check` - Health check result

## Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=production
LOG_LEVEL=info

# Database
DATABASE_PATH=./data/mcp.db

# Client Configuration
CLIENT_URL=http://localhost:3000

# Optional: Authentication
JWT_SECRET=your-secret-key
ENABLE_AUTH=false
```

### Custom Configuration Path

You can specify a custom configuration directory:

```bash
export MCP_CONFIG_PATH=/path/to/your/config
npm start
```

## Security

### Authentication (Optional)

Enable authentication by setting environment variables:

```bash
ENABLE_AUTH=true
JWT_SECRET=your-very-secure-secret-key
```

### API Security

The application includes:
- **Rate limiting** to prevent abuse
- **Input validation** using Zod schemas
- **CORS protection** for cross-origin requests
- **Helmet.js** for security headers

### File System Access

MCP servers run in isolated processes with:
- **Limited file system access** based on configuration
- **Environment variable isolation**
- **Process sandboxing**

## Troubleshooting

### Common Issues

#### Server Won't Start
1. Check if the command path is correct
2. Verify environment variables are set
3. Ensure dependencies are installed
4. Check the logs for error messages

#### Connection Issues
1. Verify the server is running on the correct port
2. Check firewall settings
3. Ensure WebSocket connections are allowed
4. Try refreshing the browser

#### Database Issues
1. Check file permissions for the data directory
2. Ensure SQLite is properly installed
3. Try deleting the database file to reset

### Getting Help

1. **Check the logs** in the application or `./logs/` directory
2. **Visit the GitHub issues** page
3. **Join our Discord** community
4. **Check the documentation** for detailed guides

## Development

### Project Structure

```
mcp-web-manager/
├── client/                 # React/Next.js frontend
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   └── store/            # State management
├── server/                # Node.js/Express backend
│   ├── database/         # Database models and migrations
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── types/            # TypeScript types
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile           # Docker configuration
└── package.json         # Dependencies and scripts
```

### Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests** for new functionality
5. **Submit a pull request**

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Building for Production

```bash
# Build both client and server
npm run build

# Build only client
npm run client:build

# Build only server
npm run server:build
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

If you find this project helpful, please consider:
- ⭐ **Starring the repository**
- 🐛 **Reporting bugs**
- 💡 **Suggesting features**
- 📖 **Improving documentation**
- 💰 **Sponsoring development**

## Changelog

### v1.0.0
- Initial release with core functionality
- Server management and monitoring
- Template system
- Configuration export/import
- Docker support
- Real-time updates via WebSocket

---

**Made with ❤️ for the MCP community**
