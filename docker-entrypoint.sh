#!/bin/sh

# Start the client
cd /app/client
npm start &

# Start the server
cd /app/server
npm start &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $? 