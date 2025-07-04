
## 3. Initial Setup & User Creation

It's best practice to create a dedicated database user for your development work rather than using the default `postgres` superuser.

```bash
# Connect to the default postgres database as the default user
# (Initially, this might be your macOS username)
psql postgres

# --- Inside psql ---

# Create a new user (role) for development. Use a strong password!
CREATE ROLE dev_user WITH LOGIN PASSWORD 'your_secure_password';

# Give the new user the ability to create databases
ALTER ROLE dev_user CREATEDB;

# Exit psql
\q 
```

*   Replace `'your_secure_password'` with a strong, unique password.
*   You now have a user named `dev_user` that can log in and create databases.

## 4. Creating a Project Database

For each project (like Travelo), you should create a separate database.

```bash
# Connect using the user you just created
psql postgres -U dev_user

# --- Inside psql (as dev_user) ---

# Create a database for your project (e.g., for Travelo testing)
CREATE DATABASE travelo_db_test;

# Optional: List databases to verify creation
\l 

# Exit psql
\q
```

*   You now have a database named `travelo_db_test` owned by `dev_user`.

## 5. Connecting from Applications (.env)

Your applications (like the Node.js backend) will connect using standard database connection parameters. Store these securely in environment variables, typically within a `.env` file at the root of your *project's backend directory*.

**Example `backend/.env` for Travelo:**

```dotenv
# PostgreSQL Connection Details
DB_HOST=localhost       # Use 'localhost' for a locally installed instance
DB_PORT=5432            # Default PostgreSQL port
DB_NAME=travelo_db_test # The database you created for this project
DB_USER=dev_user        # The dedicated user you created
DB_PASSWORD=your_secure_password # The password you set for dev_user

# Other backend variables...
# JWT_SECRET=your_jwt_secret
# FIREBASE_PROJECT_ID=... 
# etc.
```

*   **Important:** Ensure the `.env` file is listed in your project's `.gitignore` to avoid committing credentials.
*   Make sure your application loads these variables (e.g., using the `dotenv` package in Node.js).

## 6. Common `psql` Commands

`psql` is the interactive PostgreSQL terminal.

```bash
# Connect to a specific database as a specific user
psql -d database_name -U user_name

# --- Inside psql ---

\l              # List all databases
\c database_name # Connect to a different database
\dt             # List tables in the current database
\d+ table_name  # Describe a table (columns, types, indexes)
\du             # List users (roles)
\q              # Quit psql
```

## 7. Resetting a Test Database (Use with Caution!)

During testing, you might need to reset your database to a clean state (e.g., before running migrations).

```bash
# Connect to a *different* database (like 'postgres') as a user with privileges
psql postgres -U dev_user 

# --- Inside psql ---

-- Drop the target database (THIS DELETES ALL DATA IN IT)
DROP DATABASE travelo_db_test;

-- Recreate the database
CREATE DATABASE travelo_db_test;

-- Exit psql
\q 
```

*   **Warning:** `DROP DATABASE` is irreversible. Only use this on test databases where data loss is acceptable.
*   After resetting, you'll typically need to run your application's database migrations again.

## 8. Docker Alternative

Running PostgreSQL in Docker is another popular option, especially for ensuring identical environments across machines. You can pull the official image:

```bash
docker run --name some-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
```

Refer to the [Official PostgreSQL Docker Hub page](https://hub.docker.com/_/postgres) for more configuration options. When using Docker, `DB_HOST` in your `.env` would typically be `localhost` if running the container directly, or the service name (e.g., `db`) if using Docker Compose and connecting from another container in the same network. 